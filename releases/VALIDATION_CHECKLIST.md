# Phase 1.5 Release Management - Validation Checklist ✅

## Pre-Testing Verification

- [x] `releases.js` file written (~900 lines)
- [x] No syntax errors (code compiles)
- [x] HTML has all required form fields:
  - [x] `techLeadField` → Tech Lead dropdown
  - [x] `qaLeadField` → QA Lead dropdown
  - [x] `vacationWarning` → Warning element
- [x] Firebase configuration present
- [x] XLSX library loaded in HTML
- [x] HTTP server running on port 8000
- [x] Generic "Lider wydania" field REMOVED
- [x] Backup file deleted (`releases-BACKUP.js`)
- [x] Excel data source: GitHub URL ready
- [x] TEST_PLAN.md created
- [x] IMPLEMENTATION_COMPLETE.md created

---

## Functional Testing (Follow TEST_PLAN.md)

### Browser Test: Page Load
- [ ] Navigate to `http://localhost:8000/releases/`
- [ ] Console shows NO errors (F12 → Console tab)
- [ ] ✅ Console shows: `✅ Loaded availability: X dates` (X > 0)
- [ ] Main section visible with "Brak wydań" message

### Test 1: Create Release & Date Selection
- [ ] Click "+ Nowe wydanie"
- [ ] Modal opens with empty fields
- [ ] Tech Lead dropdown empty (shows "— Wybierz —")
- [ ] QA Lead dropdown empty (shows "— Wybierz —")
- [ ] Fill: Version, Name, Status, Teams, Planned Start (select 2024 date like 2024-03-12)
- [ ] ✅ Tech Lead dropdown POPULATES with ALF members
- [ ] ✅ QA Lead dropdown POPULATES with QA members

### Test 2: Vacation Conflict Detection
- [ ] Select Tech Lead from dropdown (known available)
- [ ] Select QA Lead from dropdown (known available)
- [ ] ✅ No warning shown
- [ ] Change Planned Start to date where leads are on vacation
- [ ] ✅ Red warning appears: `⚠️ Tech Lead "Name" jest na urlopie w YYYY-MM-DD`
- [ ] ✅ Warning disappears when changing to available date

### Test 3: Dropdown Repopulation on Date Change
- [ ] Modal open, showing Tech Lead + QA Lead populated
- [ ] Change Planned Start date to different date in 2024
- [ ] ✅ Tech Lead dropdown clears and repopulates (new options)
- [ ] ✅ QA Lead dropdown clears and repopulates (new options)
- [ ] ✅ Existing selections cleared (or preserved if available on new date)

### Test 4: Firebase Real-Time Sync
- [ ] Save release with Tech Lead + QA Lead assigned
- [ ] ✅ Success message appears
- [ ] Release shown in list with correct leads
- [ ] Refresh page (F5)
- [ ] ✅ Release STILL THERE with same leads (Firebase sync)
- [ ] Open new tab with same URL
- [ ] ✅ Release visible in new tab (real-time distributed)

### Test 5: Form Validation
- [ ] Click "+ Nowe wydanie"
- [ ] Try to save empty form
- [ ] ✅ Error shown: "Wersja jest wymagana"
- [ ] Fill only Version, try save
- [ ] ✅ Error shown: "Nazwa jest wymagana"
- [ ] Fill all required fields, try save
- [ ] ✅ Successfully saves

### Test 6: Edit Release
- [ ] Click "Edytuj" on existing release
- [ ] Modal title shows "Edytuj wydanie"
- [ ] ✅ All fields pre-populated with existing data
- [ ] ✅ Tech Lead + QA Lead show current values
- [ ] Modify Tech Lead
- [ ] ✅ Dropdown updates available options on date change
- [ ] Save changes
- [ ] ✅ Release list updates

### Test 7: Delete Release
- [ ] Click "Usuń" button
- [ ] Confirm dialog appears: "Czy na pewno usunąć to wydanie?"
- [ ] Click OK
- [ ] ✅ Release disappears from list
- [ ] ✅ Success toast: "Wydanie usunięte"

