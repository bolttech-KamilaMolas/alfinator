/**
 * Firebase to API adapter for Poker
 * Replaces Firebase calls with HTTP API calls to Turso backend
 * 
 * Usage: Include this before poker.js
 * 
 * Original Firebase structure:
 *   db.ref('poker_rooms').push(room) → POST /api/poker/rooms
 *   db.ref('poker_rooms/{roomCode}/players').push(player) → POST /api/poker/rooms/{roomCode}/players
 *   db.ref('poker_rooms/{roomCode}/estimates').push(estimate) → POST /api/poker/rooms/{roomCode}/estimates
 * 
 * Mock Firebase interface using Turso backend
 */

const FirebaseAdapter = (() => {
    const API_BASE = 'http://localhost:3002/api/poker';

    // Polyfill Firebase.database() with our adapter
    window.firebase = window.firebase || {};
    window.firebase.database = function() {
        return {
            ref: function(path) {
                return createRefObject(path);
            }
        };
    };

    function createRefObject(path) {
        return {
            // push(data) - create new room/player/estimate
            push: async function(data) {
                try {
                    const parts = path.split('/');
                    let result;

                    if (path === 'poker_rooms') {
                        result = await fetch(`${API_BASE}/rooms`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        }).then(r => r.json());
                        return { key: result.id, val: () => result };
                    }

                    if (path.includes('players')) {
                        const roomCode = parts[1]; // poker_rooms/{roomCode}/players
                        result = await fetch(`${API_BASE}/rooms/${roomCode}/players`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        }).then(r => r.json());
                        return { key: result.room_id, val: () => result };
                    }

                    if (path.includes('estimates')) {
                        const roomCode = parts[1];
                        result = await fetch(`${API_BASE}/rooms/${roomCode}/estimates`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        }).then(r => r.json());
                        return { key: result.room_id, val: () => result };
                    }
                } catch (error) {
                    console.error('Push failed:', error);
                    throw error;
                }
            },

            // on('value', callback) - listen for changes
            on: function(event, callback) {
                if (event !== 'value') return;

                const poll = async () => {
                    try {
                        const parts = path.split('/');
                        let data = [];

                        if (path === 'poker_rooms') {
                            data = await fetch(`${API_BASE}/rooms`)
                                .then(r => r.json());
                            // Convert to Firebase format
                            const snapshot = {
                                val: () => {
                                    const obj = {};
                                    data.forEach(room => {
                                        obj[room.room_code] = room;
                                    });
                                    return obj;
                                },
                                forEach: (cb) => {
                                    data.forEach(room => {
                                        cb({
                                            key: room.room_code,
                                            val: () => room,
                                            ref: { remove: () => {} }
                                        });
                                    });
                                }
                            };
                            callback(snapshot);
                        }
                    } catch (error) {
                        console.error('Listen failed:', error);
                    }
                };

                // Poll every 2 seconds
                poll();
                setInterval(poll, 2000);
            },

            // remove() - delete data
            remove: async function() {
                // Implement if needed
                console.log('Remove called on path:', path);
            },

            // orderByChild, limitToLast - chainable methods (return self)
            orderByChild: function(field) {
                return this;
            },

            limitToLast: function(count) {
                return this;
            },

            once: async function(event) {
                // Fetch once instead of listening
                try {
                    const parts = path.split('/');
                    let data;

                    if (path === 'poker_rooms') {
                        data = await fetch(`${API_BASE}/rooms`)
                            .then(r => r.json());
                        return {
                            val: () => {
                                const obj = {};
                                data.forEach(room => {
                                    obj[room.room_code] = room;
                                });
                                return obj;
                            },
                            forEach: (cb) => {
                                data.forEach(room => {
                                    cb({
                                        key: room.room_code,
                                        val: () => room,
                                        ref: { remove: () => {} }
                                    });
                                });
                            }
                        };
                    }
                } catch (error) {
                    console.error('Once failed:', error);
                }
            },

            // update(data) - update specific fields
            update: async function(data) {
                console.log('Update called:', path, data);
            },

            // set(data) - replace entire path
            set: async function(data) {
                console.log('Set called:', path, data);
            }
        };
    }

    return {
        init: function() {
            console.log('Firebase adapter initialized - using Turso backend');
        }
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    FirebaseAdapter.init();
});
