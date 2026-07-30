// ALFinator Poker — Planning Poker with DEV/QA split
// Firebase real-time rooms, team data from Excel (same source as daily-picker)

(function () {
    'use strict';

    // --- FIREBASE CONFIG (same project as daily-picker) ---
    const firebaseConfig = {
        apiKey: "AIzaSyD4-D3dN22UlqKc8-PLfdwQl83vmbdbh4s",
        authDomain: "alfinator.firebaseapp.com",
        databaseURL: "https://alfinator-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "alfinator",
        storageBucket: "alfinator.firebasestorage.app",
        messagingSenderId: "476621019100",
        appId: "1:476621019100:web:d4929e269c4abdf694e119"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // --- CONFIG ---
    const EXCEL_URL = 'https://bolttech-kamilamolas.github.io/alfinator/data/capacity.xlsx';
    const FIBONACCI = ['1', '2', '3', '5', '8', '13', '21', '?', '\u2615'];
    const MD_CARDS = ['2h', '4h', '6h', '1d', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', '10d', '10+'];
    const NUMERIC_VALUES = { '1': 1, '2': 2, '3': 3, '5': 5, '8': 8, '13': 13, '21': 21 };
    const MD_NUMERIC_VALUES = {
        '2h': 0.25, '4h': 0.5, '6h': 0.75, '1d': 1, '2d': 2, '3d': 3, '4d': 4,
        '5d': 5, '6d': 6, '7d': 7, '8d': 8, '9d': 9, '10d': 10, '10+': 10
    };

    // Skillset classification
    const DEV_SKILLSETS = ['BE Developer', 'FE Developer'];
    const QA_SKILLSETS = ['QA coordinator', 'QAA', 'QA'];

    // --- STATE ---
    let teamMembers = []; // { fullName, skillset, role: 'dev'|'qa'|'other' }
    let currentRoom = null;
    let currentPlayer = null;
    let isModerator = false;
    let roomRef = null;
    let listeners = [];
    let currentUnit = 'md';
    let sessionEstimates = []; // { issue, devEstimate, qaEstimate }
    let isLeaving = false;

    // --- DOM REFS ---
    const lobbySection = document.getElementById('lobbySection');
    const gameSection = document.getElementById('gameSection');
    const moderatorName = document.getElementById('moderatorName');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const playerName = document.getElementById('playerName');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const copyRoomBtn = document.getElementById('copyRoomBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    const participantCount = document.getElementById('participantCount');
    const issueDisplay = document.getElementById('issueDisplay');
    const issueControls = document.getElementById('issueControls');
    const issueInput = document.getElementById('issueInput');
    const setIssueBtn = document.getElementById('setIssueBtn');
    const cardsSection = document.getElementById('cardsSection');
    const cardsDeck = document.getElementById('cardsDeck');
    const devPlayersList = document.getElementById('devPlayersList');
    const qaPlayersList = document.getElementById('qaPlayersList');
    const otherPlayersList = document.getElementById('otherPlayersList');
    const otherGroup = document.getElementById('otherGroup');
    const moderatorActions = document.getElementById('moderatorActions');
    const revealBtn = document.getElementById('revealBtn');
    const nextRoundBtn = document.getElementById('nextRoundBtn');
    const resultsPanel = document.getElementById('resultsPanel');
    const devVotes = document.getElementById('devVotes');
    const qaVotes = document.getElementById('qaVotes');
    const devSummary = document.getElementById('devSummary');
    const qaSummary = document.getElementById('qaSummary');
    const resultTotal = document.getElementById('resultTotal');
    const finalEstimate = document.getElementById('finalEstimate');
    const finalDev = document.getElementById('finalDev');
    const finalQa = document.getElementById('finalQa');
    const saveFinalBtn = document.getElementById('saveFinalBtn');
    const sessionSummary = document.getElementById('sessionSummary');
    const summaryBody = document.getElementById('summaryBody');
    const totalDev = document.getElementById('totalDev');
    const totalQa = document.getElementById('totalQa');
    const totalAll = document.getElementById('totalAll');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const unitToggle = document.getElementById('unitToggle');

    // --- UTILITIES ---
    function generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    function classifySkillset(skillset) {
        const s = (skillset || '').trim();
        if (DEV_SKILLSETS.some(d => s.toLowerCase().includes(d.toLowerCase()))) return 'dev';
        if (QA_SKILLSETS.some(q => s.toLowerCase().includes(q.toLowerCase()))) return 'qa';
        return 'other';
    }

    function populatePlayerSelects() {
        const selects = [moderatorName, playerName];
        selects.forEach(select => {
            // Keep the placeholder option
            select.innerHTML = '<option value="" disabled selected>Wybierz siebie...</option>';

            // Group by role
            const devs = teamMembers.filter(m => m.role === 'dev');
            const qas = teamMembers.filter(m => m.role === 'qa');
            const others = teamMembers.filter(m => m.role === 'other');

            if (devs.length > 0) {
                const group = document.createElement('optgroup');
                group.label = '\ud83d\udd27 DEV';
                devs.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.fullName;
                    opt.textContent = m.fullName;
                    group.appendChild(opt);
                });
                select.appendChild(group);
            }

            if (qas.length > 0) {
                const group = document.createElement('optgroup');
                group.label = '\ud83e\uddea QA';
                qas.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.fullName;
                    opt.textContent = m.fullName;
                    group.appendChild(opt);
                });
                select.appendChild(group);
            }

            if (others.length > 0) {
                const group = document.createElement('optgroup');
                group.label = '\ud83d\udc64 Inni';
                others.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.fullName;
                    opt.textContent = m.fullName;
                    group.appendChild(opt);
                });
                select.appendChild(group);
            }
        });
    }

    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function getUnitLabel() {
        return currentUnit === 'md' ? 'MD' : 'SP';
    }

    // --- EXCEL LOADING ---
    async function loadTeamFromExcel() {
        try {
            const response = await fetch(EXCEL_URL + '?t=' + Date.now());
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            const sheetName = workbook.SheetNames.find(
                n => n.toLowerCase().includes('capacity')
            ) || workbook.SheetNames[0];

            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            parseTeamData(json);
            populatePlayerSelects();
        } catch (err) {
            console.warn('Could not load team from Excel:', err);
            // App still works — selects will be empty, fallback below
        }
    }

    function parseTeamData(rows) {
        let headerRowIndex = -1;
        let nameCol = -1, surnameCol = -1, fullNameCol = -1, skillsetCol = -1, teamCol = -1;

        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i].map(c => String(c).trim().toUpperCase());
            const ni = row.indexOf('NAME');
            const ti = row.indexOf('TEAM');

            if (ni !== -1 && ti !== -1) {
                headerRowIndex = i;
                nameCol = ni;
                surnameCol = row.indexOf('SURNAME');
                fullNameCol = row.indexOf('FULL NAME');
                skillsetCol = row.indexOf('SKILLSET');
                teamCol = ti;
                break;
            }
        }

        if (headerRowIndex === -1) return;

        teamMembers = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            const team = String(row[teamCol] || '').trim().toUpperCase();
            if (team !== 'ALF') continue;

            const name = String(row[nameCol] || '').trim();
            if (!name) continue;

            const surname = surnameCol >= 0 ? String(row[surnameCol] || '').trim() : '';
            const fullName = fullNameCol >= 0
                ? (String(row[fullNameCol] || '').trim() || `${name} ${surname}`)
                : `${name} ${surname}`;
            const skillset = skillsetCol >= 0 ? String(row[skillsetCol] || '').trim() : '';
            const role = classifySkillset(skillset);

            teamMembers.push({ fullName, skillset, role });
        }
    }

    // --- ROOM MANAGEMENT ---
    function getRoomDisplayName() {
        const today = new Date().toLocaleDateString('pl-PL', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        return `ALF Refinement - ${today}`;
    }

    function createRoom(moderatorFullName) {
        const code = generateRoomCode();
        const member = findTeamMember(moderatorFullName);
        const role = member ? member.role : 'other';

        currentRoom = code;
        currentPlayer = { name: moderatorFullName, role, moderator: true };
        isModerator = true;

        roomRef = db.ref('poker_rooms/' + code);
        roomRef.set({
            created: new Date().toISOString(),
            name: getRoomDisplayName(),
            moderator: moderatorFullName,
            unit: currentUnit,
            state: 'voting', // voting | revealed
            currentIssue: '',
            players: {
                [sanitizeKey(moderatorFullName)]: {
                    name: moderatorFullName,
                    role: role,
                    moderator: true,
                    vote: null
                }
            },
            estimates: {}
        });

        // Clean up room on disconnect (if moderator leaves)
        roomRef.child('players/' + sanitizeKey(moderatorFullName))
            .onDisconnect().remove();

        enterRoom();
    }

    function joinRoom(code, playerFullName) {
        code = code.trim().toUpperCase();
        roomRef = db.ref('poker_rooms/' + code);

        roomRef.once('value', (snapshot) => {
            if (!snapshot.exists()) {
                showToast('Pokój nie istnieje!');
                return;
            }

            const member = findTeamMember(playerFullName);
            const role = member ? member.role : 'other';

            currentRoom = code;
            currentPlayer = { name: playerFullName, role, moderator: false };
            isModerator = false;

            // Set unit from room
            const roomData = snapshot.val();
            if (roomData.unit) {
                currentUnit = roomData.unit;
                updateUnitToggleUI();
            }

            roomRef.child('players/' + sanitizeKey(playerFullName)).set({
                name: playerFullName,
                role: role,
                moderator: false,
                vote: null
            });

            roomRef.child('players/' + sanitizeKey(playerFullName))
                .onDisconnect().remove();

            enterRoom();
        });
    }

    function findTeamMember(name) {
        return teamMembers.find(m =>
            m.fullName.toLowerCase() === name.trim().toLowerCase()
        );
    }

    function sanitizeKey(str) {
        return str.replace(/[.#$\[\]\/]/g, '_');
    }

    // --- ENTER ROOM & LISTENERS ---
    function enterRoom() {
        lobbySection.classList.add('hidden');
        gameSection.classList.remove('hidden');

        roomCodeDisplay.textContent = currentRoom;

        if (isModerator) {
            issueControls.classList.remove('hidden');
            moderatorActions.classList.remove('hidden');
            finalEstimate.classList.remove('hidden');
        }

        renderCards();
        attachRoomListeners();

        // Save to localStorage for reconnect
        localStorage.setItem('poker-room', currentRoom);
        localStorage.setItem('poker-player', currentPlayer.name);
        localStorage.setItem('poker-moderator', isModerator ? '1' : '0');
    }

    function attachRoomListeners() {
        // Listen to players
        const playersRef = roomRef.child('players');
        playersRef.on('value', (snapshot) => {
            const players = snapshot.val() || {};
            renderPlayers(players);
            updateParticipantCount(players);
            updateRevealButton(players);
        });
        listeners.push({ ref: playersRef, event: 'value' });

        // Listen to room state
        roomRef.on('value', (snapshot) => {
            if (isLeaving || !currentRoom) return;
            const room = snapshot.val();
            if (!room) {
                // Room deleted
                showToast('Pokój został zamknięty');
                resetToLobby();
                return;
            }
            updateRoomState(room);
        });
        listeners.push({ ref: roomRef, event: 'value' });
    }

    function updateRoomState(room) {
        // Update issue display
        if (room.currentIssue) {
            issueDisplay.innerHTML = `<h3>${escapeHtml(room.currentIssue)}</h3>`;
        } else {
            issueDisplay.innerHTML = '<p class="issue-placeholder">Moderator ustawi zadanie do wyceny...</p>';
        }

        // Update unit from room
        if (room.unit && room.unit !== currentUnit) {
            currentUnit = room.unit;
            updateUnitToggleUI();
        }

        // Handle state changes
        if (room.state === 'revealed') {
            showResults(room);
            cardsDeck.querySelectorAll('.card').forEach(c => c.classList.add('disabled'));
        } else {
            resultsPanel.classList.add('hidden');
            cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('disabled'));
        }

        // Update session estimates for summary
        if (room.estimates) {
            sessionEstimates = Object.values(room.estimates);
            renderSessionSummary();
        }
    }

    // --- RENDERING ---
    function renderCards() {
        cardsDeck.innerHTML = '';
        FIBONACCI.forEach(value => {
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = value;
            card.dataset.value = value;
            card.addEventListener('click', () => selectCard(value, card));
            cardsDeck.appendChild(card);
        });
    }

    function selectCard(value, cardEl) {
        // Deselect all
        cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        // Select this one
        cardEl.classList.add('selected');
        cardEl.classList.add('pulse');
        setTimeout(() => cardEl.classList.remove('pulse'), 600);

        // Send vote to Firebase
        const playerKey = sanitizeKey(currentPlayer.name);
        roomRef.child('players/' + playerKey + '/vote').set(value);
    }

    function renderPlayers(players) {
        const devs = [];
        const qas = [];
        const others = [];

        Object.values(players).forEach(p => {
            if (p.role === 'dev') devs.push(p);
            else if (p.role === 'qa') qas.push(p);
            else others.push(p);
        });

        devPlayersList.innerHTML = devs.map(p => playerRowHTML(p)).join('');
        qaPlayersList.innerHTML = qas.map(p => playerRowHTML(p)).join('');

        if (others.length > 0) {
            otherGroup.classList.remove('hidden');
            otherPlayersList.innerHTML = others.map(p => playerRowHTML(p)).join('');
        } else {
            otherGroup.classList.add('hidden');
        }
    }

    function playerRowHTML(player) {
        const modClass = player.moderator ? ' is-moderator' : '';
        let statusHTML;

        if (player.vote && player.vote !== '') {
            // Check if revealed
            statusHTML = `<span class="player-status voted">\u2713</span>`;
        } else {
            statusHTML = `<span class="player-status waiting">\u2022</span>`;
        }

        return `
            <div class="player-row">
                <span class="player-name${modClass}">${escapeHtml(player.name)}</span>
                ${statusHTML}
            </div>
        `;
    }

    function updateParticipantCount(players) {
        const count = Object.keys(players).length;
        participantCount.textContent = `${count} ${count === 1 ? 'osoba' : count < 5 ? 'osoby' : 'os\u00f3b'}`;
    }

    function updateRevealButton(players) {
        const votes = Object.values(players).filter(p => p.vote);
        revealBtn.disabled = votes.length === 0;
    }

    // --- RESULTS ---
    function showResults(room) {
        const players = room.players || {};
        resultsPanel.classList.remove('hidden');

        const devVotesArr = [];
        const qaVotesArr = [];
        const allNumeric = [];

        Object.values(players).forEach(p => {
            if (!p.vote || p.vote === '') return;
            const entry = { name: p.name, value: p.vote };
            const numVal = NUMERIC_VALUES[p.vote];

            if (p.role === 'dev') {
                devVotesArr.push(entry);
                if (numVal !== undefined) allNumeric.push(numVal);
            } else if (p.role === 'qa') {
                qaVotesArr.push(entry);
                if (numVal !== undefined) allNumeric.push(numVal);
            } else {
                // Others go to dev by default for summary
                devVotesArr.push(entry);
                if (numVal !== undefined) allNumeric.push(numVal);
            }
        });

        // Render DEV votes
        devVotes.innerHTML = devVotesArr.map(v =>
            `<span class="vote-chip"><span class="vote-value">${escapeHtml(v.value)}</span> <span class="vote-name">${escapeHtml(firstName(v.name))}</span></span>`
        ).join('');

        // Render QA votes
        qaVotes.innerHTML = qaVotesArr.map(v =>
            `<span class="vote-chip"><span class="vote-value">${escapeHtml(v.value)}</span> <span class="vote-name">${escapeHtml(firstName(v.name))}</span></span>`
        ).join('');

        // Summaries
        const devNums = devVotesArr.map(v => NUMERIC_VALUES[v.value]).filter(n => n !== undefined);
        const qaNums = qaVotesArr.map(v => NUMERIC_VALUES[v.value]).filter(n => n !== undefined);

        devSummary.textContent = devNums.length > 0
            ? `\u00d8 ${avg(devNums).toFixed(1)} ${getUnitLabel()} (${devNums.length} g\u0142os\u00f3w)`
            : 'Brak g\u0142os\u00f3w numerycznych';

        qaSummary.textContent = qaNums.length > 0
            ? `\u00d8 ${avg(qaNums).toFixed(1)} ${getUnitLabel()} (${qaNums.length} g\u0142os\u00f3w)`
            : 'Brak g\u0142os\u00f3w numerycznych';

        // Total
        if (allNumeric.length > 0) {
            const totalAvg = avg(allNumeric).toFixed(1);
            const totalMed = median(allNumeric).toFixed(1);
            resultTotal.textContent = `\ud83d\udcca \u0141\u0105cznie: \u00d8 ${totalAvg} | mediana ${totalMed} ${getUnitLabel()} (${allNumeric.length} g\u0142os\u00f3w)`;
        } else {
            resultTotal.textContent = 'Brak g\u0142os\u00f3w numerycznych';
        }

        // Pre-fill final estimate with averages
        if (isModerator) {
            finalDev.value = devNums.length > 0 ? Math.round(avg(devNums)) : '';
            finalQa.value = qaNums.length > 0 ? Math.round(avg(qaNums)) : '';
        }
    }

    function avg(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function firstName(fullName) {
        return fullName.split(' ')[0];
    }

    // --- SESSION SUMMARY ---
    function renderSessionSummary() {
        if (sessionEstimates.length === 0) {
            sessionSummary.classList.add('hidden');
            return;
        }

        sessionSummary.classList.remove('hidden');
        summaryBody.innerHTML = sessionEstimates.map(est => `
            <tr>
                <td>${escapeHtml(est.issue || '—')}</td>
                <td>${est.dev != null ? est.dev : '—'}</td>
                <td>${est.qa != null ? est.qa : '—'}</td>
                <td><strong>${computeSum(est.dev, est.qa)}</strong></td>
            </tr>
        `).join('');

        const sumDev = sessionEstimates.reduce((s, e) => s + (parseFloat(e.dev) || 0), 0);
        const sumQa = sessionEstimates.reduce((s, e) => s + (parseFloat(e.qa) || 0), 0);
        const sumAll = sumDev + sumQa;

        totalDev.textContent = `${sumDev} ${getUnitLabel()}`;
        totalQa.textContent = `${sumQa} ${getUnitLabel()}`;
        totalAll.textContent = `${sumAll} ${getUnitLabel()}`;
    }

    function computeSum(dev, qa) {
        const d = parseFloat(dev) || 0;
        const q = parseFloat(qa) || 0;
        return d + q || '—';
    }

    // --- MODERATOR ACTIONS ---
    function setIssue() {
        const issue = issueInput.value.trim();
        if (!issue) return;
        roomRef.update({ currentIssue: issue, state: 'voting' });
        issueInput.value = '';
        // Reset all votes
        roomRef.child('players').once('value', (snapshot) => {
            const updates = {};
            snapshot.forEach(child => {
                updates[child.key + '/vote'] = null;
            });
            roomRef.child('players').update(updates);
        });
        // Reset card selection locally
        cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        resultsPanel.classList.add('hidden');
    }

    function revealVotes() {
        roomRef.update({ state: 'revealed' });
    }

    function nextRound() {
        // Save current estimate if we have final values
        saveFinalEstimate(true);
        // Reset for next round
        roomRef.child('players').once('value', (snapshot) => {
            const updates = {};
            snapshot.forEach(child => {
                updates[child.key + '/vote'] = null;
            });
            roomRef.child('players').update(updates);
        });
        roomRef.update({ state: 'voting', currentIssue: '' });
        resultsPanel.classList.add('hidden');
        cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        issueInput.focus();
    }

    function saveFinalEstimate(silent) {
        const devVal = parseFloat(finalDev.value);
        const qaVal = parseFloat(finalQa.value);

        // Get current issue name from room
        roomRef.once('value', (snapshot) => {
            const room = snapshot.val();
            if (!room) return;

            const issue = room.currentIssue || `Zadanie ${(sessionEstimates.length + 1)}`;

            if (isNaN(devVal) && isNaN(qaVal)) {
                if (!silent) showToast('Wpisz wycen\u0119!');
                return;
            }

            const estimate = {
                issue: issue,
                dev: isNaN(devVal) ? null : devVal,
                qa: isNaN(qaVal) ? null : qaVal,
                unit: currentUnit,
                timestamp: new Date().toISOString()
            };

            roomRef.child('estimates').push(estimate);
            if (!silent) showToast('\u2705 Zapisano wycen\u0119!');
        });
    }

    // --- CSV EXPORT ---
    function exportCSV() {
        if (sessionEstimates.length === 0) {
            showToast('Brak danych do eksportu');
            return;
        }

        const unit = getUnitLabel();
        let csv = `Zadanie;DEV (${unit});QA (${unit});Suma (${unit})\n`;

        sessionEstimates.forEach(est => {
            const dev = est.dev != null ? est.dev : '';
            const qa = est.qa != null ? est.qa : '';
            const sum = (parseFloat(dev) || 0) + (parseFloat(qa) || 0);
            csv += `${(est.issue || '').replace(/;/g, ',')};${dev};${qa};${sum}\n`;
        });

        const sumDev = sessionEstimates.reduce((s, e) => s + (parseFloat(e.dev) || 0), 0);
        const sumQa = sessionEstimates.reduce((s, e) => s + (parseFloat(e.qa) || 0), 0);
        csv += `RAZEM;${sumDev};${sumQa};${sumDev + sumQa}\n`;

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poker-session-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- UNIT TOGGLE ---
    function updateUnitToggleUI() {
        unitToggle.querySelectorAll('.unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === currentUnit);
        });
    }

    function switchUnit(unit) {
        currentUnit = unit;
        updateUnitToggleUI();
        // Sync to room if moderator
        if (isModerator && roomRef) {
            roomRef.child('unit').set(unit);
        }
        renderSessionSummary();
    }

    // --- HELPERS ---
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function resetToLobby() {
        if (isLeaving) return;
        isLeaving = true;

        // Detach listeners first
        listeners.forEach(l => l.ref.off(l.event));
        listeners = [];
        roomRef = null;
        currentRoom = null;
        currentPlayer = null;
        isModerator = false;
        sessionEstimates = [];

        gameSection.classList.add('hidden');
        lobbySection.classList.remove('hidden');

        localStorage.removeItem('poker-room');
        localStorage.removeItem('poker-player');
        localStorage.removeItem('poker-moderator');

        // Reset after a tick so any pending Firebase callbacks are ignored
        setTimeout(() => { isLeaving = false; }, 100);
    }

    // --- URL ROOM CODE ---
    function getRoomFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room');
    }

    // --- EVENT LISTENERS ---
    createRoomBtn.addEventListener('click', () => {
        const name = moderatorName.value;
        if (!name) {
            showToast('Wybierz siebie z listy!');
            moderatorName.focus();
            return;
        }
        createRoom(name);
    });

    joinRoomBtn.addEventListener('click', () => {
        const code = roomCodeInput.value.trim();
        const name = playerName.value;
        if (!code) { showToast('Wpisz kod pokoju!'); roomCodeInput.focus(); return; }
        if (!name) { showToast('Wybierz siebie z listy!'); playerName.focus(); return; }
        joinRoom(code, name);
    });

    copyRoomBtn.addEventListener('click', () => {
        const url = window.location.origin + window.location.pathname + '?room=' + currentRoom;
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link skopiowany!');
        }).catch(() => {
            // Fallback
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('Link skopiowany!');
        });
    });

    setIssueBtn.addEventListener('click', setIssue);
    issueInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') setIssue();
    });

    leaveRoomBtn.addEventListener('click', () => {
        // Detach listeners first to prevent race conditions
        listeners.forEach(l => l.ref.off(l.event));
        listeners = [];

        // Remove player from room
        if (roomRef && currentPlayer) {
            roomRef.child('players/' + sanitizeKey(currentPlayer.name)).remove();
        }

        roomRef = null;
        currentRoom = null;
        currentPlayer = null;
        isModerator = false;
        sessionEstimates = [];
        isLeaving = false;

        gameSection.classList.add('hidden');
        lobbySection.classList.remove('hidden');

        localStorage.removeItem('poker-room');
        localStorage.removeItem('poker-player');
        localStorage.removeItem('poker-moderator');

        showToast('Opuściłeś pokój');
    });

    revealBtn.addEventListener('click', revealVotes);
    nextRoundBtn.addEventListener('click', nextRound);
    saveFinalBtn.addEventListener('click', () => saveFinalEstimate(false));
    exportCsvBtn.addEventListener('click', exportCSV);

    // Unit toggle
    unitToggle.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => switchUnit(btn.dataset.unit));
    });

    // Enter key in lobby inputs
    roomCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') joinRoomBtn.click();
    });

    // --- SESSION HISTORY ---
    const sessionHistoryList = document.getElementById('sessionHistoryList');
    const historyDetail = document.getElementById('historyDetail');
    const historyBackBtn = document.getElementById('historyBackBtn');
    const historyDetailTitle = document.getElementById('historyDetailTitle');
    const historyDetailBody = document.getElementById('historyDetailBody');
    const historyTotalDev = document.getElementById('historyTotalDev');
    const historyTotalQa = document.getElementById('historyTotalQa');
    const historyTotalAll = document.getElementById('historyTotalAll');

    function loadSessionHistory() {
        db.ref('poker_rooms').orderByChild('created').limitToLast(20).once('value', (snapshot) => {
            const rooms = [];
            snapshot.forEach(child => {
                const room = child.val();
                if (room.estimates && Object.keys(room.estimates).length > 0) {
                    rooms.push({ code: child.key, ...room });
                }
            });

            // Sort descending (newest first)
            rooms.sort((a, b) => new Date(b.created) - new Date(a.created));

            if (rooms.length === 0) {
                sessionHistoryList.innerHTML = '<p class="empty-state">Brak zakończonych sesji</p>';
                return;
            }

            sessionHistoryList.innerHTML = rooms.map(room => {
                const estimates = Object.values(room.estimates);
                const sumDev = estimates.reduce((s, e) => s + (parseFloat(e.dev) || 0), 0);
                const sumQa = estimates.reduce((s, e) => s + (parseFloat(e.qa) || 0), 0);
                const unit = estimates[0]?.unit === 'sp' ? 'SP' : 'MD';
                const date = new Date(room.created).toLocaleDateString('pl-PL', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });

                return `
                    <div class="history-row" data-room-code="${room.code}">
                        <div class="history-row-main">
                            <span class="history-row-name">${escapeHtml(room.name || 'ALF Refinement - ' + date)}</span>
                            <span class="history-row-meta">${estimates.length} zadań</span>
                        </div>
                        <div class="history-row-stats">
                            <span class="history-stat">DEV: ${sumDev} ${unit}</span>
                            <span class="history-stat">QA: ${sumQa} ${unit}</span>
                            <span class="history-stat total">Σ ${sumDev + sumQa} ${unit}</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Click handlers
            sessionHistoryList.querySelectorAll('.history-row').forEach(row => {
                row.addEventListener('click', () => {
                    const code = row.dataset.roomCode;
                    const room = rooms.find(r => r.code === code);
                    if (room) showHistoryDetail(room);
                });
            });
        });
    }

    function showHistoryDetail(room) {
        sessionHistoryList.classList.add('hidden');
        historyDetail.classList.remove('hidden');

        const date = new Date(room.created).toLocaleDateString('pl-PL', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        historyDetailTitle.textContent = room.name || 'ALF Refinement - ' + date;

        const estimates = Object.values(room.estimates);
        const unit = estimates[0]?.unit === 'sp' ? 'SP' : 'MD';

        historyDetailBody.innerHTML = estimates.map(est => `
            <tr>
                <td>${escapeHtml(est.issue || '—')}</td>
                <td>${est.dev != null ? est.dev : '—'}</td>
                <td>${est.qa != null ? est.qa : '—'}</td>
                <td><strong>${((parseFloat(est.dev) || 0) + (parseFloat(est.qa) || 0)) || '—'}</strong></td>
            </tr>
        `).join('');

        const sumDev = estimates.reduce((s, e) => s + (parseFloat(e.dev) || 0), 0);
        const sumQa = estimates.reduce((s, e) => s + (parseFloat(e.qa) || 0), 0);

        historyTotalDev.textContent = `${sumDev} ${unit}`;
        historyTotalQa.textContent = `${sumQa} ${unit}`;
        historyTotalAll.textContent = `${sumDev + sumQa} ${unit}`;
    }

    historyBackBtn.addEventListener('click', () => {
        historyDetail.classList.add('hidden');
        sessionHistoryList.classList.remove('hidden');
    });

    // --- INIT ---
    async function init() {
        await loadTeamFromExcel();
        loadSessionHistory();

        // Check URL for room code
        const urlRoom = getRoomFromURL();
        if (urlRoom) {
            roomCodeInput.value = urlRoom;
            playerName.focus();
        }

        // Try to reconnect to previous room
        const savedRoom = localStorage.getItem('poker-room');
        const savedPlayer = localStorage.getItem('poker-player');
        const savedMod = localStorage.getItem('poker-moderator');

        if (savedRoom && savedPlayer && !urlRoom) {
            // Verify room still exists
            const snapshot = await db.ref('poker_rooms/' + savedRoom).once('value');
            if (snapshot.exists()) {
                if (savedMod === '1') {
                    currentUnit = snapshot.val().unit || 'md';
                    updateUnitToggleUI();
                    currentRoom = savedRoom;
                    currentPlayer = { name: savedPlayer, role: classifySkillset(''), moderator: true };
                    isModerator = true;
                    roomRef = db.ref('poker_rooms/' + savedRoom);
                    enterRoom();
                } else {
                    joinRoom(savedRoom, savedPlayer);
                }
                return;
            } else {
                localStorage.removeItem('poker-room');
                localStorage.removeItem('poker-player');
                localStorage.removeItem('poker-moderator');
            }
        }
    }

    init();

})();
