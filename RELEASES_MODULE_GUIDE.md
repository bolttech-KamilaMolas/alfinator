# Release Management Module — Getting Started Guide

**Quick Start for Daily Picker + Releases**

---

## 📦 What You Have

You now have a **Release Management Module** integrated into daily-picker:

```
c:\Users\kamila.molas\Kirus\daily-picker\
├── index.html                      # Main page (with link to releases)
├── app.js                          # Daily picker logic
├── poker/                          # Planning poker module
└── releases/                       # ← NEW: Release tracker
    ├── index.html                  # Open this to use releases
    ├── releases.js                 # Real-time sync via Firebase
    ├── styles.css                  # Bolttech brand styling
    ├── README.md                   # How to use
    ├── RELEASES_DESIGN.md          # Technical design
    └── IMPLEMENTATION_SUMMARY.md   # What was built
```

---

## 🚀 Quick Start

### Option 1: Local Testing

1. **Open the app locally:**
   ```
   file:///c:\Users\kamila.molas\Kirus\daily-picker\releases\index.html
   ```

2. **Try creating a release:**
   - Click "➕ Nowe wydanie"
   - Fill in Version (e.g., "2.1.0")
   - Fill in Name (e.g., "Q3 ALF Updates")
   - Fill in Lead (e.g., "Kamila Molas")
   - Click "Zapisz"

3. **Open another browser window** and go to the same URL
   - You'll see the release appear in real-time! 🎉

### Option 2: Online (GitHub Pages)

```
https://bolttech-kamilamolas.github.io/alfinator/releases/
```

(Once deployed to GitHub)

---

## 📊 What Can You Do?

| Action | Steps | Notes |
|--------|-------|-------|
| **Create Release** | "➕ Nowe wydanie" → Fill form → "Zapisz" | Real-time sync to all users |
| **Edit Release** | Click card or "✏️ Edytuj" → Change fields → "Zapisz" | Auto-saves to Firebase |
| **Delete Release** | Click "🗑️ Usuń" → Confirm | Tracked in audit log |
| **Filter by Status** | Select from Status dropdown | All 6 statuses: planned, in-progress, testing, blocked, completed, failed |
| **Filter by Team** | Select from Team dropdown | All 7 teams: ALF, WAREX, OPTIMUS, MASH, MAGENTO, QA, IT DELIVERY |
| **Search** | Type in search box (version, name, lead) | Instant results |
| **Export to Excel** | "💾 Eksportuj" → Downloads .xlsx file | Use for meetings/reports |
| **Import from Excel** | "📂 Importuj" → Select file → "Importuj" | Batch create from old tracking |
| **Track Progress** | Drag progress slider 0-100% | Visual progress bar in list |
| **Update Status** | Dropdown on modal | Changes health indicator |
| **Assign Lead** | Type name in "Lider" field | Required field |
| **Select Teams** | Check team boxes | Multi-select all 7 teams |
| **Add Blockers** | Enter one per line in "Blokery" field | Tracked, visible in notes |

---

## 🔄 Real-Time Sync Example

### Scenario: Two users, one release

**User A (Morning):**
1. Opens releases app
2. Creates "v2.1.0 — ALF Q3 Updates"
3. Sets progress to 25%

**User B (Same time):**
1. Opens releases app
2. Instantly sees User A's new release
3. Watches progress update to 25%
4. Can click to edit

**Result:** No refresh needed, no "sync" button — Firebase handles it automatically

---

## 📁 Module Structure

### Core Files

**index.html** (550 lines)
- Main UI with all modals
- Release list, create/edit forms, import dialog
- Filters, buttons, responsive layout

**releases.js** (600 lines)
- Firebase real-time database integration
- CRUD operations (create, read, update, delete)
- Filtering, sorting, searching
- Excel import/export
- Audit logging

**styles.css** (500 lines)
- Bolttech brand colors (cyan, navy, yellow)
- Responsive design (mobile-first)
- Modal, form, card components
- Dark/light mode support

### Documentation

**README.md** — How to use the module (user guide)  
**RELEASES_DESIGN.md** — Technical design document  
**IMPLEMENTATION_SUMMARY.md** — What was built (technical summary)  

---

## 🎯 Use Cases

### Use Case 1: Track ALF Q3 Release

```
1. Create release v2.1.0 "Q3 ALF Updates"
2. Set teams: ALF, QA, IT DELIVERY
3. Set planned dates: Aug 12 - Aug 30
4. Add blockers: "Database migration", "API auth TBD"
5. Assign lead: Kamila Molas
6. Share link with team
7. Team opens same link, sees real-time updates
8. Update progress as you go: 0% → 25% → 50% → 75% → 100%
9. Set status: planned → in-progress → testing → completed
10. Export to Excel for final report
```

### Use Case 2: Migrate Old Excel Data

```
1. You have: Releases_2026_Q2.xlsx (old manual tracking)
2. Open releases app
3. Click "📂 Importuj"
4. Upload your Excel file
5. System shows: "Found 12 releases"
6. Click "Importuj"
7. All 12 releases now in Firebase
8. Team can see full history
9. No manual re-entry needed!
```

### Use Case 3: Team Meeting Prep

```
1. Filter releases by status "in-progress"
2. See which releases are active right now
3. Click "💾 Eksportuj"
4. Download Excel file
5. Share in Slack/Teams before meeting
6. Meet, discuss, make updates in app
7. Export again after meeting as minutes
```

### Use Case 4: Release Dashboard

```
1. Bookmark the releases URL
2. Open in team communication channel
3. Team always has live status
4. No email updates needed
5. Real-time progress tracking
6. Everyone sees same data
```

---

## 💡 Tips & Tricks