### Test 8: Export/Import
- [ ] Click "📥 Eksportuj"
- [ ] ✅ JSON file downloaded with correct name and content
- [ ] Verify JSON contains: `"techLead": "..."`, `"qaLead": "..."`
- [ ] Create test JSON file with mock releases
- [ ] Click "📤 Importuj" → Select file
- [ ] ✅ Preview shows releases
- [ ] Click "Potwierdź import"
- [ ] ✅ Releases added to list
- [ ] ✅ New releases have correct Tech Lead + QA Lead

### Test 9: Search & Filters
- [ ] Create multiple releases with different statuses/teams
- [ ] Type in search box → Filter by tech lead name
- [ ] ✅ Only matching releases shown
- [ ] Use Status filter
- [ ] ✅ Only matching status shown
- [ ] Use Team filter
- [ ] ✅ Only matching team shown
- [ ] Combine filters
- [ ] ✅ All filters work together

### Test 10: UI/UX Verification
- [ ] Dropdowns show team member names (not IDs)
- [ ] Vacation warning uses Polish text
- [ ] Toast notifications appear for success/error
- [ ] Modal closes properly on cancel
- [ ] Modal closes on outside click (click overlay)
- [ ] Form resets when creating new (not showing old data)
- [ ] Progress slider works 0-100%

---

## Console Verification

After each test section, verify console (F12):
- [ ] No red errors
- [ ] No "Uncaught" exceptions
- [ ] Firebase messages appear on save (optional)
- [ ] No network errors

---

## Performance Check

- [ ] Page loads within 3 seconds
- [ ] Dropdown population instant (< 500ms)
- [ ] No visible lag on filter changes
- [ ] Modal opens smoothly

---

## Final Sign-Off

| Criterion | Status | Notes |
|-----------|--------|-------|
| Page loads without errors | 🔄 | Test |
| Tech Lead dropdown populates | 🔄 | Test |
| QA Lead dropdown populates | 🔄 | Test |
| Vacation warning works | 🔄 | Test |
| Date change updates dropdowns | 🔄 | Test |
| Firebase saves data | 🔄 | Test |
| Real-time sync works | 🔄 | Test |
| Export/Import functional | 🔄 | Test |
| Filters work | 🔄 | Test |
| No generic "Release Lead" | ✅ | Verified |
| HTML fields present | ✅ | Verified |
| Code syntax clean | ✅ | Verified |
| Excel integration ready | ✅ | Verified |

---

## Issue Tracking

If any test FAILS:
1. Note the test name
2. Open F12 Console
3. Copy any error messages
4. Note the steps to reproduce
5. Share with development team

Example:
> **Test:** Tech Lead dropdown population  
> **Failed:** Dropdown shows empty after date select  
> **Console Error:** `Cannot read property 'map' of undefined`  
> **Steps:** Create release → Select date 2024-03-12 → Check dropdown  

---

## Success Criteria (All Must Pass)

- ✅ Page loads without JS errors
- ✅ Tech Lead dropdown populated from Excel (ALF team)
- ✅ QA Lead dropdown populated from Excel (QA team)
- ✅ Vacation conflict warning appears for unavailable leads
- ✅ Warning disappears when conflict resolved
- ✅ Date change updates dropdown options
- ✅ Firebase saves and syncs in real-time
- ✅ Export/Import works with new Tech Lead + QA Lead fields
- ✅ No generic "Lider wydania" field present
- ✅ Polish language labels correct
- ✅ No console errors

---

## After Testing

- [ ] If ALL PASS: Mark Phase 1.5 COMPLETE ✅
- [ ] If FAILURES: Document and fix
- [ ] Delete this checklist or mark as PASSED
- [ ] Celebrate! 🎉

---

**Ready to Test?** Start with TEST_PLAN.md
