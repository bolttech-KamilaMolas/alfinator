// Release Management Module - CLEAN VERSION
// Uses capacity-planner proven Excel parsing logic

(function () {
    'use strict';

    // --- FIREBASE CONFIG ---
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

    // --- STATE ---
    let releases = [];
    let filteredReleases = [];
    let currentEditingRelease = null;
    let tempImportData = [];
    let teamAvailability = {}; // Maps "YYYY-MM-DD" → { "ALF": [{name, available}], "QA": [{name, available}] }

    // --- DOM REFS ---
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const mainSection = document.getElementById('mainSection');
    const releasesList = document.getElementById('releasesList');
    const retryBtn = document.getElementById('retryBtn');

    // Toolbar
    const filterStatus = document.getElementById('filterStatus');
    const filterTeam = document.getElementById('filterTeam');
    const searchInput = document.getElementById('searchInput');
    const newReleaseBtn = document.getElementById('newReleaseBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');

    // Release Modal
    const releaseModal = document.getElementById('releaseModal');
    const modalTitle = document.getElementById('modalTitle');
    const releaseForm = document.getElementById('releaseForm');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalSaveBtn = document.getElementById('modalSaveBtn');

    // Form Fields
    const releaseVersion = document.getElementById('releaseVersion');
    const releaseName = document.getElementById('releaseName');

    const releaseDescription = document.getElementById('releaseDescription');
    const releaseStatus = document.getElementById('releaseStatus');
    const releaseHealth = document.getElementById('releaseHealth');
    const releasePlannedStart = document.getElementById('releasePlannedStart');
    const releasePlannedEnd = document.getElementById('releasePlannedEnd');
    const releaseProgress = document.getElementById('releaseProgress');
    const progressValue = document.getElementById('progressValue');
    const techLeadField = document.getElementById('techLeadField');
    const qaLeadField = document.getElementById('qaLeadField');
    const vacationWarning = document.getElementById('vacationWarning');
    const teamCheckboxes = document.querySelectorAll('.team-checkbox');
    const releaseBlockers = document.getElementById('releaseBlockers');
    const releaseNotes = document.getElementById('releaseNotes');

    // Import Modal
    const importModal = document.getElementById('importModal');
    const importFile = document.getElementById('importFile');
    const importPreview = document.getElementById('importPreview');
    const importCount = document.getElementById('importCount');
    const importCloseBtn = document.getElementById('importCloseBtn');
    const importCancelBtn = document.getElementById('importCancelBtn');
    const importConfirmBtn = document.getElementById('importConfirmBtn');

    // --- FIREBASE FUNCTIONS ---

    function getReleasesRef() {
        return db.ref('releases');
    }

    function getAuditRef() {
        return db.ref('releases_audit');
    }

    // --- EXCEL DATE CONVERSION ---

    function excelDateToJS(serial) {
        const utcDays = Math.floor(serial - 25569);
        return new Date(utcDays * 86400 * 1000);
    }

    // --- TEAM AVAILABILITY LOADING ---

    async function loadTeamAvailability() {
        try {
            const EXCEL_URL = 'https://bolttech-kamilamolas.github.io/alfinator/data/capacity.xlsx';
            const response = await fetch(EXCEL_URL);
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            
            processSheetData(json);
        } catch (err) {
            console.error('Failed to load team availability:', err);
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
            console.error('Could not find header row (NAME, SURNAME, TEAM)');
            return;
        }

        const headerRow = rows[headerRowIndex];
        let dateColumns = [];

        const dateColIndex = headerRow.findIndex(
            c => String(c).trim().toUpperCase() === 'DATE'
        );
        const startCol = dateColIndex !== -1 ? dateColIndex + 1 : teamCol + 1;

        for (let c = startCol; c < headerRow.length; c++) {
            const val = headerRow[c];
            if (val !== '' && val !== undefined && val !== null) {
                let dateStr = '';
                if (typeof val === 'number' && val > 40000) {
                    const date = excelDateToJS(val);
                    dateStr = date.toISOString().split('T')[0];
                } else {
                    const str = String(val).trim();
                    if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
                        dateStr = str.substring(0, 10);
                    }
                }
                if (dateStr) {
                    dateColumns.push({ dateStr, colIndex: c });
                }
            }
        }

        teamAvailability = {};

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            const name = String(row[nameCol] || '').trim();
            const surname = String(row[surnameCol] || '').trim();
            const team = String(row[teamCol] || '').trim().toUpperCase();

            if (!name || !team) continue;

            const fullName = fullNameCol !== -1
                ? String(row[fullNameCol] || '').trim() || `${name} ${surname}`
                : `${name} ${surname}`;

            dateColumns.forEach(dc => {
                const availValue = row[dc.colIndex];
                const available = availValue === 1 || availValue === '1' || availValue === 0.85 || availValue === '0.85';

                if (!teamAvailability[dc.dateStr]) {
                    teamAvailability[dc.dateStr] = {};
                }
                if (!teamAvailability[dc.dateStr][team]) {
                    teamAvailability[dc.dateStr][team] = [];
                }

                teamAvailability[dc.dateStr][team].push({
                    name: fullName,
                    available: available
                });
            });
        }

        console.log(`✅ Loaded availability: ${Object.keys(teamAvailability).length} dates`);
    }

    // --- DROPDOWN & AVAILABILITY ---

    function updateAvailableLeads(dateStr) {
        if (!dateStr) {
            updateDropdown('techLeadField', []);
            updateDropdown('qaLeadField', []);
            vacationWarning.classList.add('hidden');
            return;
        }

        const techLeads = getAvailableTeamMembers(dateStr, 'ALF');
        const qaLeads = getAvailableTeamMembers(dateStr, 'QA');

        updateDropdown('techLeadField', techLeads);
        updateDropdown('qaLeadField', qaLeads);

        const currentTechLead = techLeadField.value;
        const currentQALead = qaLeadField.value;
        checkVacationConflicts(dateStr, currentTechLead, currentQALead);
    }

    function getAvailableTeamMembers(dateStr, teamFilter) {
        if (!teamAvailability[dateStr]) {
            return [];
        }

        const teamData = teamAvailability[dateStr][teamFilter] || [];
        return teamData
            .filter(member => member.available)
            .map(member => member.name)
            .sort();
    }

    function checkVacationConflicts(dateStr, techLeadName, qaLeadName) {
        const conflicts = [];

        if (!teamAvailability[dateStr]) {
            vacationWarning.classList.add('hidden');
            return;
        }

        if (techLeadName) {
            const alfMembers = teamAvailability[dateStr]['ALF'] || [];
            const techLead = alfMembers.find(m => m.name === techLeadName);
            if (techLead && !techLead.available) {
                conflicts.push(`⚠️ Tech Lead "${techLeadName}" jest na urlopie w ${dateStr}`);
            }
        }

        if (qaLeadName) {
            const qaMembers = teamAvailability[dateStr]['QA'] || [];
            const qaLead = qaMembers.find(m => m.name === qaLeadName);
            if (qaLead && !qaLead.available) {
                conflicts.push(`⚠️ QA Lead "${qaLeadName}" jest na urlopie w ${dateStr}`);
            }
        }

        if (conflicts.length > 0) {
            vacationWarning.innerHTML = conflicts.join('<br>');
            vacationWarning.classList.remove('hidden');
        } else {
            vacationWarning.classList.add('hidden');
        }
    }

    function updateDropdown(dropdownId, options) {
        const dropdown = document.getElementById(dropdownId);
        const currentValue = dropdown.value;
        
        dropdown.innerHTML = '<option value="">— Wybierz —</option>' +
            options.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
        
        if (options.includes(currentValue)) {
            dropdown.value = currentValue;
        }
    }

    // --- UTILITIES ---

    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }


    // --- FIREBASE LISTENERS & CRUD ---

    function listenToReleases() {
        getReleasesRef().on('value', snapshot => {
            releases = [];
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(key => {
                    releases.push({ id: key, ...data[key] });
                });
            }
            releases.sort((a, b) => {
                if (a.status !== b.status) {
                    const statusOrder = { 'active': 0, 'planning': 1, 'completed': 2 };
                    return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
                }
                return new Date(b.plannedStart || 0) - new Date(a.plannedStart || 0);
            });
            applyFilters();
        }, err => {
            console.error('Listener error:', err);
            showError(`Błąd nasłuchiwania: ${err.message}`);
        });
    }

    function createRelease(releaseData) {
        return getReleasesRef().push({
            ...releaseData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).then(ref => {
            logAudit('CREATE', ref.key, releaseData);
            return ref.key;
        }).catch(err => {
            console.error('Create error:', err);
            throw new Error(`Nie można dodać wydania: ${err.message}`);
        });
    }

    function updateRelease(releaseId, updates) {
        return getReleasesRef().child(releaseId).update({
            ...updates,
            updatedAt: new Date().toISOString()
        }).then(() => {
            logAudit('UPDATE', releaseId, updates);
        }).catch(err => {
            console.error('Update error:', err);
            throw new Error(`Nie można zaktualizować wydania: ${err.message}`);
        });
    }

    function deleteRelease(releaseId) {
        return getReleasesRef().child(releaseId).remove().then(() => {
            logAudit('DELETE', releaseId, {});
        }).catch(err => {
            console.error('Delete error:', err);
            throw new Error(`Nie można usunąć wydania: ${err.message}`);
        });
    }

    function logAudit(action, releaseId, data) {
        getAuditRef().push({
            action: action,
            releaseId: releaseId,
            data: data,
            timestamp: new Date().toISOString(),
            user: 'anonymous'
        }).catch(err => console.error('Audit log error:', err));
    }


    // --- FILTERING ---

    function applyFilters() {
        const statusFilter = filterStatus.value;
        const teamFilter = filterTeam.value;
        const searchTerm = searchInput.value.toLowerCase();

        filteredReleases = releases.filter(r => {
            const statusMatch = !statusFilter || r.status === statusFilter;
            const teamMatch = !teamFilter || (r.teams && r.teams.includes(teamFilter));
            const searchMatch = !searchTerm || 
                r.version.toLowerCase().includes(searchTerm) ||
                r.name.toLowerCase().includes(searchTerm) ||
                (r.description || '').toLowerCase().includes(searchTerm) ||
                (r.techLead || '').toLowerCase().includes(searchTerm) ||
                (r.qaLead || '').toLowerCase().includes(searchTerm);

            return statusMatch && teamMatch && searchMatch;
        });

        renderReleases();
    }

    // --- RENDERING ---

    function renderReleases() {
        if (filteredReleases.length === 0) {
            releasesList.innerHTML = '<div class="empty-state">Brak wydań. <a href="#" id="createFromEmpty">Stwórz nowe.</a></div>';
            document.getElementById('createFromEmpty')?.addEventListener('click', e => {
                e.preventDefault();
                openReleaseModal();
            });
            return;
        }

        releasesList.innerHTML = filteredReleases.map(r => `
            <div class="release-card status-${r.status} health-${r.health || 'unknown'}">
                <div class="card-header">
                    <span class="version-badge">${escapeHtml(r.version)}</span>
                    <span class="status-badge status-${r.status}">${getStatusLabel(r.status)}</span>
                    <span class="health-badge health-${r.health || 'unknown'}">${getHealthLabel(r.health)}</span>
                </div>
                <div class="card-title">${escapeHtml(r.name)}</div>
                <div class="card-meta">
                    <div><strong>Tech Lead:</strong> ${escapeHtml(r.techLead || '—')}</div>
                    <div><strong>QA Lead:</strong> ${escapeHtml(r.qaLead || '—')}</div>
                    <div><strong>Okres:</strong> ${r.plannedStart || '—'} do ${r.plannedEnd || '—'}</div>
                    <div><strong>Postęp:</strong> ${r.progress || 0}%</div>
                </div>
                ${r.description ? `<div class="card-description">${escapeHtml(r.description)}</div>` : ''}
                <div class="card-actions">
                    <button class="btn btn-small btn-edit" data-id="${escapeHtml(r.id)}">Edytuj</button>
                    <button class="btn btn-small btn-delete" data-id="${escapeHtml(r.id)}">Usuń</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openReleaseModal(btn.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteReleaseWithConfirm(btn.dataset.id));
        });
    }

    function getStatusLabel(status) {
        const labels = {
            'planning': 'Planowanie',
            'active': 'Aktywne',
            'completed': 'Zakończone',
            'blocked': 'Zablokowane'
        };
        return labels[status] || status;
    }

    function getHealthLabel(health) {
        const labels = {
            'green': '🟢 Zdrowa',
            'yellow': '🟡 Ostrzeżenie',
            'red': '🔴 Krytyczne'
        };
        return labels[health] || 'Nieznana';
    }


    // --- MODAL MANAGEMENT ---

    function openReleaseModal(releaseId = null) {
        currentEditingRelease = null;
        
        if (releaseId) {
            currentEditingRelease = releases.find(r => r.id === releaseId);
            if (!currentEditingRelease) {
                showError('Wydanie nie znalezione');
                return;
            }
            modalTitle.textContent = 'Edytuj wydanie';
            releaseVersion.value = currentEditingRelease.version || '';
            releaseName.value = currentEditingRelease.name || '';
            releaseDescription.value = currentEditingRelease.description || '';
            releaseStatus.value = currentEditingRelease.status || 'planning';
            releaseHealth.value = currentEditingRelease.health || 'unknown';
            releasePlannedStart.value = currentEditingRelease.plannedStart || '';
            releasePlannedEnd.value = currentEditingRelease.plannedEnd || '';
            releaseProgress.value = currentEditingRelease.progress || 0;
            progressValue.textContent = currentEditingRelease.progress || 0;
            techLeadField.value = currentEditingRelease.techLead || '';
            qaLeadField.value = currentEditingRelease.qaLead || '';
            releaseBlockers.value = currentEditingRelease.blockers || '';
            releaseNotes.value = currentEditingRelease.notes || '';

            (currentEditingRelease.teams || []).forEach(team => {
                const checkbox = document.querySelector(`.team-checkbox[value="${team}"]`);
                if (checkbox) checkbox.checked = true;
            });

            updateAvailableLeads(releasePlannedStart.value);
        } else {
            modalTitle.textContent = 'Nowe wydanie';
            releaseForm.reset();
            teamCheckboxes.forEach(cb => cb.checked = false);
            vacationWarning.classList.add('hidden');
        }

        releaseModal.classList.remove('hidden');
    }

    function closeReleaseModal() {
        releaseModal.classList.add('hidden');
        currentEditingRelease = null;
        releaseForm.reset();
        teamCheckboxes.forEach(cb => cb.checked = false);
        vacationWarning.classList.add('hidden');
    }

    async function saveRelease() {
        const errors = [];

        if (!releaseVersion.value.trim()) errors.push('Wersja jest wymagana');
        if (!releaseName.value.trim()) errors.push('Nazwa jest wymagana');
        if (!releasePlannedStart.value) errors.push('Data początkowa jest wymagana');
        if (!releasePlannedEnd.value) errors.push('Data końcowa jest wymagana');

        if (new Date(releasePlannedStart.value) > new Date(releasePlannedEnd.value)) {
            errors.push('Data początkowa musi być przed datą końcową');
        }

        const selectedTeams = Array.from(teamCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        if (selectedTeams.length === 0) {
            errors.push('Wybierz co najmniej jeden zespół');
        }

        if (errors.length > 0) {
            showError(errors.join('\n'));
            return;
        }

        const releaseData = {
            version: releaseVersion.value.trim(),
            name: releaseName.value.trim(),
            description: releaseDescription.value.trim(),
            status: releaseStatus.value,
            health: releaseHealth.value,
            plannedStart: releasePlannedStart.value,
            plannedEnd: releasePlannedEnd.value,
            progress: parseInt(releaseProgress.value) || 0,
            techLead: techLeadField.value || null,
            qaLead: qaLeadField.value || null,
            teams: selectedTeams,
            blockers: releaseBlockers.value.trim(),
            notes: releaseNotes.value.trim()
        };

        try {
            if (currentEditingRelease) {
                await updateRelease(currentEditingRelease.id, releaseData);
                showSuccess('Wydanie zaktualizowane');
            } else {
                await createRelease(releaseData);
                showSuccess('Wydanie dodane');
            }
            closeReleaseModal();
        } catch (err) {
            showError(err.message);
        }
    }

    function deleteReleaseWithConfirm(releaseId) {
        if (!confirm('Czy na pewno usunąć to wydanie?')) return;

        deleteRelease(releaseId)
            .then(() => showSuccess('Wydanie usunięte'))
            .catch(err => showError(err.message));
    }


    // --- EXPORT / IMPORT ---

    function exportReleases() {
        const dataStr = JSON.stringify(releases, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `releases_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function handleImportFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                tempImportData = JSON.parse(e.target.result);
                if (!Array.isArray(tempImportData)) {
                    showError('Import musi być tablicą wydań');
                    return;
                }
                importCount.textContent = tempImportData.length;
                importPreview.innerHTML = tempImportData.slice(0, 5).map(r => 
                    `<div class="import-item">${escapeHtml(r.version)} - ${escapeHtml(r.name)}</div>`
                ).join('');
                if (tempImportData.length > 5) {
                    importPreview.innerHTML += `<div class="import-item">... i ${tempImportData.length - 5} więcej</div>`;
                }
                importModal.classList.remove('hidden');
            } catch (err) {
                showError('Błąd odczytu pliku: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    async function confirmImport() {
        let imported = 0;
        let failed = 0;

        for (const releaseData of tempImportData) {
            try {
                await createRelease(releaseData);
                imported++;
            } catch (err) {
                console.error('Import error for:', releaseData, err);
                failed++;
            }
        }

        importModal.classList.add('hidden');
        tempImportData = [];
        showSuccess(`Zaimportowano ${imported} wydań${failed > 0 ? ` (${failed} błędów)` : ''}`);
    }

    function closeImportModal() {
        importModal.classList.add('hidden');
        importFile.value = '';
        tempImportData = [];
    }


    // --- UI FEEDBACK ---

    function showLoading() {
        loadingSection.classList.remove('hidden');
        errorSection.classList.add('hidden');
        mainSection.classList.add('hidden');
    }

    function showError(message) {
        errorSection.querySelector('p').textContent = message;
        errorSection.classList.remove('hidden');
        loadingSection.classList.add('hidden');
    }

    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showMain() {
        mainSection.classList.remove('hidden');
        loadingSection.classList.add('hidden');
        errorSection.classList.add('hidden');
    }

    // --- EVENT LISTENERS ---

    function setupEventListeners() {
        // Toolbar
        newReleaseBtn.addEventListener('click', () => openReleaseModal());
        exportBtn.addEventListener('click', exportReleases);
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => {
            if (e.target.files[0]) handleImportFile(e.target.files[0]);
        });

        // Filters
        filterStatus.addEventListener('change', applyFilters);
        filterTeam.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', applyFilters);

        // Release Modal
        modalCloseBtn.addEventListener('click', closeReleaseModal);
        modalCancelBtn.addEventListener('click', closeReleaseModal);
        modalSaveBtn.addEventListener('click', saveRelease);

        releaseModal.addEventListener('click', (e) => {
            if (e.target === releaseModal) closeReleaseModal();
        });

        // Date change triggers availability update
        releasePlannedStart.addEventListener('change', () => {
            updateAvailableLeads(releasePlannedStart.value);
        });

        // Tech & QA Lead change triggers conflict check
        techLeadField.addEventListener('change', () => {
            checkVacationConflicts(releasePlannedStart.value, techLeadField.value, qaLeadField.value);
        });
        qaLeadField.addEventListener('change', () => {
            checkVacationConflicts(releasePlannedStart.value, techLeadField.value, qaLeadField.value);
        });

        // Progress slider
        releaseProgress.addEventListener('input', () => {
            progressValue.textContent = releaseProgress.value;
        });

        // Import Modal
        importCloseBtn.addEventListener('click', closeImportModal);
        importCancelBtn.addEventListener('click', closeImportModal);
        importConfirmBtn.addEventListener('click', confirmImport);

        importModal.addEventListener('click', (e) => {
            if (e.target === importModal) closeImportModal();
        });

        // Retry button
        retryBtn.addEventListener('click', () => {
            showLoading();
            initApp();
        });
    }


    // --- INITIALIZATION ---

    async function initApp() {
        try {
            showLoading();
            
            // Load team availability from Excel
            await loadTeamAvailability();
            
            // Start Firebase listener
            listenToReleases();
            
            // Setup event listeners
            setupEventListeners();
            
            // Show main section
            showMain();
        } catch (err) {
            console.error('Init error:', err);
            showError(`Błąd inicjalizacji: ${err.message}`);
        }
    }

    // --- START ---

    document.addEventListener('DOMContentLoaded', initApp);

})();