### Keyboard Shortcuts
- **Ctrl + Enter** — Save release (when editing)
- **Esc** — Close modal

### Smart Filtering
- Start with "Status: All" to see everything
- Then filter by your team
- Then search for specific release name

### Excel Export Tips
- Export regularly as backup
- Use for offline analysis
- Share in meetings as snapshot
- Useful for year-end reports

### Fast Data Entry
1. Create with just required fields (Version, Name, Lead)
2. Click "Zapisz" to save
3. Edit again to add details (dates, blockers, notes)
4. Saves time vs. big form

### Multi-Team Coordination
- Use "Teams" filter to see your team's releases only
- But create releases with ALL involved teams checked
- Firebase syncs to all teams automatically

---

## 🔐 Important Notes

### Data Security

⚠️ **Current Status:** Firebase is open (no authentication required)

**For MVP:** This is fine for testing/internal use

**Before Production:** Add Firebase security rules:
- Example rule: Only authenticated users can read/write
- Example rule: Only release leads can delete
- Example rule: Archive operations require approval

### Data Persistence

✅ **Data is safe in Firebase** — Auto-backed up by Google  
✅ **Changes are logged** — Every create/update/delete tracked  
✅ **Real-time sync** — No data loss between users  
⚠️ **No local backup** — Regular Excel exports recommended  

### Audit Trail

All changes are tracked in `/releases_audit/`:
- Who made the change (timestamp, no user ID in MVP)
- What changed (before/after values)
- When it happened (ISO 8601 timestamp)

---

## 🆘 Troubleshooting

### Problem: App won't load
**Solution:** 
1. Check browser console (F12 → Console)
2. Look for error messages
3. Try refreshing page
4. Check internet connection (Firebase needs it)

### Problem: Releases not showing
**Solution:**
1. Check filters (might be filtering out all results)
2. Try "Status: All" + "Team: All"
3. Clear search box
4. Refresh page

### Problem: Changes not syncing to other users
**Solution:**
1. Firebase syncs automatically (few seconds lag)
2. Refresh other browser if needed
3. Check Firebase status: console.firebase.google.com
4. Might be network delay, wait 10 seconds

### Problem: Excel import not working
**Solution:**
1. Check Excel format (columns: Wersja, Nazwa, Status, etc.)
2. Try downloading exported release as template
3. Ensure file is .xlsx or .xls
4. Check browser console for detailed error

### Problem: Can't delete a release
**Solution:**
1. Need to confirm deletion (click "🗑️ Usuń" → confirm popup)
2. Check Firebase permissions (should have write access)
3. Try refreshing and deleting again

---

## 📞 Getting Help

| Question | Where to Look |
|----------|---------------|
| How do I create a release? | README.md → Creating a Release |
| What fields are required? | README.md → Data Model |
| How does Firebase work? | RELEASES_DESIGN.md → Firebase |
| What was implemented? | IMPLEMENTATION_SUMMARY.md |
| Technical questions? | RELEASES_DESIGN.md (full design) |

---

## 🔗 Related Resources

**Daily Picker App:**
- Main page: `c:\Users\kamila.molas\Kirus\daily-picker\index.html`
- Readme: `c:\Users\kamila.molas\Kirus\daily-picker\README.md`

**Poker Module:**
- `c:\Users\kamila.molas\Kirus\daily-picker\poker\index.html`

**Admin Panel:**
- `c:\Users\kamila.molas\Kirus\daily-picker\admin-history.html`

**Repository:**
- GitHub: https://github.com/bolttech-kamilamolas/alfinator
- Hosting: GitHub Pages (daily-picker branch)

---

## ✅ Checklist: First Time Setup

- [ ] Opened releases/index.html locally
- [ ] Created first test release
- [ ] Saw it appear in list
- [ ] Edited release (changed something)
- [ ] Saw changes save automatically
- [ ] Tried filtering (by status or team)
- [ ] Tried searching (typed version name)
- [ ] Exported to Excel
- [ ] Opened in Excel and viewed data
- [ ] Read README.md for more details

**Congratulations!** You're ready to use Release Management 🎉

---

## 🎓 Next Steps

### Short Term (This Week)
1. Create releases for current projects
2. Invite team to access app
3. Gather feedback on usability
4. Export one release to Excel format

### Medium Term (Next 2 Weeks)
1. Migrate old Excel data via import
2. Create releases for next quarter
3. Test real-time sync with team
4. Document any issues found

### Long Term (Next Month)
1. Plan Phase 2 features (features/risks/deployment)
2. Collect feature requests from team
3. Plan Phase 2 implementation
4. Add Firebase security rules for production

---

## 📋 Phase 2 Roadmap

**Coming Soon:**

🔄 Features management (add/track completion)  
🔄 Risk tracking (identify/assess/mitigate)  
🔄 Deployment tracking (dev/staging/prod)  
🔄 Gantt timeline view  
🔄 Release cloning & bulk operations  
🔄 Notifications & alerts  

**Sign up for updates:** Check back in 2 weeks!

---

**Quick Links:**

| Link | Purpose |
|------|---------|
| [Local App](file:///c:\Users\kamila.molas\Kirus\daily-picker\releases\index.html) | Open locally |
| [GitHub (when deployed)](https://bolttech-kamilamolas.github.io/alfinator/releases/) | Production URL |
| [User Guide](./releases/README.md) | How to use |
| [Technical Design](./releases/RELEASES_DESIGN.md) | Design details |
| [Implementation Summary](./releases/IMPLEMENTATION_SUMMARY.md) | What was built |

---

**Version:** 1.0.0-beta  
**Status:** Ready for MVP Testing  
**Date:** August 10, 2026  
**Questions?** Check the README.md in releases/ folder

Enjoy tracking your releases! 📦✨
