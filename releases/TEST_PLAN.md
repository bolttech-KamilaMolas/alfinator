# Phase 1.5 Release Management - Test Plan

## Status: ✅ CODE COMPLETE
- **releases.js**: Fully written (~900 lines) with no syntax errors
- **HTML**: Form fields ready (techLeadField, qaLeadField, vacationWarning)
- **HTTP Server**: Running on `http://localhost:8000`
- **Excel Data**: Using GitHub URL (proven working in capacity-planner)

---

## Test Steps

### 1️⃣ Open Release Management Page
**URL:** `http://localhost:8000/releases/`

**Expected:**
- Page loads without errors (F12 → Console)
- Loading section shows briefly, then disappears
- Main section appears with empty state: "Brak wydań. Stwórz nowe."
- ✅ Console shows: `✅ Loaded availability: X dates` (where X > 0)

---

### 2️⃣ Create New Release
**Click:** "+ Nowe wydanie" button

**Expected:**
- Modal opens with title "Nowe wydanie"
- Tech Lead dropdown empty (shows "— Wybierz —")
- QA Lead dropdown empty (shows "— Wybierz —")
- Vacation warning hidden

**Action:** Fill form:
- Version: `1.0.0`
- Name: `Test Release`
- Status: `active`
- Select teams: `ALF`, `QA`
- **Planned Start:** Pick date from 2024 (e.g., `2024-03-12`)
- **Planned End:** `2024-03-15`

**Expected After Date Select:**
- Tech Lead dropdown populates with ALF team members
- QA Lead dropdown populates with QA team members
- ✅ Both dropdowns show names like "Kamila Molas", "Rafał Mianowicz", etc.

---

### 3️⃣ Test Vacation Conflict Detection

**Scenario A: Available Lead on Selected Date**
- Tech Lead dropdown filled with available members
- Select any member from Tech Lead
- **Expected:** No warning, save succeeds

**Scenario B: Lead on Vacation**
- Select date where tech lead is on vacation (availValue = 0 or empty in Excel)
- Select that specific lead from Tech Lead dropdown
- **Expected:** Red warning appears: `⚠️ Tech Lead "Name" jest na urlopie w YYYY-MM-DD`
- Confirm save dialog still allows save (warning only)

**How to find vacation date:**
- Open `https://bolttech-kamilamolas.github.io/alfinator/data/capacity.xlsx`
- Look for row with `availValue = 0` or empty
- Note the date from that column
- Use it in test

---

### 4️⃣ Test Firebase Real-Time Sync

**Step 1:** Save release with Tech Lead + QA Lead assigned
- Click "Zapisz"
- ✅ Success toast: "Wydanie dodane"
- Release appears in list

**Step 2:** Refresh page (F5)
- ✅ Release still there with same Tech Lead + QA Lead
- No reload needed, Firebase listener reattaches

**Step 3:** Open in new tab `http://localhost:8000/releases/`
- ✅ Same release visible
- Confirms real-time sync (if you edit in first tab, second tab updates instantly)

---

### 5️⃣ Test Dropdown Repopulation on Date Change

**Current:** Release open in edit modal

**Action:** Change Planned Start date to different date in 2024
- **Expected:** 
  - Tech Lead dropdown clears and repopulates with ALF members from new date
  - QA Lead dropdown clears and repopulates with QA members from new date
  - Vacation conflicts re-checked for newly selected leads

---

### 6️⃣ Test Export/Import

**Export:**
- Click "📥 Eksportuj"
- ✅ JSON file downloaded: `releases_YYYY-MM-DD.json`
- Contains release data with `techLead`, `qaLead` fields

**Import:**
- Create test JSON file with release(s)
- Click "📤 Importuj"
- Select file
- ✅ Preview shows 5 releases + count
- Click "Potwierdź import"
- ✅ Success toast: "Zaimportowano X wydań"

---

### 7️⃣ Test Search & Filters

**Search:**
- Type in search box
- ✅ Releases filtered by version, name, description, tech lead, QA lead

**Filter by Status:**
- Change status filter
- ✅ Only matching status releases shown

**Filter by Team:**
- Change team filter
- ✅ Only matching team releases shown

---

## Console Checks (F12 → Console)

After each action, verify:
- ❌ No red errors
- ✅ `✅ Loaded availability: X dates` (startup)
- ✅ Audit log messages or Firebase update logs (on save)

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Dropdowns stay empty | Excel not loaded | Check console: `✅ Loaded availability` message |
| No vacation warning | Date not in Excel | Try another date from 2024 (e.g., 2024-03-12) |
| Firebase fails | Network offline | Verify internet connection |
| Page doesn't load | HTTP server down | Run: `python -m http.server 8000` in daily-picker dir |

---

## Success Criteria

- ✅ Page loads without JS errors
- ✅ Tech Lead dropdown populated from ALF team
- ✅ QA Lead dropdown populated from QA team
- ✅ Vacation conflict warning appears when lead on vacation
- ✅ Date change updates dropdown options
- ✅ Firebase saves and syncs real-time
- ✅ Export/Import works with new fields
- ✅ No "Lider wydania" generic field (removed ✅)

---

## Next Steps After Testing

1. If all tests pass: Mark tasks complete
   - Task #9 (Firebase sync) ✅
   - Task #10 (Vacation detection) ✅

2. Delete backup file:
   - `releases-BACKUP.js` (if exists)

3. Clean up console.log() debug statements (keep error logs)

4. Celebrate! 🎉

