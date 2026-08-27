# Release Management — Quick Reference Card

**Print this or bookmark it!**

---

## 🎯 Main Actions

| Icon | Action | How |
|------|--------|-----|
| ➕ | Create Release | Click "Nowe wydanie" → Fill form → "Zapisz" |
| ✏️ | Edit Release | Click card or "Edytuj" → Change fields → "Zapisz" |
| 🗑️ | Delete Release | Click "Usuń" → Confirm |
| 💾 | Export to Excel | Click "Eksportuj" → Download .xlsx |
| 📂 | Import from Excel | Click "Importuj" → Select file → Confirm |
| 🔍 | Search | Type in search box (version/name/lead) |
| 🎚️ | Filter Status | Select from "Status" dropdown |
| 🎚️ | Filter Team | Select from "Team" dropdown |

---

## 📝 Required Fields (To Create Release)

```
✓ Wersja (Version)    — e.g., 2.1.0
✓ Nazwa (Name)        — e.g., Q3 ALF Updates
✓ Lider (Lead)        — e.g., Kamila Molas
```

**Optional but recommended:**
- Planned Start/End dates
- Team selection
- Status (default: Planned)
- Health (default: Green)
- Blockers / Notes

---

## 🟢 Status Options

| Status | Color | Meaning |
|--------|-------|---------|
| 📋 Zaplanowane (Planned) | Gray | Release scheduled, not started |
| 🔄 W trakcie (In Progress) | Blue | Release actively being worked on |
| 🧪 Testowanie (Testing) | Purple | In QA/testing phase |
| ✅ Ukończone (Completed) | Green | Successfully deployed |
| 🚫 Zablokowane (Blocked) | Red | Waiting on external dependency |
| ❌ Nieudane (Failed) | Dark Red | Failed deployment/release |

---

## 💚 Health Indicators

| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | Green | On track, no issues |
| 🟡 | Amber | Minor issues, monitoring |
| 🔴 | Red | Critical issues, intervention needed |

---

## 👥 Teams (Choose All That Apply)

```
🔷 ALF              — Asset Lease Financing
🔷 WAREX            — Warranty & Exchange
🔷 OPTIMUS          — Main Platform
🔷 MASH             — Marketing & Sales Hub
🔷 MAGENTO          — E-Commerce
🔷 QA               — Quality Assurance
🔷 IT DELIVERY      — Operations
```

---

## 💻 Keyboard Shortcuts

```
Ctrl + Enter    Save release (in edit modal)
Esc             Close modal
```

---

## 📊 Typical Release Workflow

```
Day 1:  Create release version 2.1.0 (Status: Planned)
        ↓
Day 2:  Set Status: In Progress (0% → 25%)
        ↓
Day 3:  Update Status: In Progress (25% → 50%)
        ↓
Day 4:  Update Status: Testing (50% → 75%)
        ↓
Day 5:  Update Status: Completed (75% → 100%)
        ↓
After:  Keep for audit trail, archive if old
```

---

## 📋 Excel Export/Import Format

### Export Columns
```
Wersja | Nazwa | Status | Zdrowie | Lider | Zespoły | 
Start | Koniec | Postęp % | Blokery | Notatki
```

### Import Template
Download exported release → Use as template → Fill in → Upload

---

## 🔗 Firebase Cloud Connection

✅ **Real-time sync enabled**
- Create release → See on all open browsers instantly
- No "refresh" or "sync" button needed
- Changes pushed automatically

✅ **Audit logged**
- Every change recorded
- Timestamps tracked
- Change history available

---

## 🚀 Tips for Power Users

1. **Batch Workflow:** Create release with basics first, edit to add details
2. **Smart Filters:** Use Status → Team → Search (in that order)
3. **Excel Backup:** Export weekly for offline backup
4. **Fast Import:** Prepare Excel file, import all at once
5. **Real-Time Meetings:** Share app link, all see live updates
6. **Team Assignment:** Check all involved teams (not just primary)
7. **Blocker Tracking:** One per line in blockers field
8. **Date Format:** Auto-converts, use any common format

