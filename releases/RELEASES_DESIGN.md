# Release Management Module — Design Document

**Date:** August 10, 2026  
**Module:** `releases/` (new)  
**Purpose:** Track software releases, replacing manual Excel spreadsheet  
**Pattern:** Follow existing `poker/` module structure (index.html + js + css)

---

## 📊 Data Model

### Release Object Structure

```javascript
{
    id: string,                          // UUID: "rel-2026-08-10-001"
    version: string,                     // Semantic versioning: "2.1.0"
    name: string,                        // Release name: "Q3 ALF Updates"
    description: string,                 // Detailed description (optional)
    
    // Timeline
    plannedStart: string,                // ISO 8601: "2026-08-12"
    plannedEnd: string,                  // ISO 8601: "2026-08-30"
    actualStart: string,                 // ISO 8601 or null
    actualEnd: string,                   // ISO 8601 or null
    
    // Status & Health
    status: string,                      // 'planned', 'in-progress', 'testing', 'blocked', 'completed', 'failed', 'cancelled'
    health: string,                      // 'green', 'amber', 'red'
    progress: number,                    // 0-100 (%)
    
    // Teams & Ownership
    lead: string,                        // Release lead: "Kamila Molas"
    teams: [string],                     // Involved teams: ['ALF', 'QA', 'IT DELIVERY']
    assignees: [string],                 // Array of team members working on this
    
    // Features & Content
    features: [                          // Bundled features/fixes
        {
            id: string,                  // "feat-001"
            title: string,               // "Payment gateway integration"
            description: string,
            status: string,              // 'planned', 'in-progress', 'completed', 'blocked', 'removed'
            priority: number,            // 1-5 (1=highest)
            assignee: string,            // Owner
            dueDate: string,             // ISO 8601
            completed: boolean,
            completedDate: string        // ISO 8601
        }
    ],
    
    // Tracking
    risks: [                             // Identified risks
        {
            id: string,
            description: string,
            severity: string,            // 'low', 'medium', 'high', 'critical'
            mitigation: string,
            status: string               // 'open', 'mitigated', 'realized'
        }
    ],
    
    blockers: [string],                  // Array of blocker descriptions
    testingStatus: string,               // 'not-started', 'in-progress', 'blocked', 'passed', 'failed'
    deploymentStatus: string,            // 'not-started', 'in-progress', 'rolled-back', 'success'
    
    // Environment
    environments: {                      // Release status per environment
        dev: { status: string, date: string, notes: string },
        staging: { status: string, date: string, notes: string },
        production: { status: string, date: string, notes: string }
    },
    
    // Meta
    tags: [string],                      // ['hotfix', 'backend', 'ui', 'mobile']
    notes: [                             // Historical notes
        {
            author: string,
            date: string,                // ISO 8601
            text: string
        }
    ],
    
    // Audit
    createdBy: string,
    createdAt: string,                   // ISO 8601
    updatedBy: string,
    updatedAt: string,                   // ISO 8601
    
    // Firebase
    lastSyncedAt: string,                // Timestamp of last Firebase sync
    isArchived: boolean                  // Soft delete flag
}
```

---

## 🗂️ File Structure

```
releases/
├── index.html               # Main UI (list/detail views)
├── releases.js              # Business logic & Firebase integration
├── styles.css               # Styling (inherit bolttech theme)
├── detail.html              # Release detail/edit page (optional modal instead)
├── export.html              # Excel export/import page (optional)
└── README.md                # Module documentation
```

---

## 🖼️ UI Components

