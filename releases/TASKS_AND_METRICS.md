# Release Management — Tasks & Metrics Enhancement

**Status:** Enhancement Plan for Phase 1.5  
**Date:** August 10, 2026  
**Purpose:** Add task-level tracking and visual metrics dashboard

---

## 📊 Overview

You want to track **status of individual tasks within each release** and display them **graphically**.

Like the legend image you showed:
- 📋 Backlog (waiting to start)
- 🔄 Ready (approved, ready to work)
- 🔷 In Progress (actively being worked)
- 📝 Review (code review/QA)
- 🧪 Testing (QA testing)
- ✅ Done (completed)
- 🚫 Blocked (waiting on something)

---

## 🎯 Data Model: Tasks Within Release

### Task Object Structure

```javascript
{
    id: "task-rel-001",              // Unique ID per release
    releaseId: "rel-2026-08-10-001", // Parent release reference
    
    // Basic Info
    title: "Database migration",
    description: "Migrate from SQL Server to PostgreSQL",
    priority: 1,                     // 1-5 (1 = highest)
    
    // Tracking
    status: "in-progress",           // backlog, ready, in-progress, review, testing, done, blocked
    blockReason: null,               // If blocked: why?
    
    // Assignment
    assignee: "Adrian Słabicki",     // Person responsible
    reviewedBy: null,                // Code reviewer
    
    // Time
    estimatedHours: 16,              // Effort estimate
    actualHours: 10,                 // Time spent so far
    dueDate: "2026-08-20",           // ISO 8601
    
    // Timestamps
    createdAt: "2026-08-10T10:00:00Z",
    startedAt: null,                 // When moved from backlog
    completedAt: null,               // When marked done
}
```

### Release Object + Tasks Aggregation

```javascript
{
    // ...existing fields...
    
    // NEW: Tasks collection
    tasks: [
        { id: "task-001", title: "DB Migration", status: "in-progress" },
        { id: "task-002", title: "API Updates", status: "review" },
        { id: "task-003", title: "Testing", status: "testing" },
        // ... more tasks
    ],
    
    // NEW: Aggregated metrics (auto-calculated)
    taskMetrics: {
        total: 10,
        byStatus: {
            backlog: 2,
            ready: 1,
            "in-progress": 3,
            review: 2,
            testing: 1,
            done: 1,
            blocked: 0
        },
        progress: {
            percent: 30,           // % done (1/10)
            daysRemaining: 8,
            estHoursRemaining: 60,
            actualHoursSoFar: 25
        }
    }
}
```

---

## 🎨 Visual Representation

### Status Legend (Like Your Image)

```
BACKLOG:        📋 (Light gray)   - Task created, not started
READY:          ✓ (Light blue)    - Approved, ready to pick
IN-PROGRESS:    🔷 (Dark blue)    - Currently being worked
REVIEW:         📝 (Purple)       - Waiting for code review
TESTING:        🧪 (Orange)       - In QA testing
DONE:           ✅ (Green)        - Completed & shipped
BLOCKED:        🚫 (Red)          - Blocked, waiting on dependency
```

### Release Card with Task Metrics

```
┌─────────────────────────────────────────────────────┐
│ v2.1.0 — Q3 ALF Updates        [Health: 🟢 Green] │
│ Status: 🔄 In Progress (75%)                        │
│ 👤 Kamila Molas | Teams: ALF, QA                    │
├─────────────────────────────────────────────────────┤
│ 📊 Task Breakdown:                                  │
│                                                     │
│ [█████░░░░░░░░░░░░░░░░░░░░░░░░] 20% ✅ 2/10 DONE  │
│                                                     │
│ Status Distribution:                                │
│ 📋 Backlog: 1  │ ✓ Ready: 1  │ 🔷 Progress: 3    │
│ 📝 Review: 2   │ 🧪 Testing: 1 │ 🚫 Blocked: 0    │
│                                                     │
│ Effort: 25h / 85h estimated (29% done)            │
│ Days remaining: 8 days (deadline 2026-08-30)      │
├─────────────────────────────────────────────────────┤
│ [Edit Release] [View Tasks] [Add Task]             │
└─────────────────────────────────────────────────────┘
```

### Tasks List View (In Release Detail Modal)

```
┌──────────────────────────────────────────────────────────┐
│ Tasks (10) | Filter: All ▼  | Sort: By Priority ▼      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [1] 🔷 Database Migration    IN-PROGRESS   8/16h  Adri  │
│     Blocked by: Payment API update                      │
│     Estimated: 2026-08-15                              │
│                                                          │
│ [2] ✓ API Updates            READY         0/12h   —   │
│     Ready to start, waiting on code review              │
│                                                          │
│ [3] 📝 Frontend Components   REVIEW        10/10h  Kat  │
│     Waiting for code review from Lead                   │
│                                                          │
│ [4] 🧪 Integration Testing    TESTING       5/20h  Tom  │
│     Found 3 bugs, fixing...                            │
│                                                          │
│ [5] ✅ Documentation          DONE          6/6h    Agn │
│     Completed 2026-08-08                                │
│                                                          │
│ [ View All 10 Tasks >]                                 │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Task Workflow

### Typical Task Lifecycle

```
1. Create Task (in Backlog)
   ↓
