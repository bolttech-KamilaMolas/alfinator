/**
 * Firebase to API adapter for Releases
 * Replaces Firebase calls with HTTP API calls to Turso backend
 * 
 * Usage: Include this before releases.js
 * 
 * Original Firebase structure:
 *   db.ref('releases').push(release) → POST /api/releases
 *   db.ref('releases/{id}').update(data) → PUT /api/releases/{id}
 * 
 * Mock Firebase interface using Turso backend
 */

const FirebaseAdapterReleases = (() => {
    const API_BASE = 'http://localhost:3002/api/releases';

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
            // push(data) - create new release
            push: async function(data) {
                try {
                    const result = await fetch(`${API_BASE}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    }).then(r => r.json());
                    return { key: result.id, val: () => result };
                } catch (error) {
                    console.error('Push failed:', error);
                    throw error;
                }
            },

            // on('value', callback) - listen for all releases
            on: function(event, callback) {
                if (event !== 'value') return;

                const poll = async () => {
                    try {
                        const data = await fetch(`${API_BASE}`)
                            .then(r => r.json());
                        
                        const snapshot = {
                            val: () => {
                                const obj = {};
                                data.forEach(release => {
                                    obj[release.id] = release;
                                });
                                return obj;
                            },
                            forEach: (cb) => {
                                data.forEach(release => {
                                    cb({
                                        key: release.id,
                                        val: () => release,
                                        ref: { remove: () => {} }
                                    });
                                });
                            }
                        };
                        callback(snapshot);
                    } catch (error) {
                        console.error('Listen failed:', error);
                    }
                };

                // Poll every 3 seconds
                poll();
                setInterval(poll, 3000);
            },

            // update(data) - update specific fields
            update: async function(data) {
                try {
                    const id = path.split('/')[1];
                    if (!id) throw new Error('Invalid path for update');
                    
                    await fetch(`${API_BASE}/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (error) {
                    console.error('Update failed:', error);
                    throw error;
                }
            },

            // set(data) - replace entire release
            set: async function(data) {
                try {
                    const id = path.split('/')[1];
                    if (!id) throw new Error('Invalid path for set');
                    
                    await fetch(`${API_BASE}/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (error) {
                    console.error('Set failed:', error);
                    throw error;
                }
            },

            // remove() - delete release
            remove: async function() {
                try {
                    const id = path.split('/')[1];
                    if (!id) throw new Error('Invalid path for remove');
                    
                    await fetch(`${API_BASE}/${id}`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    console.error('Remove failed:', error);
                    throw error;
                }
            },

            // once(event) - fetch once instead of listening
            once: async function(event) {
                try {
                    if (path === 'releases') {
                        const data = await fetch(`${API_BASE}`)
                            .then(r => r.json());
                        
                        return {
                            val: () => {
                                const obj = {};
                                data.forEach(release => {
                                    obj[release.id] = release;
                                });
                                return obj;
                            },
                            forEach: (cb) => {
                                data.forEach(release => {
                                    cb({
                                        key: release.id,
                                        val: () => release,
                                        ref: { remove: () => {} }
                                    });
                                });
                            }
                        };
                    } else {
                        const id = path.split('/')[1];
                        const result = await fetch(`${API_BASE}/${id}`)
                            .then(r => r.json());
                        return {
                            val: () => result,
                            forEach: () => {} // Not needed for single fetch
                        };
                    }
                } catch (error) {
                    console.error('Once failed:', error);
                }
            },

            // Chainable methods
            orderByChild: function(field) {
                return this;
            },

            limitToFirst: function(count) {
                return this;
            }
        };
    }

    return {
        init: function() {
            console.log('Firebase adapter for Releases initialized - using Turso backend');
        }
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    FirebaseAdapterReleases.init();
});
