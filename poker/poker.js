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
    const MD_DECK = ['1h', '2h', '4h', '6h', '1d', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', '10d', '10+', '🐱'];
    const NUMERIC_VALUES_SP = { '1': 1, '2': 2, '3': 3, '5': 5, '8': 8, '13': 13, '21': 21 };
    const NUMERIC_VALUES_MD = { '1h': 0.125, '2h': 0.25, '4h': 0.5, '6h': 0.75, '1d': 1, '2d': 2, '3d': 3, '4d': 4, '5d': 5, '6d': 6, '7d': 7, '8d': 8, '9d': 9, '10d': 10, '10+': 11 };

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
    let selectedCard = null;
    let lastRoundId = '';
    let issueList = []; // { id, name, status: 'pending'|'active'|'done' }
    let emojiTarget = null; // player key we're throwing at
    let isRevealed = false;

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
    const issueControls = document.getElementById('issueControls');
    const issueInput = document.getElementById('issueInput');
    const addIssueBtn = document.getElementById('addIssueBtn');
    const issueQueue = document.getElementById('issueQueue');
    const cardsSection = document.getElementById('cardsSection');
    const cardsDeck = document.getElementById('cardsDeck');
    const confirmVoteBtn = document.getElementById('confirmVoteBtn');
    const voteStatus = document.getElementById('voteStatus');
    const devPlayersList = document.getElementById('devPlayersList');
    const qaPlayersList = document.getElementById('qaPlayersList');
    const otherPlayersList = document.getElementById('otherPlayersList');
    const otherGroup = document.getElementById('otherGroup');
    const resultsPanel = document.getElementById('resultsPanel');
    const devSummary = document.getElementById('devSummary');
    const qaSummary = document.getElementById('qaSummary');
    const resultTotal = document.getElementById('resultTotal');
    const finalCol = document.getElementById('finalCol');
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
    const emojiPopup = document.getElementById('emojiPopup');
    const emojiPicker = document.getElementById('emojiPicker');
    const roomsListSection = document.getElementById('roomsListSection');
    const activeRoomsList = document.getElementById('activeRoomsList');
    const historyRoomsList = document.getElementById('historyRoomsList');
    const historyPopupOverlay = document.getElementById('historyPopupOverlay');
    const historyPopupTitle = document.getElementById('historyPopupTitle');
    const historyPopupBody = document.getElementById('historyPopupBody');
    const historyTotalDev = document.getElementById('historyTotalDev');
    const historyTotalQa = document.getElementById('historyTotalQa');
    const historyTotalAll = document.getElementById('historyTotalAll');
    const closeHistoryPopup = document.getElementById('closeHistoryPopup');
    const currentIssueBanner = document.getElementById('currentIssueBanner');
    const currentIssueName = document.getElementById('currentIssueName');

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
            const devs = teamMembers.filter(m => m.role === 'dev').sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'));
            const qas = teamMembers.filter(m => m.role === 'qa').sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'));
            const others = teamMembers.filter(m => m.role === 'other').sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'));

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

    function loadRoomsList() {
        db.ref('poker_rooms').orderByChild('created').on('value', (snapshot) => {
            const rooms = snapshot.val() || {};
            const activeRooms = [];
            const historyRoomsArr = [];

            Object.entries(rooms).forEach(([code, room]) => {
                const playerCount = room.players ? Object.keys(room.players).length : 0;
                const estimateCount = room.estimates ? Object.keys(room.estimates).length : 0;
                const created = new Date(room.created);
                const dateStr = created.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                const entry = { code, room, playerCount, estimateCount, dateStr, created };

                // Active = has players connected
                if (playerCount > 0) {
                    activeRooms.push(entry);
                } else if (estimateCount > 0) {
                    historyRoomsArr.push(entry);
                }
            });

            // Sort: newest first
            activeRooms.sort((a, b) => b.created - a.created);
            historyRoomsArr.sort((a, b) => b.created - a.created);

            // Render active
            if (activeRooms.length > 0) {
                activeRoomsList.innerHTML = activeRooms.map(r => `
                    <div class="room-item active" data-room-code="${r.code}">
                        <div class="room-item-info">
                            <span class="room-item-name">${escapeHtml(r.room.name || 'Refinement')} <span style="opacity:0.5">[${r.code}]</span></span>
                            <span class="room-item-meta">${r.dateStr} \u00b7 ${r.playerCount} ${r.playerCount === 1 ? 'osoba' : 'os\u00f3b'} \u00b7 Moderator: ${escapeHtml(firstName(r.room.moderator || ''))}</span>
                        </div>
                        <span class="room-item-badge live">LIVE</span>
                    </div>
                `).join('');
            } else {
                activeRoomsList.innerHTML = '<p class="empty-state">Brak aktywnych pokoi</p>';
            }

            // Render history (last 10)
            const historySlice = historyRoomsArr.slice(0, 10);
            if (historySlice.length > 0) {
                historyRoomsList.innerHTML = historySlice.map(r => {
                    const estimates = r.room.estimates ? Object.values(r.room.estimates) : [];
                    const totalDev = estimates.reduce((s, e) => s + (parseFloat(e.dev) || 0), 0);
                    const totalQa = estimates.reduce((s, e) => s + (parseFloat(e.qa) || 0), 0);
                    const summaryText = estimates.length > 0 ? `${estimates.length} zada\u0144 \u00b7 DEV: ${totalDev} MD \u00b7 QA: ${totalQa} MD` : 'Brak wycen';

                    return `
                        <div class="room-item room-item-clickable" data-history-code="${r.code}">
                            <div class="room-item-info">
                                <span class="room-item-name">${escapeHtml(r.room.name || 'Refinement ' + r.dateStr.split(',')[0])}</span>
                                <span class="room-item-meta">Moderator: ${escapeHtml(firstName(r.room.moderator || ''))}</span>
                                <span class="room-item-summary">${summaryText}</span>
                            </div>
                            <span class="room-item-badge ended">Zako\u0144czone</span>
                        </div>
                    `;
                }).join('');
            } else {
                historyRoomsList.innerHTML = '<p class="empty-state">Brak historii</p>';
            }
        });
    }

    function showHistoryPopup(room) {
        const estimates = room.estimates ? Object.values(room.estimates) : [];
        const title = room.name || 'Sesja';

        historyPopupTitle.textContent = title;
        historyPopupBody.innerHTML = estimates.map(est => `
            <tr>
                <td>${escapeHtml(est.issue || '\u2014')}</td>
                <td>${est.dev != null ? est.dev + ' MD' : '\u2014'}</td>
                <td>${est.qa != null ? est.qa + ' MD' : '\u2014'}</td>
                <td><strong>${((parseFloat(est.dev) || 0) + (parseFloat(est.qa) || 0)) || '\u2014'} MD</strong></td>
            </tr>
        `).join('');

        const sumDev = estimates.reduce((s, e) => s + (parseFloat(e.dev) || 0), 0);
        const sumQa = estimates.reduce((s, e) => s + (parseFloat(e.qa) || 0), 0);
        historyTotalDev.textContent = sumDev + ' MD';
        historyTotalQa.textContent = sumQa + ' MD';
        historyTotalAll.textContent = (sumDev + sumQa) + ' MD';

        historyPopupOverlay.classList.remove('hidden');
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

    function getNumericValue(vote) {
        const map = currentUnit === 'md' ? NUMERIC_VALUES_MD : NUMERIC_VALUES_SP;
        return map[vote];
    }

    // Apply 1d minimum only when there's a mix of hour and day votes
    function applyMinDay(values) {
        if (currentUnit !== 'md' || values.length === 0) return values;
        const hasDay = values.some(v => v >= 1);
        const hasHour = values.some(v => v < 1);
        // Mixed: clamp hours to 1d. All hours: keep as-is.
        if (hasDay && hasHour) {
            return values.map(v => v < 1 ? 1 : v);
        }
        return values;
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
    function createRoom(moderatorFullName) {
        const code = generateRoomCode();
        const member = findTeamMember(moderatorFullName);
        const role = member ? member.role : 'other';

        currentRoom = code;
        currentPlayer = { name: moderatorFullName, role, moderator: true };
        isModerator = true;

        roomRef = db.ref('poker_rooms/' + code);
        const roomName = 'ALF Refinement - ' + new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        roomRef.set({
            created: new Date().toISOString(),
            name: roomName,
            moderator: moderatorFullName,
            unit: currentUnit,
            state: 'voting', // voting | revealed
            currentIssue: '',
            roundId: '',
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
        return (str || '').replace(/[.#$\[\]\/]/g, '_');
    }

    // --- ENTER ROOM & LISTENERS ---
    function enterRoom() {
        lobbySection.classList.add('hidden');
        gameSection.classList.remove('hidden');
        roomsListSection.classList.add('hidden');

        roomCodeDisplay.textContent = currentRoom; // will be updated to room name by listener

        if (isModerator) {
            issueControls.classList.remove('hidden');
        }

        renderCards();
        // Disable cards by default until a task is activated
        cardsDeck.querySelectorAll('.card').forEach(c => c.classList.add('disabled'));
        confirmVoteBtn.disabled = true;
        lastRoundId = '';
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

        // Listen to reactions
        const reactionsRef = roomRef.child('reactions');
        reactionsRef.on('child_added', (snapshot) => {
            const reaction = snapshot.val();
            if (!reaction) return;
            // Ignore old reactions (older than 5 seconds)
            if (Date.now() - reaction.timestamp > 5000) return;
            showEmojiReaction(reaction.to, reaction.emoji);
            // Clean up old reaction from Firebase after showing
            setTimeout(() => snapshot.ref.remove(), 4000);
        });
        listeners.push({ ref: reactionsRef, event: 'child_added' });
    }

    function updateRoomState(room) {
        // Update room name display
        if (room.name) {
            roomCodeDisplay.textContent = room.name;
        }

        // Update current issue banner (visible to all)
        if (room.currentIssue) {
            currentIssueBanner.classList.remove('hidden');
            currentIssueName.textContent = room.currentIssue;
        } else {
            currentIssueBanner.classList.add('hidden');
            currentIssueName.textContent = '';
        }

        // Disable cards when no task is active
        if (!room.currentIssue) {
            cardsDeck.querySelectorAll('.card').forEach(c => c.classList.add('disabled'));
            confirmVoteBtn.disabled = true;
        } else if (room.state !== 'revealed') {
            cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('disabled'));
        }

        // Update unit from room
        if (room.unit && room.unit !== currentUnit) {
            currentUnit = room.unit;
            updateUnitToggleUI();
            renderCards(); // deck changed
        }

        // Handle state changes
        if (room.state === 'revealed') {
            isRevealed = true;
            showResults(room);
            cardsDeck.querySelectorAll('.card').forEach(c => c.classList.add('disabled'));
            // Check if estimate already saved (global lock)
            if (room.estimateSaved) {
                saveFinalBtn.disabled = true;
                saveFinalBtn.textContent = '\u2713 Zapisano';
            } else {
                saveFinalBtn.disabled = false;
                saveFinalBtn.textContent = '\u2705 Zapisz';
            }
            // Re-render players to show their votes
            if (room.players) renderPlayers(room.players);
            if (isModerator) renderIssueQueue();
        } else {
            isRevealed = false;
            resultsPanel.classList.add('hidden');
            // Hide final estimate inputs during voting
            document.querySelectorAll('.final-col').forEach(el => el.classList.add('hidden'));
            cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('disabled'));
            // Reset save button for next round
            saveFinalBtn.disabled = false;
            saveFinalBtn.textContent = '\u2705 Zapisz';
            // Re-render players to hide votes
            if (room.players) renderPlayers(room.players);
            if (isModerator) renderIssueQueue();

            // Reset card selection when round changes
            const roundId = room.roundId || '';
            if (roundId !== lastRoundId) {
                lastRoundId = roundId;
                cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                selectedCard = null;
                confirmVoteBtn.disabled = true;
                confirmVoteBtn.textContent = 'G\u0142osuj';
                voteStatus.textContent = '';
            }
        }

        // Update session estimates for summary
        if (room.estimates) {
            sessionEstimates = Object.values(room.estimates);
            renderSessionSummary();
        }

        // Sync issue list from room
        if (room.issueList) {
            const rawList = Array.isArray(room.issueList) ? room.issueList : Object.values(room.issueList);
            // Only accept valid entries with id and name
            issueList = rawList.filter(item => item && item.id && item.name);
            if (isModerator) renderIssueQueue();
        }
    }

    // --- RENDERING ---
    function renderCards() {
        cardsDeck.innerHTML = '';
        const deck = currentUnit === 'md' ? MD_DECK : FIBONACCI;
        deck.forEach(value => {
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

        selectedCard = value;
        confirmVoteBtn.disabled = false;
        confirmVoteBtn.textContent = voteStatus.textContent ? 'Zmień głos' : 'Głosuj';
        voteStatus.textContent = '';
    }

    function confirmVote() {
        if (!selectedCard) return;
        const playerKey = sanitizeKey(currentPlayer.name);
        roomRef.child('players/' + playerKey + '/vote').set(selectedCard);
        confirmVoteBtn.disabled = true;
        confirmVoteBtn.textContent = 'Głosuj';
        voteStatus.textContent = '\u2713 Zagłosowano: ' + selectedCard;
        showToast('Głos oddany: ' + selectedCard);
    }

    function renderPlayers(players) {
        const devs = [];
        const qas = [];
        const others = [];

        Object.values(players).filter(p => p && p.name).forEach(p => {
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
            if (isRevealed) {
                // Show actual vote value after reveal
                statusHTML = `<span class="player-status revealed">${escapeHtml(player.vote)}</span>`;
            } else {
                // During voting, just show checkmark
                statusHTML = `<span class="player-status voted">\u2713</span>`;
            }
        } else {
            statusHTML = `<span class="player-status waiting">\u2022</span>`;
        }

        return `
            <div class="player-row">
                <span class="player-name${modClass}" data-player-key="${escapeHtml(sanitizeKey(player.name))}" data-player-name="${escapeHtml(player.name)}">${escapeHtml(firstName(player.name))}</span>
                <span class="player-reactions" id="reactions-${sanitizeKey(player.name)}"></span>
                ${statusHTML}
            </div>
        `;
    }

    function updateParticipantCount(players) {
        const count = Object.keys(players).length;
        participantCount.textContent = `${count} ${count === 1 ? 'osoba' : count < 5 ? 'osoby' : 'os\u00f3b'}`;
    }

    // --- RESULTS ---
    function showResults(room) {
        const players = room.players || {};
        resultsPanel.classList.remove('hidden');

        const devNums = [];
        const qaNums = [];
        const allNumeric = [];

        Object.values(players).filter(p => p && p.name).forEach(p => {
            if (!p.vote || p.vote === '') return;
            const numVal = getNumericValue(p.vote);
            if (numVal === undefined) return;

            if (p.role === 'dev') {
                devNums.push(numVal);
            } else if (p.role === 'qa') {
                qaNums.push(numVal);
            } else {
                devNums.push(numVal); // others count as dev
            }
            allNumeric.push(numVal);
        });

        const devAdj = applyMinDay(devNums);
        const qaAdj = applyMinDay(qaNums);
        const allAdj = applyMinDay(allNumeric);

        devSummary.textContent = devAdj.length > 0 ? sum(devAdj).toFixed(1) + ' ' + getUnitLabel() : '—';
        qaSummary.textContent = qaAdj.length > 0 ? sum(qaAdj).toFixed(1) + ' ' + getUnitLabel() : '—';
        resultTotal.textContent = allAdj.length > 0 ? sum(allAdj).toFixed(1) + ' ' + getUnitLabel() : '—';

        // Pre-fill final estimate for everyone
        finalDev.value = devAdj.length > 0 ? Math.round(sum(devAdj)) : '';
        finalQa.value = qaAdj.length > 0 ? Math.round(sum(qaAdj)) : '';

        // Show final estimate inputs for everyone after reveal
        document.querySelectorAll('.final-col').forEach(el => el.classList.remove('hidden'));
    }

    function avg(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function sum(arr) {
        return arr.reduce((a, b) => a + b, 0);
    }

    function median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function firstName(fullName) {
        return (fullName || '').split(' ')[0] || '?';
    }

    function showEmojiReaction(targetKey, emoji) {
        const container = document.getElementById('reactions-' + targetKey);
        if (!container) return;

        const span = document.createElement('span');
        span.className = 'emoji-reaction';
        span.textContent = emoji;
        container.appendChild(span);

        // Keep max 3 reactions visible
        while (container.children.length > 3) {
            container.removeChild(container.firstChild);
        }

        // Remove after 3 seconds
        setTimeout(() => {
            if (span.parentNode) {
                span.classList.add('emoji-fadeout');
                setTimeout(() => span.remove(), 300);
            }
        }, 3000);
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
    function addIssue() {
        const issue = issueInput.value.trim();
        if (!issue) return;
        const id = Date.now().toString(36);
        issueList.push({ id, name: issue, status: 'pending' });
        issueInput.value = '';

        // Auto-activate if no task is currently active
        const hasActive = issueList.some(i => i.status === 'active');
        if (!hasActive) {
            startVotingOnIssue(id);
        } else {
            renderIssueQueue();
            roomRef.child('issueList').set(issueList);
        }
    }

    function startVotingOnIssue(id) {
        const item = issueList.find(i => i.id === id);
        if (!item) return;

        // Mark previous active as done
        issueList.forEach(i => {
            if (i.status === 'active') i.status = 'done';
        });
        item.status = 'active';

        roomRef.update({ currentIssue: item.name, state: 'voting' });
        roomRef.child('estimateSaved').set(false);
        roomRef.child('roundId').set(Date.now().toString(36));
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
        selectedCard = null;
        confirmVoteBtn.disabled = true;
        voteStatus.textContent = '';

        renderIssueQueue();
        roomRef.child('issueList').set(issueList);
    }

    function removeIssue(id) {
        issueList = issueList.filter(i => i.id !== id);
        renderIssueQueue();
        roomRef.child('issueList').set(issueList);
    }

    function renderIssueQueue() {
        if (!isModerator) {
            issueQueue.innerHTML = '';
            return;
        }
        if (issueList.length === 0) {
            issueQueue.innerHTML = '';
            return;
        }
        issueQueue.innerHTML = issueList.map(item => {
            const activeClass = item.status === 'active' ? ' active' : '';
            const doneClass = item.status === 'done' ? ' done' : '';

            let badgeHTML = '';
            let actionHTML = '';

            if (item.status === 'active') {
                if (isRevealed) {
                    badgeHTML = '<span class="issue-badge issue-badge-done">\u2713 Odkryte</span>';
                    actionHTML = `<button class="btn btn-small btn-ghost issue-action-btn" data-action="reopen" data-issue-id="${item.id}">\ud83d\uddf3\ufe0f Wzn\u00f3w</button>`;
                } else {
                    badgeHTML = '<span class="issue-badge issue-badge-active">G\u0142osowanie...</span>';
                    actionHTML = `
                        <button class="btn btn-small btn-primary issue-action-btn" data-action="reveal" data-issue-id="${item.id}">\ud83d\udc41\ufe0f Odkryj</button>
                        <button class="btn btn-small btn-danger issue-action-btn" data-action="reset" data-issue-id="${item.id}">\ud83d\udd04 Reset</button>
                    `;
                }
            } else if (item.status === 'done') {
                badgeHTML = '<span class="issue-badge issue-badge-done">\u2713 Odkryte</span>';
                actionHTML = `<button class="btn btn-small btn-ghost issue-action-btn" data-action="reopen" data-issue-id="${item.id}">\ud83d\uddf3\ufe0f Wzn\u00f3w</button>`;
            } else {
                badgeHTML = '';
                actionHTML = `<button class="btn btn-small btn-secondary issue-action-btn" data-action="vote" data-issue-id="${item.id}">\ud83d\uddf3\ufe0f G\u0142osuj</button>`;
            }

            return `
                <div class="issue-queue-item${activeClass}${doneClass}" data-issue-id="${item.id}">
                    <div class="issue-queue-item-top">
                        <span class="issue-queue-item-name">${escapeHtml(item.name)}</span>
                        ${badgeHTML}
                        <button class="issue-queue-item-delete" data-delete-id="${item.id}" title="Usu\u0144">\u2715</button>
                    </div>
                    <div class="issue-queue-item-actions">
                        ${actionHTML}
                    </div>
                </div>
            `;
        }).join('');
    }

    function revealVotes() {
        roomRef.update({ state: 'revealed' });
    }

    function resetVotes() {
        // Clear all votes but keep the same issue
        roomRef.child('players').once('value', (snapshot) => {
            const updates = {};
            snapshot.forEach(child => {
                updates[child.key + '/vote'] = null;
            });
            roomRef.child('players').update(updates);
        });
        roomRef.update({ state: 'voting' });
        roomRef.child('roundId').set(Date.now().toString(36));
        resultsPanel.classList.add('hidden');
        cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        selectedCard = null;
        confirmVoteBtn.disabled = true;
        confirmVoteBtn.textContent = 'Głosuj';
        voteStatus.textContent = '';
        showToast('Głosowanie zresetowane');
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
        // Mark current as done and start next pending
        const currentActive = issueList.find(i => i.status === 'active');
        if (currentActive) currentActive.status = 'done';

        const nextPending = issueList.find(i => i.status === 'pending');
        if (nextPending) {
            nextPending.status = 'active';
            roomRef.update({ state: 'voting', currentIssue: nextPending.name });
        } else {
            roomRef.update({ state: 'voting', currentIssue: '' });
        }
        roomRef.child('issueList').set(issueList);
        renderIssueQueue();

        resultsPanel.classList.add('hidden');
        cardsDeck.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    }

    function saveFinalEstimate(silent) {
        const devVal = parseFloat(finalDev.value);
        const qaVal = parseFloat(finalQa.value);

        // Get current issue name from room
        roomRef.once('value', (snapshot) => {
            const room = snapshot.val();
            if (!room) return;

            const activeItem = issueList.find(i => i.status === 'active');
            const issue = (activeItem && activeItem.name) || room.currentIssue || 'Zadanie';

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
            // Lock saving globally
            roomRef.child('estimateSaved').set(true);
            if (!silent) {
                showToast('\u2705 Zapisano wycen\u0119!');
                saveFinalBtn.disabled = true;
                saveFinalBtn.textContent = '\u2713 Zapisano';
            }
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
        renderCards(); // switch deck
        // Sync to room if moderator
        if (isModerator && roomRef) {
            roomRef.child('unit').set(unit);
            // Reset votes since deck changed
            roomRef.child('players').once('value', (snapshot) => {
                const updates = {};
                snapshot.forEach(child => {
                    updates[child.key + '/vote'] = null;
                });
                roomRef.child('players').update(updates);
            });
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
        isRevealed = false;
        selectedCard = null;
        lastRoundId = '';
        issueList = [];

        gameSection.classList.add('hidden');
        lobbySection.classList.remove('hidden');
        roomsListSection.classList.remove('hidden');

        // Reset lobby to full mode (not join-only)
        document.getElementById('createRoomOption').style.display = '';
        document.getElementById('lobbyDivider').style.display = '';
        document.querySelector('.lobby-options').classList.remove('join-only');
        roomCodeInput.style.display = '';
        roomCodeInput.value = '';
        // Clear URL ?room= parameter
        window.history.replaceState({}, '', window.location.pathname);

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

    addIssueBtn.addEventListener('click', addIssue);
    issueInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addIssue();
    });

    // Issue queue clicks (delegation)
    issueQueue.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.issue-queue-item-delete');
        if (deleteBtn) {
            e.stopPropagation();
            removeIssue(deleteBtn.dataset.deleteId);
            return;
        }
        const actionBtn = e.target.closest('.issue-action-btn');
        if (actionBtn) {
            e.stopPropagation();
            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.issueId;
            if (action === 'vote') {
                startVotingOnIssue(id);
            } else if (action === 'reveal') {
                revealVotes();
                renderIssueQueue();
            } else if (action === 'reset') {
                resetVotes();
                roomRef.child('roundId').set(Date.now().toString(36));
            } else if (action === 'reopen') {
                // Remove previous estimate for this task
                const item = issueList.find(i => i.id === id);
                if (item && item.name) {
                    roomRef.child('estimates').once('value', (snapshot) => {
                        snapshot.forEach(child => {
                            const est = child.val();
                            if (est && est.issue === item.name) {
                                child.ref.remove();
                            }
                        });
                    });
                }
                startVotingOnIssue(id);
            }
            return;
        }
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
        isRevealed = false;
        selectedCard = null;
        lastRoundId = '';
        issueList = [];
        isLeaving = false;

        gameSection.classList.add('hidden');
        lobbySection.classList.remove('hidden');
        roomsListSection.classList.remove('hidden');

        // Reset lobby to full mode (not join-only)
        document.getElementById('createRoomOption').style.display = '';
        document.getElementById('lobbyDivider').style.display = '';
        document.querySelector('.lobby-options').classList.remove('join-only');
        roomCodeInput.style.display = '';
        roomCodeInput.value = '';
        // Clear URL ?room= parameter
        window.history.replaceState({}, '', window.location.pathname);

        localStorage.removeItem('poker-room');
        localStorage.removeItem('poker-player');
        localStorage.removeItem('poker-moderator');

        showToast('Opuściłeś pokój');
    });

    confirmVoteBtn.addEventListener('click', confirmVote);

    saveFinalBtn.addEventListener('click', () => saveFinalEstimate(false));
    exportCsvBtn.addEventListener('click', exportCSV);

    // Unit toggle
    unitToggle.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => switchUnit(btn.dataset.unit));
    });

    // Emoji throwing - click player name to open picker
    document.querySelector('.players-panel').addEventListener('click', (e) => {
        const nameEl = e.target.closest('.player-name');
        if (!nameEl) return;
        const targetKey = nameEl.dataset.playerKey;
        if (!targetKey) return;
        // Don't throw at yourself
        if (targetKey === sanitizeKey(currentPlayer.name)) return;

        emojiTarget = targetKey;
        // Position popup near click
        emojiPopup.style.top = (e.clientY - 350) + 'px';
        emojiPopup.style.left = Math.min(e.clientX, window.innerWidth - 340) + 'px';
        emojiPopup.classList.remove('hidden');
    });

    // Emoji picker selection handler
    emojiPicker.addEventListener('emoji-click', (e) => {
        if (!emojiTarget || !roomRef) return;
        const emoji = e.detail.unicode;

        // Send reaction to Firebase
        roomRef.child('reactions').push({
            from: currentPlayer.name,
            to: emojiTarget,
            emoji: emoji,
            timestamp: Date.now()
        });

        // Close picker
        emojiPopup.classList.add('hidden');
        emojiTarget = null;
    });

    // Close picker on outside click
    document.addEventListener('click', (e) => {
        if (!emojiPopup.classList.contains('hidden') &&
            !emojiPopup.contains(e.target) &&
            !e.target.closest('.player-name')) {
            emojiPopup.classList.add('hidden');
            emojiTarget = null;
        }
    });

    // Enter key in lobby inputs
    roomCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') joinRoomBtn.click();
    });

    // Click active room to join
    activeRoomsList.addEventListener('click', (e) => {
        const roomItem = e.target.closest('.room-item.active');
        if (!roomItem) return;
        const code = roomItem.dataset.roomCode;
        if (!code) return;

        // Pre-fill room code and switch to join mode
        roomCodeInput.value = code;
        document.getElementById('createRoomOption').style.display = 'none';
        document.getElementById('lobbyDivider').style.display = 'none';
        document.querySelector('.lobby-options').classList.add('join-only');
        roomCodeInput.style.display = 'none';
        playerName.focus();
        showToast('Wybierz siebie i dołącz!');
        // Scroll to lobby
        lobbySection.scrollIntoView({ behavior: 'smooth' });
    });

    // Click history room to show popup
    historyRoomsList.addEventListener('click', (e) => {
        const roomItem = e.target.closest('.room-item-clickable');
        if (!roomItem) return;
        const code = roomItem.dataset.historyCode;
        if (!code) return;
        // Fetch room data from Firebase
        db.ref('poker_rooms/' + code).once('value', (snapshot) => {
            if (snapshot.exists()) {
                showHistoryPopup(snapshot.val());
            }
        });
    });

    // Close history popup
    closeHistoryPopup.addEventListener('click', () => {
        historyPopupOverlay.classList.add('hidden');
    });

    historyPopupOverlay.addEventListener('click', (e) => {
        if (e.target === historyPopupOverlay) {
            historyPopupOverlay.classList.add('hidden');
        }
    });

    // --- INIT ---
    async function init() {
        await loadTeamFromExcel();
        loadRoomsList();

        // Check URL for room code
        const urlRoom = getRoomFromURL();
        if (urlRoom) {
            // Joining mode — hide create option, show only join
            document.getElementById('createRoomOption').style.display = 'none';
            document.getElementById('lobbyDivider').style.display = 'none';
            document.querySelector('.lobby-options').classList.add('join-only');

            // Pre-fill room code and make it read-only
            roomCodeInput.value = urlRoom;
            roomCodeInput.readOnly = true;
            roomCodeInput.style.display = 'none'; // hide code input entirely — it's in the URL

            playerName.focus();
        }

        // If URL has room and user was previously in this room, auto-reconnect
        const savedRoom = localStorage.getItem('poker-room');
        const savedPlayer = localStorage.getItem('poker-player');
        const savedMod = localStorage.getItem('poker-moderator');

        if (urlRoom && savedRoom === urlRoom.toUpperCase() && savedPlayer) {
            const snapshot = await db.ref('poker_rooms/' + urlRoom.toUpperCase()).once('value');
            if (snapshot.exists()) {
                const wasMod = savedMod === '1';
                currentUnit = snapshot.val().unit || 'md';
                updateUnitToggleUI();
                currentRoom = urlRoom.toUpperCase();
                currentPlayer = { name: savedPlayer, role: classifySkillset(''), moderator: wasMod };
                isModerator = wasMod;
                roomRef = db.ref('poker_rooms/' + currentRoom);
                enterRoom();
                return;
            }
        }

        // Try to reconnect to previous room (only if no URL room)
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