### 1. Release List View (Primary)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Filter: [Status▼] [Team▼] [Month▼] [Search: ____] │
│  New Release [+] | Export [↓] | Import [↑]         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ v2.1.0 — Q3 ALF Updates     [Health:green] │   │
│  │ Status: In Progress (75%)                   │   │
│  │ Planned: 2026-08-12 → 2026-08-30           │   │
│  │ Teams: ALF, QA | Lead: Kamila Molas        │   │
│  │ Features: 8 | Blockers: 0 | Risks: 2       │   │
│  │                                  [Edit][+]  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ v2.0.5 — Hotfix Deployment     [Health:red]│   │
│  │ Status: Blocked (0%)                        │   │
│  │ Planned: 2026-08-10 → 2026-08-10           │   │
│  │ Teams: ALF | Lead: Adrian Słabicki         │   │
│  │ Features: 3 | Blockers: 1 | Risks: 1       │   │
│  │                                  [Edit][+]  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Cards show:**
- Version + name + health indicator
- Status bar (green/amber/red)
- Timeline (Gantt-style date range)
- Teams & lead
- Quick stats (features/blockers/risks)
- Action buttons (edit, expand details, duplicate, archive)

### 2. Release Detail View (Modal or Page)

**Sections:**
1. **Release Header**
   - Version | Name | Description
   - Status selector | Health selector | Progress slider
   - Timeline (start/end dates, actual dates)

2. **Team & Ownership**
   - Lead dropdown
   - Teams multi-select
   - Assignees (checkboxes)

3. **Features Tab**
   - Table: Title | Status | Priority | Assignee | Due Date | %
   - Actions: Add feature | Edit | Remove | Duplicate

4. **Risks Tab**
   - Table: Description | Severity | Mitigation | Status
   - Actions: Add risk | Mark mitigated | Close risk

5. **Environments Tab**
   - Dev | Staging | Prod
   - Each: Deploy status | Date deployed | Notes field

6. **Blockers & Notes**
   - Free-text blockers list
   - Notes with author/date/time

### 3. Filters & Views

**Top Filters:**
- Status: All, Planned, In Progress, Testing, Completed, Blocked, Failed
- Team: Multi-select (ALF, WAREX, OPTIMUS, MASH, MAGENTO, QA, IT DELIVERY)
- Month: Previous / Current / Next
- Search: By version, name, lead, assignee

**Sort options:**
- By date (planned start, planned end, actual end)
- By priority (health: red → amber → green)
- By status (planned → in-progress → testing → completed)
- By team

**View modes:**
- List (default)
- Timeline/Gantt (horizontal)
- Status board (Kanban-style columns)

---

## 🔄 Data Persistence

### Firebase Structure

```
{
  "releases": {
    "rel-2026-08-10-001": { ...release object... },
    "rel-2026-08-10-002": { ...release object... },
    ...
  },
  "releases_audit": {
    "uuid": {
      action: 'create' | 'update' | 'delete',
      releaseId: string,
      userId: string,
      timestamp: string,
      changes: { before: object, after: object }
    }
  }
}
```

### localStorage (User Preferences)

```javascript
{
  'releases_filter_status': 'in-progress',
  'releases_filter_team': ['ALF', 'QA'],
  'releases_filter_month': 'current',
  'releases_view_mode': 'list',        // list | timeline | kanban
  'releases_sort_by': 'date_planned',  // date_planned | health | status
  'releases_last_visited': string      // ISO 8601
}
```

---

## 🎯 Core Features

### MVP (Phase 1)

✅ **Mandatory:**
1. Release list with basic info (version, name, status, dates, teams)
2. Create new release (modal form)
3. Edit release details
4. Status tracking (plan → in-progress → completed)
5. Features management (add/edit/remove/track completion)
6. Basic filters (status, team, month)
7. Firebase real-time sync (all users see same data)
8. Excel export (releases → XLSX for download)

### Phase 2 (Enhanced)

✅ **Nice to have:**
- Risks & blockers tracking
- Gantt timeline view
- Deployment tracking (dev/staging/prod)
- Notifications (release deadline approaching, blocker flagged)
- Release cloning (duplicate previous release)
- Bulk actions (mark multiple as complete)

### Phase 3 (Advanced)

✅ **Future:**
- Integration with GitHub releases
- Automated changelog generation
- Release notes editor (Markdown)
- Approval workflow
- Historical comparisons (planned vs actual)

---

## 🛠️ Technical Implementation