2. Mark as Ready (approved by lead)
   ↓
3. Start Work (move to In Progress)
   ↓
4. Submit for Review (move to Review)
   ↓
5. Code Review ✓ (passed)
   ↓
6. Move to Testing (QA team tests)
   ↓
7. Testing Complete ✓ (no bugs)
   ↓
8. Mark as Done (shipped)
```

**If blocked:**
- Any status → Blocked (indicate why)
- When unblocked → Back to previous status

---

## 📈 Metrics Dashboard

### Release Progress Visualization

**Top-level metrics on card:**
```
Release: v2.1.0 — Q3 ALF Updates
├── Task Progress: ████░░░░░░░░░░░░░░░░ 20% (2/10 done)
├── Effort: 25h / 85h spent (29%)
├── Timeline: 8 days remaining
└── Health: 🟢 Green (no blockers, on track)

Task Status Breakdown:
  📋 Backlog:      ▓  1 task
  ✓ Ready:        ▓  1 task
  🔷 In Progress: ▓▓▓ 3 tasks
  📝 Review:      ▓▓  2 tasks
  🧪 Testing:     ▓  1 task
  ✅ Done:        ▓  2 tasks
  🚫 Blocked:     —  0 tasks
```

### Burndown Chart (Future Phase 2)

```
Tasks Completed Over Time:
│
8 │           ╱╱
  │         ╱  
7 │       ╱    
  │     ╱      
6 │   ╱        
  │ ╱          
5 │─────────────── Ideal burndown
  │             ╲
4 │              ╲
  │               ╲
3 │                ╲
  │                 ╲
2 │ ●  ●  ●  ● ●    ╲
  │                   ●
1 │ ●
  │                    
0 └─────────────────────
  Week 1 Week 2 Week 3 Deadline
```

---

## 💾 Data Persistence (Firebase)

### Database Structure

```
/releases/rel-2026-08-10-001/
├── id: "rel-2026-08-10-001"
├── version: "2.1.0"
├── name: "Q3 ALF Updates"
├── status: "in-progress"
├── tasks:
│   ├── "task-001":
│   │   ├── title: "Database migration"
│   │   ├── status: "in-progress"
│   │   ├── assignee: "Adrian Słabicki"
│   │   ├── estimatedHours: 16
│   │   └── actualHours: 10
│   ├── "task-002": { ... }
│   └── ... (more tasks)
└── taskMetrics:
    ├── total: 10
    ├── byStatus: { backlog: 1, ready: 1, in-progress: 3, ... }
    └── progress: { percent: 20, daysRemaining: 8, ... }
```

---

## 🎯 Phase 1.5 Implementation Plan

### What to Add to Current Release Module

**UI Changes:**

1. **Add "Tasks" tab in Release Detail Modal**
   - Show list of tasks for release
   - Add button to create new task
   - Task cards with status, assignee, effort

2. **Task Card Component**
   - Status badge (color-coded)
   - Title + brief description
   - Assignee + due date
   - Effort: estimated vs. actual hours
   - Actions: Edit, Mark Done, Block/Unblock

3. **Task Metrics Summary on Release Card**
   - Visual progress bar (% done)
   - Status breakdown (small boxes)
   - Days remaining + effort remaining
   - Quick health check

4. **Task List Modal**
   - Full task list for release
   - Filter by status
   - Sort options (priority, due date, assignee)
   - Bulk actions (mark multiple done, reassign)

### JavaScript Changes

**New functions to add:**

```javascript
// Task CRUD
createTask(releaseId, task)           // Add task to release
updateTask(releaseId, taskId, updates) // Modify task
deleteTask(releaseId, taskId)         // Remove task
getTasksByRelease(releaseId)          // List all tasks for release

// Task Status Management
moveTaskToStatus(releaseId, taskId, newStatus) // Transition task
blockTask(releaseId, taskId, reason)  // Block task
unblockTask(releaseId, taskId)        // Unblock task
markTaskDone(releaseId, taskId)       // Complete task

// Metrics Calculation
calculateTaskMetrics(release)         // Auto-calc progress
calculateReleaseHealth(release)       // Health based on tasks
estimateRemainingWork(release)        // Days/hours left

// UI Rendering
renderTaskList(tasks)                 // Render task list
renderTaskCard(task)                  // Render single task
renderMetricsSummary(metrics)         // Render progress bar
```

---

## 📋 Task Status Definitions

| Status | Icon | Color | Meaning | Next Status |
|--------|------|-------|---------|------------|
| **Backlog** | 📋 | Gray | Created, not yet approved | Ready |
| **Ready** | ✓ | Light Blue | Approved, ready to start | In Progress |
| **In Progress** | 🔷 | Dark Blue | Currently being worked | Review |
| **Review** | 📝 | Purple | Waiting for code review | Testing or Blocked |
| **Testing** | 🧪 | Orange | In QA testing | Done or Blocked |
| **Done** | ✅ | Green | Completed & shipped | (final) |
| **Blocked** | 🚫 | Red | Waiting on dependency | (any status when unblocked) |

---

## 🔀 Example Workflow: Real Release

### Release: v2.1.0 — Q3 ALF Updates

**Monday (Day 1):**
```
Create 10 tasks:
- DB Migration (16h)
- API Updates (12h)
- Frontend Components (10h)
- Integration Testing (20h)
- Performance Testing (15h)
- Documentation (6h)
- DevOps/CI-CD (8h)
- Deployment (4h)
- Rollback Plan (2h)
- Post-Launch Monitoring (2h)

