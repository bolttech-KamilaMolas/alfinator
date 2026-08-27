# Release Management Module

**Status:** MVP Implementation ✅  
**Version:** 1.0.0  
**Date:** August 10, 2026

---

## Overview

Release Management module is a web-based application for tracking software releases, replacing manual Excel spreadsheets. It's integrated into the daily-picker app and provides real-time synchronization via Firebase.

## Features

### MVP (Phase 1) — Implemented

✅ **Release Tracking**
- Create, edit, delete releases
- Track version, name, description
- Status tracking (planned → in-progress → testing → completed)
- Health indicators (green/amber/red)
- Progress tracking (0-100%)

✅ **Team Management**
- Assign release lead
- Select involved teams (ALF, WAREX, OPTIMUS, MASH, MAGENTO, QA, IT DELIVERY)
- Track team assignments

✅ **Timeline Tracking**
- Planned start/end dates
- Actual start/end dates (future)
- Date range visualization

✅ **Filters & Search**
- Filter by status
- Filter by team
- Full-text search (version, name, lead)
- Smart sorting

✅ **Data Management**
- Blockers tracking (free-text list)
- Notes & comments
- Real-time sync via Firebase
- Audit log (all changes tracked)

✅ **Import/Export**
- Export releases to Excel (.xlsx)
- Import releases from Excel
- Batch import from old tracking

### Phase 2 (Future)

🔄 **Features Management**
- Add/edit/remove features per release
- Track feature completion status
- Prioritize features

🔄 **Risk Management**
- Track identified risks
- Severity levels (low/medium/high/critical)
- Mitigation strategies

🔄 **Deployment Tracking**
- Environment-specific deployment status (dev/staging/prod)
- Deployment dates & notes

🔄 **Timeline/Gantt View**
- Visual timeline of all releases
- Date-based organization
- Cross-team dependencies

### Phase 3 (Advanced)

💡 **Notifications**
- Release deadline alerts
- Blocker flagged notifications
- Status change notifications

💡 **Approval Workflows**
- Release approval gates
- Sign-off tracking

💡 **Changelog Generation**
- Auto-generate release notes from features
- Markdown export

---

## URL

**Hosted on GitHub Pages:** https://bolttech-kamilamolas.github.io/alfinator/releases/

**Local:** `file:///c:\Users\kamila.molas\Kirus\daily-picker\releases/index.html`

---

## Data Model

### Release Object

```javascript
{
    id: string,                    // Auto-generated: rel-2026-08-10-001
    version: string,               // Semantic version: 2.1.0
    name: string,                  // Release name: Q3 ALF Updates
    description: string,           // Detailed description
    
    // Timeline
    plannedStart: string,          // ISO 8601 date
    plannedEnd: string,            // ISO 8601 date
    actualStart: string,           // ISO 8601 date (null if not started)
    actualEnd: string,             // ISO 8601 date (null if not completed)
    
    // Status & Progress
    status: string,                // 'planned', 'in-progress', 'testing', 'blocked', 'completed', 'failed'
    health: string,                // 'green', 'amber', 'red'
    progress: number,              // 0-100 (%)
    
    // Team & Ownership
    lead: string,                  // Release lead name
    teams: [string],               // Array of team codes
    
    // Content
    features: [object],            // Array of feature objects (Phase 2)
    risks: [object],               // Array of risk objects (Phase 2)
    blockers: [string],            // Array of blocker descriptions
    notes: string,                 // Free-text notes
    
    // Audit
    createdAt: string,             // ISO 8601 timestamp
    updatedAt: string,             // ISO 8601 timestamp
    isArchived: boolean            // Soft delete flag
}
```

---

## UI Walkthrough

### 1. Release List View (Main Page)

```
┌─ Filter Bar ──────────────────────────────────────────────┐
│ Status: [All▼] | Team: [All▼] | Search: [___] | [+] [📥] │
└───────────────────────────────────────────────────────────┘

┌─ Release Card ────────────────────────────────────────────┐
│ v2.1.0 — Q3 ALF Updates              [Health: 🟢 Green]   │
│ Status: 🔄 In Progress (75%)                              │
│ 📅 2026-08-12 → 2026-08-30                                │
│ 👤 Kamila Molas | Teams: ALF, QA | Features: 8            │
│                              [✏️ Edit] [🗑️ Delete]        │
└───────────────────────────────────────────────────────────┘

┌─ Release Card ────────────────────────────────────────────┐
│ v2.0.5 — Hotfix Deployment          [Health: 🔴 Red]     │
│ Status: 🚫 Blocked (0%)                                   │
│ ...                                                        │
└───────────────────────────────────────────────────────────┘
```

### 2. Create/Edit Modal

```
┌─ Modal: New Release ──────────────────────────────────────┐
│                                                    [×]     │
│ Version: [2.1.0]              Name: [Q3 ALF Updates]     │
│ Description: [________________________]                   │
│ Status: [In Progress▼]        Health: [Green▼]          │
│ Planned Start: [2026-08-12]   End: [2026-08-30]         │
│ Progress: [===========] 75%                              │
│ Lead: [Kamila Molas]                                     │
│ Teams: [✓] ALF [✓] QA [ ] WAREX [ ] OPTIMUS ...         │
│ Blockers: [_____________________]                        │
│ Notes: [_____________________]                           │
│                         [Cancel] [Save]                  │
└───────────────────────────────────────────────────────────┘
```

### 3. Import Modal

