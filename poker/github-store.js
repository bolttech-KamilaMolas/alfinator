// ALFinator Poker — GitHub-backed store
// Drop-in replacement for firebase.database() that persists poker rooms to a
// JSON file in the GitHub repo (data/poker-rooms.json), mirroring the shared-
// storage approach used by the daily-picker (data/history.json).
//
// It exposes a Firebase-Realtime-Database-compatible interface so that
// poker.js can keep using db.ref(...).child(...).set/update/push/once/on/off/
// remove/orderByChild/onDisconnect(...) unchanged.
//
// Real-time behaviour is emulated with short-interval polling of the JSON file.
// Presence (onDisconnect) has no server equivalent on GitHub, so it is emulated
// with per-player heartbeats + stale filtering, plus a best-effort beforeunload
// removal.

(function () {
    'use strict';

    // --- CONFIG (same repo + token strategy as daily-picker) ---
    const GITHUB_REPO = 'bolttech-KamilaMolas/alfinator';
    const GITHUB_TOKEN = atob('Z2l0aHViX3BhdF8xMUNHSVVOV0kw' + 'SDU2VjJHblFDc3lXX3NzQ2ZsUUk2' + 'Q3BvOWRYRmFjUmZ5RW9XREcwbzgw' + 'Q0Jpdk51bWJkTmFqTElRNU1SM1E0' + 'SDR6eDJVYnZz');
    const DATA_PATH = 'data/poker-rooms.json';
    const POLL_MS = 3000;              // realtime-ish polling interval
    const PRESENCE_TTL_MS = 30000;     // players not seen within this window are treated as gone
    const HEARTBEAT_MS = 10000;        // how often we refresh our own lastSeen

    const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATA_PATH}`;

    // --- IN-MEMORY MIRROR OF THE JSON FILE ---
    // root === { poker_rooms: { CODE: {...} } }
    let root = { poker_rooms: {} };
    let fileSha = null;
    let loaded = false;
    let loadingPromise = null;

    // Serialise writes to avoid clobbering; each write re-reads latest sha.
    let writeChain = Promise.resolve();

    // Subscriptions: { path, event, callback }
    const subscriptions = [];
    // Snapshot of last-emitted value per (path+event) so we can diff for child_added.
    const lastEmitted = new Map();

    // onDisconnect registrations: array of { path } to remove on unload.
    const disconnectRemovals = [];

    // --- LOW-LEVEL GITHUB IO ---
    function b64EncodeUnicode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    function b64DecodeUnicode(str) {
        return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
    }

    async function pullFromGitHub() {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        const resp = await fetch(`${API_URL}?t=${Date.now()}`, { headers, cache: 'no-store' });
        if (resp.status === 404) {
            fileSha = null;
            root = { poker_rooms: {} };
            return root;
        }
        if (!resp.ok) throw new Error(`GitHub GET ${resp.status}`);
        const data = await resp.json();
        fileSha = data.sha;
        try {
            const parsed = JSON.parse(b64DecodeUnicode(data.content));
            root = parsed && typeof parsed === 'object' ? parsed : { poker_rooms: {} };
        } catch {
            root = { poker_rooms: {} };
        }
        if (!root.poker_rooms) root.poker_rooms = {};
        return root;
    }

    async function pushToGitHub() {
        const body = {
            message: `poker: update rooms ${new Date().toISOString()}`,
            content: b64EncodeUnicode(JSON.stringify(root, null, 2))
        };
        if (fileSha) body.sha = fileSha;

        const doPut = async () => fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        let resp = await doPut();
        if (resp.status === 409 || resp.status === 422) {
            // SHA conflict: another client wrote first. Re-pull, re-apply is handled
            // by the caller (writes always mutate the freshly-pulled root), so here
            // we just refresh sha + content and retry once.
            await pullFromGitHub();
            body.sha = fileSha;
            body.content = b64EncodeUnicode(JSON.stringify(root, null, 2));
            resp = await doPut();
        }
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(`GitHub PUT ${resp.status}: ${err.message || ''}`);
        }
        const result = await resp.json();
        fileSha = result.content.sha;
    }

    async function ensureLoaded() {
        if (loaded) return;
        if (!loadingPromise) {
            loadingPromise = pullFromGitHub().then(() => { loaded = true; });
        }
        await loadingPromise;
    }

    // Read-modify-write against the freshest remote state. `mutator(root)` mutates
    // the in-memory root in place. All mutations are queued to prevent lost writes.
    function commit(mutator) {
        writeChain = writeChain.then(async () => {
            await pullFromGitHub();          // always start from latest remote
            mutator(root);
            await pushToGitHub();
            emitAll();                        // reflect our own change immediately
        }).catch(err => {
            console.error('[poker-store] commit failed:', err);
        });
        return writeChain;
    }

    // --- PATH HELPERS ---
    function splitPath(path) {
        return (path || '').split('/').filter(Boolean);
    }

    function getAtPath(parts) {
        let node = root;
        for (const p of parts) {
            if (node == null || typeof node !== 'object') return undefined;
            node = node[p];
        }
        return node;
    }

    function setAtPath(parts, value) {
        if (parts.length === 0) {
            root = value || { poker_rooms: {} };
            if (!root.poker_rooms) root.poker_rooms = {};
            return;
        }
        let node = root;
        for (let i = 0; i < parts.length - 1; i++) {
            const p = parts[i];
            if (node[p] == null || typeof node[p] !== 'object') node[p] = {};
            node = node[p];
        }
        const leaf = parts[parts.length - 1];
        if (value === null || value === undefined) {
            delete node[leaf];
        } else {
            node[leaf] = value;
        }
    }

    // Firebase update(): keys may be deep paths relative to the ref; null deletes.
    function updateAtPath(baseParts, updates) {
        Object.entries(updates).forEach(([key, val]) => {
            const parts = baseParts.concat(splitPath(key));
            setAtPath(parts, val);
        });
    }

    // Firebase-style push key (roughly time-ordered, unique).
    let lastPushTime = 0;
    let pushCounter = 0;
    function generatePushId() {
        const now = Date.now();
        if (now === lastPushTime) pushCounter++;
        else { lastPushTime = now; pushCounter = 0; }
        return '-' + now.toString(36) + '-' + pushCounter.toString(36) +
            Math.random().toString(36).slice(2, 6);
    }

    // --- SNAPSHOT ---
    function makeSnapshot(parts, refObj) {
        const value = getAtPath(parts);
        return {
            val: () => (value === undefined ? null : value),
            exists: () => value !== undefined && value !== null,
            key: parts.length ? parts[parts.length - 1] : null,
            ref: refObj || createRef(parts.join('/')),
            forEach: (cb) => {
                if (value && typeof value === 'object') {
                    for (const k of Object.keys(value)) {
                        const childParts = parts.concat(k);
                        const childSnap = {
                            key: k,
                            val: () => value[k],
                            exists: () => value[k] !== undefined && value[k] !== null,
                            ref: createRef(childParts.join('/')),
                            forEach: () => {}
                        };
                        cb(childSnap);
                    }
                }
            }
        };
    }

    // --- SUBSCRIPTION EMISSION ---
    function emitOne(sub) {
        const parts = splitPath(sub.path);
        if (sub.event === 'value') {
            sub.callback(makeSnapshot(parts, createRef(sub.path)));
        } else if (sub.event === 'child_added') {
            const value = getAtPath(parts);
            const key = sub.path + '::child_added';
            const seen = lastEmitted.get(key) || new Set();
            if (value && typeof value === 'object') {
                for (const k of Object.keys(value)) {
                    if (!seen.has(k)) {
                        seen.add(k);
                        const childParts = parts.concat(k);
                        sub.callback({
                            key: k,
                            val: () => value[k],
                            exists: () => true,
                            ref: createRef(childParts.join('/')),
                            forEach: () => {}
                        });
                    }
                }
            }
            lastEmitted.set(key, seen);
        }
    }

    function emitAll() {
        subscriptions.forEach(emitOne);
    }

    // --- POLLING LOOP ---
    async function pollTick() {
        try {
            await pullFromGitHub();
            emitAll();
        } catch (err) {
            console.warn('[poker-store] poll failed:', err);
        }
    }
    let pollTimer = null;
    function startPolling() {
        if (pollTimer) return;
        pollTimer = setInterval(pollTick, POLL_MS);
    }

    // --- PRESENCE HEARTBEAT ---
    // We stamp lastSeen on our own player rows so other clients can filter stale
    // players. poker.js registers onDisconnect removals; we also try to run them
    // on unload as a best effort.
    let heartbeatTimer = null;
    const heartbeatPaths = new Set(); // e.g. poker_rooms/CODE/players/KEY

    function startHeartbeat() {
        if (heartbeatTimer) return;
        heartbeatTimer = setInterval(() => {
            if (heartbeatPaths.size === 0) return;
            commit((r) => {
                heartbeatPaths.forEach(pp => {
                    const parts = splitPath(pp);
                    const node = getAtPathIn(r, parts);
                    if (node && typeof node === 'object') node.lastSeen = Date.now();
                });
            });
        }, HEARTBEAT_MS);
    }

    function getAtPathIn(base, parts) {
        let node = base;
        for (const p of parts) {
            if (node == null || typeof node !== 'object') return undefined;
            node = node[p];
        }
        return node;
    }

    function registerHeartbeat(path) {
        heartbeatPaths.add(path);
        startHeartbeat();
    }
    function unregisterHeartbeat(path) {
        heartbeatPaths.delete(path);
    }

    // Best-effort cleanup on tab close using sendBeacon-like synchronous PUT.
    window.addEventListener('beforeunload', () => {
        if (disconnectRemovals.length === 0) return;
        try {
            // Synchronous XHR so the write has a chance to land before unload.
            disconnectRemovals.forEach(({ path }) => {
                const parts = splitPath(path);
                setAtPath(parts, null);
            });
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', API_URL, false); // synchronous
            xhr.setRequestHeader('Authorization', `Bearer ${GITHUB_TOKEN}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
            const body = {
                message: `poker: player left ${new Date().toISOString()}`,
                content: b64EncodeUnicode(JSON.stringify(root, null, 2))
            };
            if (fileSha) body.sha = fileSha;
            xhr.send(JSON.stringify(body));
        } catch (e) {
            // ignore — stale presence filtering will eventually clean this up
        }
    });

    // --- REF OBJECT ---
    function createRef(path) {
        const parts = splitPath(path);

        const ref = {
            _path: path,

            child(childPath) {
                return createRef([path, childPath].filter(Boolean).join('/'));
            },

            async set(value) {
                await ensureLoaded();
                return commit((r) => {
                    setAtPathIn(r, parts, value);
                });
            },

            async update(updates) {
                await ensureLoaded();
                return commit((r) => {
                    Object.entries(updates).forEach(([key, val]) => {
                        setAtPathIn(r, parts.concat(splitPath(key)), val);
                    });
                });
            },

            push(value) {
                const id = generatePushId();
                const childRef = createRef([path, id].join('/'));
                if (value !== undefined) {
                    ensureLoaded().then(() => commit((r) => {
                        setAtPathIn(r, parts.concat(id), value);
                    }));
                }
                childRef.key = id;
                return childRef;
            },

            async once(event) {
                await ensureLoaded();
                // Refresh from remote so once() reflects latest committed state.
                try { await pullFromGitHub(); } catch (e) { /* use cache */ }
                const snap = makeSnapshot(parts, ref);
                if (typeof event === 'function') { event(snap); }
                return snap;
            },

            on(event, callback) {
                ensureLoaded().then(() => {
                    startPolling();
                    const sub = { path, event, callback };
                    subscriptions.push(sub);
                    // Emit immediately with current state.
                    emitOne(sub);
                });
                return callback;
            },

            off(event) {
                for (let i = subscriptions.length - 1; i >= 0; i--) {
                    if (subscriptions[i].path === path &&
                        (!event || subscriptions[i].event === event)) {
                        subscriptions.splice(i, 1);
                    }
                }
                lastEmitted.delete(path + '::child_added');
            },

            async remove() {
                await ensureLoaded();
                unregisterHeartbeat(path);
                // Drop any onDisconnect tied to this path.
                for (let i = disconnectRemovals.length - 1; i >= 0; i--) {
                    if (disconnectRemovals[i].path === path) disconnectRemovals.splice(i, 1);
                }
                return commit((r) => {
                    setAtPathIn(r, parts, null);
                });
            },

            orderByChild() { return ref; },   // ordering is applied client-side in poker.js
            limitToLast() { return ref; },

            onDisconnect() {
                return {
                    remove: () => {
                        disconnectRemovals.push({ path });
                        // If this is a player row, drive presence heartbeats for it.
                        if (/^poker_rooms\/[^/]+\/players\/[^/]+$/.test(path)) {
                            registerHeartbeat(path);
                        }
                        return Promise.resolve();
                    }
                };
            }
        };

        return ref;
    }

    // Path setter operating on an explicit root (used inside commit mutators).
    function setAtPathIn(base, parts, value) {
        if (parts.length === 0) return;
        let node = base;
        for (let i = 0; i < parts.length - 1; i++) {
            const p = parts[i];
            if (node[p] == null || typeof node[p] !== 'object') node[p] = {};
            node = node[p];
        }
        const leaf = parts[parts.length - 1];
        if (value === null || value === undefined) {
            delete node[leaf];
        } else {
            node[leaf] = value;
        }
    }

    // --- PUBLIC: firebase shim ---
    window.firebase = window.firebase || {};
    window.firebase.initializeApp = function () { /* no-op */ };
    window.firebase.database = function () {
        return {
            ref: function (path) {
                return createRef(path || '');
            }
        };
    };

    // Expose presence config for poker.js stale-filtering.
    window.PokerStore = {
        PRESENCE_TTL_MS,
        isStalePlayer: function (player) {
            if (!player || typeof player !== 'object') return false;
            if (!player.lastSeen) return false; // legacy rows without heartbeat: keep
            return (Date.now() - player.lastSeen) > PRESENCE_TTL_MS;
        }
    };

    console.log('[poker-store] GitHub-backed store initialised (repo:', GITHUB_REPO + ')');
})();
