# Logika skreślenia vs wylosowania — ALFinator

## Rozróżnienie

### Skreślony (unchecked) — szary, przekreślony
- Użytkownik **ręcznie odznaczył** osobę (np. nieobecna ad hoc)
- Osoba **NIE bierze udziału** w losowaniu tego dnia
- Osoba **NIE jest dodawana** do historii
- Osoba **NIE wpływa** na auto-clear
- Skreślenie resetuje się codziennie (localStorage z datą w kluczu)

### Wylosowany (used) — żółty, ze znaczkiem ✓
- Osoba została wylosowana i **jest w historii** (`data/history.json`)
- Nie pojawia się w puli do kolejnego losowania
- Podlega auto-clear (po wyczerpaniu puli)

## Auto-clear

Historia czyści się automatycznie gdy **wszyscy z pełnej listy** (getMembersForWeek) zostali wylosowani. Skreśleni NIE liczą się jako wylosowani — więc skreślenie kogoś nie przyspiesza auto-clear.

```
Auto-clear trigger:
  allMembers = getMembersForWeek()  // wszyscy dostępni z Excela
  usedNames = historia z dzisiaj
  notYetPicked = allMembers - usedNames

  if (notYetPicked.length === 0) → auto-clear
```

## Przepływ losowania

```
┌──────────────────────────────────────────┐
│ getMembersForWeek()                      │
│ → osoby z TEAM=ALF, dostępność > 0      │
│ → minus EXCLUDED_MEMBERS                 │
├──────────────────────────────────────────┤
│ getAvailableMembers()                    │
│ → minus skreśleni (disabledMembers)      │
├──────────────────────────────────────────┤
│ getEligibleMembers()                     │
│ → minus już wylosowani (weekHistory)     │
├──────────────────────────────────────────┤
│ pickRandom() → losowanie                 │
│ → addToHistory() → zapis do GitHub API   │
│ → sprawdź auto-clear                    │
└──────────────────────────────────────────┘
```

## Przechowywanie danych

- **Historia losowań:** `data/history.json` w repo (GitHub Contents API)
- **Skreśleni:** `localStorage` (klucz: `alfinator-disabled-YYYY-MM-DD`, resetuje się codziennie)
- **Token:** obfuskowany w `app.js` (base64, runtime decode)

## Historia zmian

- **21.07.2026** - v1: Upload Excel + checkboxy
- **25.07.2026** - v2: Firebase Realtime Database
- **27.07.2026** - v3: Fix `update-capacity.bat`
- **03.08.2026** - v4: Fix parsowania dat z rokiem
- **05.08.2026** - v5: Fix logiki skreślenie vs wylosowanie
- **27.08.2026** - v6: Migracja Firebase → GitHub API (zero backendu)