Total: 95h estimated
Status: All in BACKLOG
Progress: 0% (0/10 done)
```

**Tuesday (Day 2):**
```
Lead reviews & approves:
- DB Migration → READY
- API Updates → READY

Status: 2 READY, 8 BACKLOG
Progress: 0% (0/10 done)
```

**Wednesday (Day 3):**
```
Start work:
- DB Migration → IN-PROGRESS (Adrian)
  - 4 hours spent so far
- API Updates → READY (waiting on Adrian's DB)

Status: 1 IN-PROGRESS, 1 READY, 8 BACKLOG
Progress: 0% (0/10 done)
```

**Thursday (Day 4):**
```
DB Migration completed:
- DB Migration → DONE (8 hours actual vs 16 estimated)
  - Completed 2026-08-13

API Updates starts:
- API Updates → IN-PROGRESS (Kat)
- Frontend Components → READY (can start now)

Status: 2 IN-PROGRESS, 1 READY, 1 DONE, 6 BACKLOG
Progress: 10% (1/10 done)
Effort spent: 8h / 95h (8%)
```

**Friday (Day 5):**
```
Code review for API:
- API Updates → REVIEW (Waiting for Adrian to review)

New blocker:
- Frontend Components → BLOCKED
  - Reason: "Waiting for API endpoints to be finalized"

Status: 1 IN-PROGRESS, 1 REVIEW, 1 BLOCKED, 1 READY, 1 DONE, 5 BACKLOG
Progress: 10% (1/10 done)
Health: 🟡 AMBER (1 blocked task)
```

---

## 🎨 Color Scheme

Map to your legend from the image:

```
📋 Backlog:      #E5E7EB (Light Gray)
✓ Ready:        #93C5FD (Light Blue)
🔷 In Progress:  #3B82F6 (Dark Blue / Bolttech style)
📝 Review:       #D8B4FE (Purple)
🧪 Testing:      #FB923C (Orange)
✅ Done:        #86EFAC (Green)
🚫 Blocked:     #F87171 (Red)
```

---

## 🚀 Implementation Steps

### Step 1: Extend Data Model
- Update Release object to include `tasks` array
- Add `taskMetrics` field for aggregated stats

### Step 2: Add UI Components
- Task list modal
- Task card components
- Metrics summary display

### Step 3: Add CRUD Operations
- Create task form
- Edit task form
- Delete task confirmation

### Step 4: Add Rendering
- Render task list with status colors
- Render progress bar with breakdown
- Render metrics summary

### Step 5: Add Firebase Integration
- Save tasks to Firebase
- Real-time task list updates
- Metrics auto-calculation

---

## 📊 Sample Metrics Output

```javascript
{
    taskMetrics: {
        total: 10,
        completed: 2,
        blocked: 1,
        
        byStatus: {
            backlog: 1,
            ready: 1,
            "in-progress": 3,
            review: 2,
            testing: 1,
            done: 2,
            blocked: 1
        },
        
        progress: {
            percent: 20,              // 2 of 10 done
            completedToday: 1,        // DB Migration
            daysRemaining: 8,         // Until deadline
            estHoursRemaining: 87,    // 95h - 8h spent
            actualHoursSoFar: 8,
            efficiency: 0.5           // 8h actual / 16h est for completed
        },
        
        health: {
            status: "amber",          // 1 blocked task
            risks: ["Frontend blocked on API endpoints"],
            onTrack: true             // 20% done, 5% of time elapsed = on track
        }
    }
}
```

---

## 🔮 Future Enhancements (Phase 2+)

- ✅ Task assignments & notifications
- ✅ Burndown chart visualization
- ✅ Time tracking (actual vs estimated)
- ✅ Task dependencies ("This task blocked by...")
- ✅ Subtasks (nested tasks)
- ✅ Task templates (reusable task sets)
- ✅ Risk tracking per task
- ✅ Integration with GitHub issues/PRs

---

## 📞 Next Steps

1. **Read this document** to understand task model
2. **Decide:** Implement now (Phase 1.5) or wait for Phase 2?
3. **If implementing now:** Start with task CRUD + basic metrics
4. **If Phase 2:** Polish Phase 1, then add tasks later

---

**Status:** Design Complete for Phase 1.5  
**Effort:** ~8-10 hours to implement  
**Benefit:** Full release progress visibility with task-level tracking  
**Priority:** Medium (nice to have, but not essential for MVP)

Ready to implement? Let me know! 📊✨