```
┌─ Modal: Import Releases ──────────────────────────────────┐
│                                                    [×]     │
│ Select Excel file:                                       │
│ [Choose File...] (*.xlsx, *.xls)                         │
│                                                          │
│ 📋 Found 15 releases to import                           │
│                                                          │
│                   [Cancel] [Import All]                  │
└───────────────────────────────────────────────────────────┘
```

---

## How to Use

### Creating a Release

1. Click **"➕ Nowe wydanie"** button
2. Fill in required fields:
   - **Wersja** (Version): e.g., "2.1.0"
   - **Nazwa** (Name): e.g., "Q3 ALF Updates"
   - **Lider** (Lead): e.g., "Kamila Molas"
3. Optional fields:
   - Description, status, health, dates, progress, blockers, notes
4. Select involved teams (checkboxes)
5. Click **"Zapisz"** (Save)

### Editing a Release

1. Click on a release card or **"✏️ Edytuj"** button
2. Modal opens with current data
3. Make changes
4. Click **"Zapisz"** (Save)

### Tracking Progress

1. Open release detail (click card)
2. Update **"Postęp"** (Progress) slider
3. Update **"Status"** dropdown as needed
4. Click **"Zapisz"**
5. Changes sync automatically to all users

### Filtering Releases

- **By Status**: Select from dropdown (Planned, In Progress, Testing, etc.)
- **By Team**: Select team name
- **By Search**: Type version, name, or lead name
- Filters apply instantly

### Export to Excel

1. Click **"💾 Eksportuj"** button
2. Excel file downloads with current releases
3. File format: `releases-YYYY-MM-DD.xlsx`
4. Use for meetings, reports, archival

### Import from Excel

1. Click **"📂 Importuj"** button
2. Select Excel file with releases
3. System shows count of releases to import
4. Click **"Importuj"** to batch import
5. All data syncs to Firebase

**Expected Excel format:**
```
Wersja | Nazwa | Status | Zdrowie | Lider | Zespoły | Start | Koniec | Postęp % | Blokery | Notatki
2.1.0  | Q3 ALF Updates | in-progress | green | Kamila Molas | ALF,QA | 2026-08-12 | 2026-08-30 | 75 | — | —
```

---

## Firebase Structure

### Database

```
{
  "releases": {
    "rel-2026-08-10-001": {
      id: "rel-2026-08-10-001",
      version: "2.1.0",
      name: "Q3 ALF Updates",
      ...
    },
    "rel-2026-08-10-002": { ... }
  },
  "releases_audit": {
    "uuid-1": {
      action: "create",
      releaseId: "rel-2026-08-10-001",
      timestamp: "2026-08-10T10:30:00Z",
      changes: null
    },
    "uuid-2": {
      action: "update",
      releaseId: "rel-2026-08-10-001",
      timestamp: "2026-08-10T11:45:00Z",
      changes: { progress: 75 }
    }
  }
}
```

### Access

- **Realtime sync:** All open browsers auto-update when data changes
- **Audit trail:** Every create/update/delete logged with timestamp
- **No authentication required** for MVP (use Firebase security rules in production)

---

## localStorage (User Preferences)

```javascript
{
    'releases_filter_status': 'in-progress',     // Last selected filter
    'releases_filter_team': 'ALF',               // Last selected team
    'releases_sort_by': 'date_planned',          // Sort preference
    'releases_view_mode': 'list'                 // View mode preference
}
```

---

## File Structure

```
releases/
├── index.html              # Main UI (HTML)
├── releases.js             # Business logic + Firebase
├── styles.css              # Styling (bolttech brand)
├── RELEASES_DESIGN.md      # Design document
└── README.md               # This file
```

---

## Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Firebase Realtime Database
- **Export**: SheetJS (XLSX)
- **Hosting**: GitHub Pages (via daily-picker repo)
- **Theme**: Bolttech brand (cyan #00BAC7, navy #170F4F)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + Enter | Save release (in modal) |
| Esc | Close modal |

---

## Troubleshooting

### Issue: Releases not loading
**Solution:**
1. Check browser console (F12) for errors
2. Verify Firebase connection (see Network tab)
3. Try refreshing page
4. Check Firebase console for database permissions

### Issue: Data not saving
**Solution:**
1. Verify all required fields are filled (Version, Name, Lead)
2. Check browser console for error messages
3. Ensure Firebase is accessible (no firewall blocking)

### Issue: Import fails
**Solution:**
1. Verify Excel format (columns: Wersja, Nazwa, Status, etc.)
2. Check file is .xlsx or .xls format
3. Ensure at least Version and Name columns exist
4. Try downloading an exported release as template

### Issue: Changes not syncing to other users
**Solution:**
1. All changes are real-time via Firebase
2. Refresh other browsers to see updates
3. Check Firebase console for replication lag
4. Verify network connection

---

## Future Enhancements (Phase 2+)

- [ ] Features management (add/edit/track completion)
- [ ] Risk tracking (identify, rate, mitigate)
- [ ] Gantt timeline view
- [ ] Deployment tracking (dev/staging/prod)
- [ ] Release cloning (duplicate previous)
- [ ] Notifications (deadline, blocker alerts)
- [ ] Approval workflows
- [ ] Changelog generation

---

## Integration with Daily Picker

**Current:** Release module is standalone

**Planned (Phase 2):**
- Link releases to team capacity
- Auto-assign release lead from daily standup picks
- Show release timeline in daily view
- Cross-reference sprint planning poker

---

## Support & Contact

**Questions?** Check design document: `RELEASES_DESIGN.md`

**Issues?** Check Firebase console or browser DevTools

**Need changes?** Edit `releases.js` or contact team lead

---

**Last Updated:** August 10, 2026  
**Module Status:** Production Ready (MVP)  
**Maintained by:** ALF Team