### Technologies

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Storage:** Firebase Realtime Database (real-time sync)
- **UI Framework:** None (custom, matching bolttech theme)
- **Export:** SheetJS (XLSX) — already used in app.js
- **Auth:** Firebase (inherit from main app if needed)

### Key Functions

```javascript
// Release CRUD
createRelease(release)
updateRelease(releaseId, updates)
deleteRelease(releaseId)  // soft delete via isArchived
getRelease(releaseId)
listReleases(filters, sort)

// Features within release
addFeature(releaseId, feature)
updateFeature(releaseId, featureId, updates)
removeFeature(releaseId, featureId)
updateFeatureStatus(releaseId, featureId, status)

// Filtering & sorting
filterReleases(status, teams, dateRange, search)
sortReleases(sortBy)

// Export/Import
exportToExcel(releases)
importFromExcel(file)  // read Excel, parse, add to Firebase

// Audit
logAuditEvent(action, releaseId, userId, changes)

// UI updates
renderReleaseList()
renderReleaseDetail(releaseId)
updateFiltersUI()
```

---

## 📋 Excel Import Format

**Source:** User uploads Excel with existing releases (from manual tracking)

**Expected columns:**
```
Version | Name | Description | Status | Health | Lead | Teams | 
Planned Start | Planned End | Actual Start | Actual End | 
Features | Blockers | Risks | Notes
```

**Processing:**
1. Read Excel file (SheetJS)
2. Parse each row → Release object
3. Validate required fields (version, name, status)
4. Batch create in Firebase
5. Show progress/results

---

## 🎨 UI Theme

**Inherit from bolttech brand:**
- Primary: Cyan (#00BAC7)
- Secondary: Navy (#170F4F)
- Accent: Yellow (#E3D900) for highlights
- Semantic: Green (#039855) = success, Red (#D92D20) = risk/blocked

**Component patterns:**
- Status badges (color-coded)
- Progress bars (health → color)
- Cards for release summary
- Tables for features/risks
- Forms for editing

---

## 📖 User Workflow

### Scenario 1: Create New Release

1. Click "New Release" button
2. Modal opens with form:
   - Version (required)
   - Name (required)
   - Description
   - Select team(s)
   - Pick lead
   - Set planned dates
3. Click "Create"
4. Redirect to detail view
5. Add features/risks/blockers
6. Save

### Scenario 2: Track Progress

1. Open release detail
2. Update progress slider
3. Mark features as "In Progress" / "Completed"
4. Add notes if needed
5. Auto-saves to Firebase

### Scenario 3: Export for Excel Meeting

1. Click "Export"
2. Select releases to include (filters)
3. Download XLSX file
4. Share in meeting / email

### Scenario 4: Import Existing Releases

1. Click "Import"
2. Select Excel file (from old tracking)
3. Preview rows
4. Click "Import All"
5. Data synced to Firebase

---

## 🔐 Permissions

**For now (MVP):** No auth checks (shared Firebase)

**Future (Phase 3):**
- Viewer: Read-only access
- Editor: Can create/edit releases
- Lead: Can approve deployments
- Admin: Can delete, export audit logs

---

## 📌 Integration Points

### With existing modules:

1. **Daily Picker** (`app.js`)
   - Releases can reference team members picked in daily standup
   - Release lead can be auto-assigned from daily pick

2. **Capacity Planner** (if integrated)
   - Releases can show capacity allocation per team
   - Check team availability during release dates

3. **Poker** (planning poker module)
   - Link releases to planning sessions
   - Story points → features in release

---

## ✅ Success Criteria

- Release data persists in Firebase
- All users see real-time updates
- Features trackable (list + completion status)
- Can export to Excel for offline review
- Can import old Excel data
- Responsive design (mobile + desktop)
- Filters work correctly
- No data loss on refresh

---

## 📚 Documentation Needed

1. **User Guide** — How to create/edit/track releases
2. **Admin Guide** — Firebase setup, export/import
3. **API Documentation** — JavaScript functions for releases module
4. **Troubleshooting** — Common issues & fixes

---

**Status:** Design Complete ✅  
**Next Step:** Implement Phase 1 (MVP)
