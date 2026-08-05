// Script to restore or view Firebase history
// Run this in browser console at: https://bolttech-kamilamolas.github.io/alfinator/?admin

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD4-D3dN22UlqKc8-PLfdwQl83vmbdbh4s",
    authDomain: "alfinator.firebaseapp.com",
    databaseURL: "https://alfinator-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "alfinator",
    storageBucket: "alfinator.firebasestorage.app",
    messagingSenderId: "476621019100",
    appId: "1:476621019100:web:d4929e269c4abdf694e119"
};

// VIEW HISTORY
async function viewAllHistory() {
    console.log('=== VIEWING ALL HISTORY ===');
    
    const db = firebase.database();
    const snapshot = await db.ref('history').once('value');
    const data = snapshot.val();
    
    console.log('History structure:', data);
    return data;
}

// RESTORE HISTORY (if accidentally deleted)
async function restoreHistory(historyData) {
    console.log('=== RESTORING HISTORY ===');
    console.log('Data to restore:', historyData);
    
    const db = firebase.database();
    const result = await db.ref('history/current').set(historyData);
    
    console.log('✓ History restored!');
    location.reload();
}

// EXAMPLE: Restore with known data
// historyData = {
//   'key1': { name: 'Alice', date: 'wtorek, 5 sierpnia', timestamp: '2026-08-05T10:00:00Z' },
//   'key2': { name: 'Bob', date: 'wtorek, 5 sierpnia', timestamp: '2026-08-05T11:00:00Z' }
// }
// restoreHistory(historyData);

// VIEW AUDIT LOG (to see what happened)
async function viewAuditLog() {
    console.log('=== AUDIT LOG ===');
    
    const db = firebase.database();
    const snapshot = await db.ref('audit_log').once('value');
    const data = snapshot.val();
    
    console.log('Audit log:', data);
    return data;
}

// Usage:
// 1. View history: viewAllHistory()
// 2. View audit: viewAuditLog()
// 3. Copy history data and use: restoreHistory({ ... })