---

## ⚠️ Important Notes

- **No refresh needed** — Firebase handles updates
- **All data persisted** — Nothing lost on browser close
- **Mobile friendly** — Works on phones/tablets
- **Multi-user safe** — No conflicts between users
- **Audit trail** — Every change logged with timestamp
- **Open for MVP** — No authentication required (add before production)

---

## 🆘 Quick Fixes

| Problem | Fix |
|---------|-----|
| Releases not showing | Check filters (reset to "All" status + "All" team) |
| Changes not saving | Fill required fields (Version, Name, Lead) |
| Other user doesn't see my changes | Wait 5 seconds (Firebase sync) or refresh |
| Excel import fails | Check format matches export template |
| App won't load | Check internet (Firebase needs connection) |

---

## 📞 Need Help?

**Quick questions?** → Check README.md  
**Technical questions?** → Check RELEASES_DESIGN.md  
**How to use?** → Check README.md → How to Use section  
**What's new?** → Check IMPLEMENTATION_SUMMARY.md  

---

## 🎯 Common Scenarios

### Scenario 1: Create Hotfix Release (Emergency)

1. Version: 2.0.5 (hotfix version number)
2. Name: Critical Payment Bug Fix
3. Lead: [Your name]
4. Team: ALF, QA
5. Status: In Progress
6. Health: Red (urgent)
7. Planned dates: Today
8. Blockers: Testing in production, approval TBD
9. **Zapisz**

### Scenario 2: Quarterly Planning

1. Create v2.2.0 (next quarter)
2. Set planned dates: 2026-09-01 to 2026-09-30
3. Teams: ALF, OPTIMUS, QA
4. Status: Planned
5. Lead: [PM name]
6. Add high-level blockers (approvals, dependencies)
7. **Zapisz**
8. Share link with team for feedback

### Scenario 3: Weekly Status Update

1. Find latest release in list
2. Click to edit
3. Update Progress: [Your % of completion]
4. Update Status if moved to testing/completed
5. Add notes: What was done this week
6. Update blockers if any new
7. **Zapisz**

---

## 💡 Best Practices

✅ **DO:**
- Create releases early (at project start)
- Update progress regularly (daily or weekly)
- Include all involved teams (not just primary)
- Use descriptive blocker names
- Export quarterly for reports
- Keep leads updated to track accountability

❌ **DON'T:**
- Forget to set Lead (required for accountability)
- Leave Progress at 0% (update as you go)
- Leave Blockers empty if issues exist
- Delete releases (keep for audit trail)
- Use very similar version numbers (confusing)

---

## 📈 Success Metrics

**You'll know it's working when:**

- [ ] All active releases visible in app
- [ ] Team sees same data (real-time)
- [ ] No more Excel "pinging"
- [ ] Historical record maintained
- [ ] Export matches current state
- [ ] Filtered views reduce clutter
- [ ] All blockers tracked
- [ ] Progress visible week-to-week

---

## 🎓 Learning Path

**5 minutes:** Open app, create 1 test release  
**15 minutes:** Try all filters, search, edit  
**30 minutes:** Export to Excel, review  
**1 hour:** Import old Excel data, test sync with team  
**Done!** Ready for production use

---

## 📞 Contact

**Questions about this module?** Check README.md in releases/ folder  
**Technical details?** See RELEASES_DESIGN.md  
**Feature requests?** Document in RELEASES_MODULE_GUIDE.md  

---

**Version:** 1.0.0-beta  
**Quick Ref:** August 10, 2026  
**Status:** MVP Ready  

---

**🎉 You're ready to go! Start tracking releases now.**

Print this card or bookmark the module link:

```
📍 Local: file:///c:/Users/kamila.molas/Kirus/daily-picker/releases/index.html
📍 Online: https://bolttech-kamilamolas.github.io/alfinator/releases/
```
