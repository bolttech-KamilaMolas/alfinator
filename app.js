// ALFinator — Daily Standup Picker for ALF Team
// Auto-fetches Excel from GitHub repo, shared history via GitHub API
// History auto-clears when all members are picked. Manual clear: admin only (?admin in URL).

(function () {
    'use strict';

    // --- CONFIG ---
    const GITHUB_REPO = 'bolttech-KamilaMolas/alfinator';
    const GITHUB_TOKEN = localStorage.getItem('alfinator-github-token') || ''; // Fine-grained PAT with Contents: Read/Write
    const HISTORY_PATH = 'data/history.json';
    const EXCEL_URL = 'https://bolttech-kamilamolas.github.io/alfinator/data/capacity.xlsx';

    const EXCLUDED_MEMBERS = [
        'Kamila Molas',
        'Adrian Słabicki',
        'Szymon Bartnik',
        'Mikołaj Banaszkiewicz'
    ];

    // Admin mode: append ?admin to URL to see admin controls
    const IS_ADMIN = new URLSearchParams(window.location.search).has('admin');

    // --- STATE ---
    let teamData = [];
    let weekColumns = [];
    let currentWeek = null;
    let disabledMembers = new Set();
    let weekHistory = []; // shared via GitHub
    let historySha = null; // SHA of history.json for GitHub API updates

    // --- GITHUB API HELPERS ---
    async function fetchHistory() {
        try {
            // Read history.json from GitHub (cache-bust to always get fresh SHA)
            const fetchHeaders = { 'Accept': 'application/vnd.github.v3+json', 'If-None-Match': '' };
            if (GITHUB_TOKEN) fetchHeaders['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${HISTORY_PATH}?t=${Date.now()}`,
                { headers: fetchHeaders }
            );
            if (response.status === 404) {
                // File doesn't exist yet
                historySha = null;
                return [];
            }
            if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
            const data = await response.json();
            historySha = data.sha;
            const decoded = decodeURIComponent(escape(atob(data.content)));
            const content = JSON.parse(decoded);
            return Array.isArray(content) ? content : [];
        } catch (error) {
            console.error('Failed to fetch history from GitHub:', error);
            return [];
        }
    }

    async function saveHistory(entries) {
        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(entries, null, 2))));
            const body = {
                message: `Update daily history ${new Date().toLocaleDateString('pl-PL')}`,
                content: content
            };
            if (historySha) {
                body.sha = historySha;
            }
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${HISTORY_PATH}`,
                {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );
            if (response.status === 409) {
                // SHA conflict — refetch and retry once
                console.warn('SHA conflict, retrying...');
                await fetchHistory();
                body.sha = historySha;
                body.content = btoa(unescape(encodeURIComponent(JSON.stringify(entries, null, 2))));
                const retry = await fetch(
                    `https://api.github.com/repos/${GITHUB_REPO}/contents/${HISTORY_PATH}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'Authorization': `Bearer ${GITHUB_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    }
                );
                if (!retry.ok) {
                    const err = await retry.json();
                    throw new Error(`GitHub PUT retry failed: ${retry.status} - ${err.message}`);
                }
                const retryResult = await retry.json();
                historySha = retryResult.content.sha;
                return;
            }
            if (!response.ok) {
                const err = await response.json();
                throw new Error(`GitHub PUT failed: ${response.status} - ${err.message}`);
            }
            const result = await response.json();
            historySha = result.content.sha;
        } catch (error) {
            console.error('Failed to save history to GitHub:', error);
            throw error;
        }
    }

    // --- DOM REFS ---
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const retryBtn = document.getElementById('retryBtn');
    const pickerSection = document.getElementById('pickerSection');
    const todayLabel = document.getElementById('todayLabel');
    const membersList = document.getElementById('membersList');
    const pickBtn = document.getElementById('pickBtn');
    const resultSection = document.getElementById('resultSection');
    const resultName = document.getElementById('resultName');
    const rerollBtn = document.getElementById('rerollBtn');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // --- HISTORY MANAGEMENT ---
    async function loadHistory() {
        try {
            const allHistory = await fetchHistory();
            // Filter by today's date
            const today = new Date().toLocaleDateString('pl-PL', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            weekHistory = allHistory.filter(h => h.date === today);
            renderMembers();
            renderHistory();
        } catch (error) {
            console.error('Failed to load history:', error);
            // Still render members even if history fails
            renderMembers();
            renderHistory();
        }
    }

    function listenToHistory() {
        // Poll history every 30s (GitHub API has rate limits, no need for 5s)
        loadHistory();
        setInterval(loadHistory, 30000);
    }

    async function addToHistory(name) {
        try {
            const date = new Date().toLocaleDateString('pl-PL', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            const entry = {
                name,
                date,
                timestamp: new Date().toISOString()
            };

            // Reload latest to avoid conflicts
            const allHistory = await fetchHistory();
            allHistory.push(entry);
            await saveHistory(allHistory);

            // Update local state
            weekHistory = allHistory.filter(h => h.date === date);
            renderMembers();
            renderHistory();
        } catch (error) {
            console.error('Failed to add to history:', error);
            alert('Nie udało się zapisać losowania. Sprawdź token GitHub.');
        }
    }

    async function removeLastFromHistory() {
        try {
            const allHistory = await fetchHistory();
            const today = new Date().toLocaleDateString('pl-PL', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            // Remove last entry from today
            for (let i = allHistory.length - 1; i >= 0; i--) {
                if (allHistory[i].date === today) {
                    allHistory.splice(i, 1);
                    break;
                }
            }
            await saveHistory(allHistory);
            weekHistory = allHistory.filter(h => h.date === today);
            renderMembers();
            renderHistory();
        } catch (error) {
            console.error('Failed to remove from history:', error);
        }
    }

    async function clearWeekHistory() {
        try {
            const allHistory = await fetchHistory();
            const today = new Date().toLocaleDateString('pl-PL', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            // Remove all entries from today
            const filtered = allHistory.filter(h => h.date !== today);
            await saveHistory(filtered);

            resultSection.classList.add('hidden');
            weekHistory = [];
            renderMembers();
            renderHistory();
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }

    // --- FETCH EXCEL FROM REPO ---
    async function fetchExcelFromRepo() {
        try {
            const response = await fetch(EXCEL_URL + '?t=' + Date.now());
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const arrayBuffer = await response.arrayBuffer();
            parseExcelBuffer(arrayBuffer);
        } catch (err) {
            console.error('Failed to fetch Excel:', err);
            loadingSection.classList.add('hidden');
            errorSection.classList.remove('hidden');
        }
    }

    // --- EXCEL PARSING ---
    function parseExcelBuffer(arrayBuffer) {
        try {
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            const sheetName = workbook.SheetNames.find(
                n => n.toLowerCase().includes('capacity')
            ) || workbook.SheetNames[0];

            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            processSheetData(json);
        } catch (err) {
            alert('Błąd parsowania pliku: ' + err.message);
            console.error(err);
            loadingSection.classList.add('hidden');
            errorSection.classList.remove('hidden');
        }
    }

    function processSheetData(rows) {
        let headerRowIndex = -1;
        let nameCol = -1, surnameCol = -1, fullNameCol = -1, teamCol = -1;

        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i].map(c => String(c).trim().toUpperCase());
            const ni = row.indexOf('NAME');
            const si = row.indexOf('SURNAME');
            const ti = row.findIndex(c => c === 'TEAM');

            if (ni !== -1 && si !== -1 && ti !== -1) {
                headerRowIndex = i;
                nameCol = ni;
                surnameCol = si;
                teamCol = ti;
                fullNameCol = row.indexOf('FULL NAME');
                break;
            }
        }

        if (headerRowIndex === -1) {
            loadingSection.classList.add('hidden');
            errorSection.classList.remove('hidden');
            return;
        }

        const headerRow = rows[headerRowIndex];
        weekColumns = [];

        const dateColIndex = headerRow.findIndex(
            c => String(c).trim().toUpperCase() === 'DATE'
        );
        const startCol = dateColIndex !== -1 ? dateColIndex + 1 : teamCol + 1;

        for (let c = startCol; c < headerRow.length; c++) {
            const val = headerRow[c];
            if (val !== '' && val !== undefined && val !== null) {
                let label = '';
                if (typeof val === 'number' && val > 40000) {
                    const date = excelDateToJS(val);
                    label = formatDateLabel(date);
                } else if (val instanceof Date) {
                    label = formatDateLabel(val);
                } else {
                    const str = String(val).trim();
                    const parsed = new Date(str);
                    if (!isNaN(parsed.getTime()) && str.match(/^\d{4}-\d{2}-\d{2}/)) {
                        label = formatDateLabel(parsed);
                    } else {
                        label = str;
                    }
                }
                if (label) weekColumns.push({ label, colIndex: c });
            }
        }

        teamData = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            const name = String(row[nameCol] || '').trim();
            const surname = String(row[surnameCol] || '').trim();
            const team = String(row[teamCol] || '').trim().toUpperCase();

            if (!name || !team) continue;
            if (team !== 'ALF') continue;

            const fullName = fullNameCol !== -1
                ? String(row[fullNameCol] || '').trim() || `${name} ${surname}`
                : `${name} ${surname}`;

            const isExcluded = EXCLUDED_MEMBERS.some(
                ex => fullName.toLowerCase() === ex.toLowerCase()
            );
            if (isExcluded) continue;

            const weeks = {};
            weekColumns.forEach(wc => {
                weeks[wc.label] = parseAvailability(row[wc.colIndex]);
            });

            teamData.push({ name, surname, fullName, team, weeks });
        }

        if (teamData.length === 0) {
            loadingSection.classList.add('hidden');
            errorSection.classList.remove('hidden');
            return;
        }

        showPickerSection();
    }

    function parseAvailability(cellValue) {
        if (cellValue === null || cellValue === undefined || cellValue === '') return 0;
        const str = String(cellValue).trim();
        if (str.endsWith('%')) return parseFloat(str) / 100;
        const num = parseFloat(str);
        if (!isNaN(num)) return num > 1 ? num / 100 : num;
        return 0;
    }

    function excelDateToJS(serial) {
        const utcDays = Math.floor(serial - 25569);
        return new Date(utcDays * 86400 * 1000);
    }

    function formatDateLabel(date) {
        const day = date.getDate();
        const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
            'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
        const year = date.getFullYear();
        return `${day} ${months[date.getMonth()]} ${year}`;
    }

    // --- WEEK DETECTION ---
    function findCurrentWeek() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let bestMatch = weekColumns.length - 1;

        for (let i = 0; i < weekColumns.length; i++) {
            const weekDate = parseDateLabel(weekColumns[i].label);
            if (weekDate) {
                const nextWeekDate = i + 1 < weekColumns.length
                    ? parseDateLabel(weekColumns[i + 1].label)
                    : new Date(9999, 0, 1);
                if (today >= weekDate && today < nextWeekDate) {
                    bestMatch = i;
                    break;
                }
            }
        }
        return bestMatch;
    }

    function parseDateLabel(label) {
        const months = { 'sty': 0, 'lut': 1, 'mar': 2, 'kwi': 3, 'maj': 4, 'cze': 5,
            'lip': 6, 'sie': 7, 'wrz': 8, 'paź': 9, 'lis': 10, 'gru': 11 };
        const parts = label.toLowerCase().split(/\s+/);
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            const year = parseInt(parts[2]);
            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
        if (parts.length >= 2) {
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            if (!isNaN(day) && month !== undefined) {
                return new Date(new Date().getFullYear(), month, day);
            }
        }
        return null;
    }

    // --- UI ---
    function showPickerSection() {
        loadingSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        pickerSection.classList.remove('hidden');
        historySection.classList.remove('hidden');

        const currentIdx = findCurrentWeek();
        currentWeek = weekColumns[currentIdx]?.label;

        const today = new Date();
        const dayOfWeek = today.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            todayLabel.innerHTML = '📅 <strong>Weekend</strong> — losowanie dostępne w dni robocze';
            pickBtn.disabled = true;
            pickBtn.textContent = '🏖️ Weekend';
        } else {
            const dateStr = today.toLocaleDateString('pl-PL', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            todayLabel.innerHTML = `📅 Dziś: <strong>${dateStr}</strong>`;
        }

        if (IS_ADMIN) {
            clearHistoryBtn.classList.remove('hidden');
        }

        loadDisabledMembers();
        listenToHistory();
    }

    function renderMembers() {
        membersList.innerHTML = '';
        const usedNames = new Set(weekHistory.map(h => h.name));
        const membersForWeek = getMembersForWeek();

        if (membersForWeek.length === 0) {
            membersList.innerHTML = '<p class="empty-state">Brak osób w tym tygodniu</p>';
            pickBtn.disabled = true;
            return;
        }

        membersForWeek.forEach(member => {
            const isUsed = usedNames.has(member.fullName);
            const isDisabled = disabledMembers.has(member.fullName);

            const label = document.createElement('label');
            label.className = 'member-toggle';
            if (isDisabled) label.classList.add('unchecked');
            else if (isUsed) label.classList.add('used');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = !isDisabled;
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    disabledMembers.delete(member.fullName);
                } else {
                    disabledMembers.add(member.fullName);
                }
                saveDisabledMembers();
                renderMembers();
            });

            const text = document.createTextNode(
                member.fullName + (isUsed && !isDisabled ? ' ✓' : '')
            );

            label.appendChild(checkbox);
            label.appendChild(text);
            membersList.appendChild(label);
        });

        const today = new Date();
        const dayOfWeek = today.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return;

        const eligible = getEligibleMembers();
        if (eligible.length === 0) {
            pickBtn.disabled = true;
            pickBtn.textContent = '✅ Wszyscy już prowadzili!';
        } else {
            pickBtn.disabled = false;
            pickBtn.innerHTML = '<span class="btn-icon">🎲</span> Losuj!';
        }
    }

    function getMembersForWeek() {
        if (!currentWeek) return [];
        return teamData.filter(m => {
            const availability = m.weeks[currentWeek];
            return availability && availability > 0;
        });
    }

    function getAvailableMembers() {
        return getMembersForWeek().filter(m => !disabledMembers.has(m.fullName));
    }

    function getEligibleMembers() {
        const available = getAvailableMembers();
        const usedNames = new Set(weekHistory.map(h => h.name));
        return available.filter(m => !usedNames.has(m.fullName));
    }

    // --- DISABLED MEMBERS (localStorage - resets daily) ---
    function getDisabledKey() {
        const today = new Date().toISOString().slice(0, 10);
        return `alfinator-disabled-${today}`;
    }

    function loadDisabledMembers() {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('alfinator-disabled-') && key !== getDisabledKey()) {
                    localStorage.removeItem(key);
                }
            }
            const stored = localStorage.getItem(getDisabledKey());
            disabledMembers = stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            disabledMembers = new Set();
        }
    }

    function saveDisabledMembers() {
        localStorage.setItem(getDisabledKey(), JSON.stringify([...disabledMembers]));
    }

    function startDayChangeWatcher() {
        let lastKey = getDisabledKey();
        setInterval(() => {
            const currentKey = getDisabledKey();
            if (currentKey !== lastKey) {
                lastKey = currentKey;
                loadDisabledMembers();
                renderMembers();
            }
        }, 60000);
    }

    // --- RANDOM PICK ---
    function pickRandom() {
        const eligible = getEligibleMembers();
        if (eligible.length === 0) return null;
        return eligible[Math.floor(Math.random() * eligible.length)];
    }

    function animatePick(callback) {
        pickerSection.classList.add('picking');
        resultSection.classList.remove('hidden');
        resultName.textContent = '...';

        const eligible = getEligibleMembers();
        let count = 0;
        const interval = setInterval(() => {
            resultName.textContent = eligible[Math.floor(Math.random() * eligible.length)].fullName;
            count++;
            if (count >= 15) {
                clearInterval(interval);
                pickerSection.classList.remove('picking');
                callback();
            }
        }, 100);
    }

    function doPick() {
        const picked = pickRandom();
        if (!picked) {
            alert('Brak dostępnych osób do wylosowania!');
            return;
        }
        animatePick(async () => {
            resultName.textContent = picked.fullName;
            await addToHistory(picked.fullName);

            setTimeout(() => {
                const available = getAvailableMembers();
                const usedNames = new Set(weekHistory.map(h => h.name));
                const remaining = available.filter(m => !usedNames.has(m.fullName));

                if (remaining.length === 0 && available.length > 0) {
                    setTimeout(() => {
                        clearWeekHistory();
                    }, 3000);
                }
            }, 500);
        });
    }

    function renderHistory() {
        if (weekHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-state">Nikt jeszcze nie losował</p>';
            return;
        }
        historyList.innerHTML = weekHistory.map((h, idx) => `
            <div class="history-item">
                <span class="name">${idx + 1}. ${h.name}</span>
                <span class="date">${h.date}</span>
            </div>
        `).join('');
    }

    // --- EVENTS ---
    pickBtn.addEventListener('click', doPick);

    rerollBtn.addEventListener('click', async () => {
        await removeLastFromHistory();
        doPick();
    });

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('ADMIN: Wyczyścić historię? (dla wszystkich!)')) {
            clearWeekHistory();
        }
    });

    retryBtn.addEventListener('click', () => {
        errorSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        fetchExcelFromRepo();
    });

    // --- INIT ---
    startDayChangeWatcher();
    fetchExcelFromRepo();

    // --- TOKEN UI ---
    const tokenSection = document.getElementById('tokenSection');
    const tokenInput = document.getElementById('tokenInput');
    const saveTokenBtn = document.getElementById('saveTokenBtn');

    if (!GITHUB_TOKEN) {
        tokenSection.classList.remove('hidden');
    }

    saveTokenBtn.addEventListener('click', () => {
        const val = tokenInput.value.trim();
        if (val) {
            localStorage.setItem('alfinator-github-token', val);
            tokenSection.classList.add('hidden');
            location.reload();
        }
    });

})();
