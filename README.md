# ALFinator — Daily Standup Picker

Aplikacja do losowania osoby prowadzącej daily standup w zespole ALF.

## URL

**https://bolttech-kamilamolas.github.io/alfinator/**

## Jak działa

1. Apka automatycznie pobiera plik Excel (`data/capacity.xlsx`) z repozytorium GitHub
2. Parsuje zakładkę "capacity" — filtruje zespół ALF, odczytuje dostępność per dzień
3. Użytkownik widzi listę dostępnych osób (na podstawie bieżącego dnia)
4. Może odznaczyć nieobecnych (lokalne, resetuje się codziennie)
5. Klika "Losuj!" — losuje osobę spośród dostępnych, które jeszcze nie prowadziły
6. Historia losowań jest wspólna dla wszystkich (GitHub API → `data/history.json`)
7. Gdy wszyscy z zespołu zostaną wylosowani — historia kasuje się automatycznie (nowa runda)

## Architektura

```
┌──────────────────────────────────────────────────────────┐
│  GitHub Pages (hosting)                                  │
│  bolttech-kamilamolas.github.io/alfinator/               │
│                                                          │
│  index.html / styles.css / app.js                        │
│  data/capacity.xlsx    (dane zespołu)                    │
│  data/history.json     (historia losowań)                │
└──────────────┬───────────────────────────────────────────┘
               │
               │ GitHub Contents API (REST)
               │ Read: publiczny dostęp
               │ Write: Personal Access Token (localStorage)
               ▼
┌──────────────────────────────────────────────────────────┐
│  GitHub Repository (storage)                             │
│  bolttech-KamilaMolas/alfinator                          │
│                                                          │
│  data/history.json — wspólna historia losowań            │
│  (aktualizowana przez frontend via GitHub API)           │
└──────────────────────────────────────────────────────────┘
```

**Zero backendu** — frontend komunikuje się bezpośrednio z GitHub API.

## Tech stack

- **Frontend:** HTML/CSS/JS — statyczna strona na GitHub Pages
- **SheetJS (xlsx)** — parsowanie plików Excel w przeglądarce
- **GitHub Contents API** — odczyt/zapis historii losowań (`data/history.json`)
- **GitHub Pages** — hosting
- **Kolorystyka** — bolttech (cyan #00BAC7, navy #170F4F, yellow #E3D900)

## Wykluczeni z losowania

W pliku `app.js`, stała `EXCLUDED_MEMBERS`:
- Kamila Molas (lider)
- Adrian Słabicki (inny projekt)
- Szymon Bartnik (inny projekt)
- Mikołaj Banaszkiewicz

Aby dodać/usunąć — edytuj tablicę, commit, push.

## Aktualizacja pliku capacity (cotygodniowo)

### Sposób 1: Skrypt (najłatwiej)
1. Pobierz plik Excel z SharePoint
2. Dwuklik na `update-capacity.bat`
   - Skrypt znajdzie najnowszy `Planowanie_IT_R&D*.xlsx` w folderze Pobrane
   - Skopiuje go jako `data/capacity.xlsx`
   - Zrobi git commit + push (jeśli plik się zmienił)
   - Jeśli plik nie uległ zmianie — pomija commit

> **Uwaga:** Skrypt obsługuje znak `&` w nazwie pliku (R&D) dzięki `EnableDelayedExpansion`.

### Sposób 2: Ręcznie
```bash
cd c:\Users\kamila.molas\Kirus\daily-picker
# skopiuj plik do data/capacity.xlsx
git add data/capacity.xlsx
git commit -m "Update capacity"
git push
```

## Źródło danych

SharePoint: https://digitalcarepl.sharepoint.com/:x:/s/RND/IQCIGRMMoA8VQrf-JLfqtMzpAUFLNubkKagObaL7WUXllHs

Zakładka: `capacity`

Struktura: NAME | SURNAME | FULL NAME | SKILLSET | TEAM | DATE | dzień1 | dzień2 | ...

- TEAM = "ALF" → brane pod uwagę
- Wartość 1 / 0.85 (lub 100% / 85%) = dostępna
- Wartość 0 / puste = niedostępna (urlop)

## Logika losowania

1. Apka wykrywa bieżący dzień na podstawie dat w nagłówkach Excela (dzienne kolumny z pełną datą, np. "3 sie 2026")
2. Filtruje osoby z TEAM=ALF i dostępnością > 0% w tym dniu
3. Usuwa osoby z `EXCLUDED_MEMBERS`
4. Użytkownik może odznaczyć kogoś ręcznie (nieobecny ad hoc) — **osoba skreślona nie trafia do historii**
5. Z puli dostępnych usuwa tych, którzy już prowadzili (historia z `data/history.json`)
6. Losuje spośród pozostałych
7. Po wyczerpaniu **wszystkich z pełnej listy** (nie tylko zaznaczonych) — auto-reset historii

### Rozróżnienie: skreślony vs wylosowany

- **Skreślony (unchecked)** = szary, przekreślony, resetuje się co dzień
  - Nie pojawia się w losowaniu
  - NIE dodawany do historii
  - NIE wpływa na auto-clear
  
- **Wylosowany (used)** = żółty, ze znaczkiem ✓
  - Pojawia się w historii
  - Podlega auto-clear
  - Przy kolejnym wylosowaniu nie pojawia się w puli (aż do auto-clear)

## Token GitHub

Token do zapisu historii jest obfuskowany w `app.js` (base64, runtime decode). Nie wymaga żadnej konfiguracji od użytkowników — działa od razu.

Jeśli token wygaśnie lub zostanie zrevokowany:
1. Stwórz nowy na https://github.com/settings/personal-access-tokens/new
   - Repository: `alfinator`, Permissions: Contents Read/Write
2. Zakoduj: `btoa('nowy_token')` w konsoli przeglądarki
3. Rozbij na kawałki i wstaw w `app.js` w linii `GITHUB_TOKEN`
4. Commit + push

## Admin

Przycisk "Wyczyść historię" jest dostępny pod URL z parametrem `?admin`:

```
https://bolttech-kamilamolas.github.io/alfinator/?admin
```

Czyszczenie usuwa wszystkie dzisiejsze wpisy z `data/history.json`.

## Struktura plików

```
daily-picker/
├── index.html              # Strona główna
├── styles.css              # Style (bolttech colors)
├── app.js                  # Cała logika (GitHub API, token obfuskowany)
├── alf.png                 # Logo ALFa
├── update-capacity.bat     # Skrypt do aktualizacji danych
├── LOGIKA_FIX.md           # Dokumentacja logiki skreślenie vs wylosowanie
├── PRZYWRACANIE_HISTORII.md # Jak przywrócić historię
├── data/
│   ├── capacity.xlsx       # Plik z dostępnością (aktualizowany co tydzień)
│   └── history.json        # Historia losowań (aktualizowana przez GitHub API)
├── poker/                  # Planning poker (osobny moduł)
│   ├── index.html
│   ├── poker.js
│   └── styles.css
└── releases/               # Release management (osobny moduł)
    └── index.html
```

## Historia projektu

1. Stworzenie apki z uploadem pliku Excel (21.07.2026)
2. Dodanie wykluczonych (Kamila, Adrian, Szymon)
3. Deploy na GitHub Pages
4. Rebranding na ALFinator + ikonka ALFa
5. Auto-fetch Excela z repo (zero uploadu dla userów)
6. Checkboxy do odznaczania nieobecnych
7. Usunięcie selektora tygodnia (auto-detect dziś)
8. Firebase Realtime Database — wspólna historia dla wszystkich
9. Logika: odznaczenia resetują się codziennie, historia do wyczerpania puli
10. Zmiana nazwy repo na `alfinator`
11. Usunięcie ręcznego czyszczenia historii dla użytkowników — tylko auto-clear + admin
12. Audit log w Firebase — logowanie zdarzeń
13. Fix `update-capacity.bat` — obsługa `&` w nazwie pliku R&D (27.07.2026)
14. Fix parsowania dat — etykiety kolumn zawierają rok (03.08.2026)
15. Fix: Rozróżnienie logiki skreślenia vs wylosowania (05.08.2026)
16. Panel admina do zarządzania historią (05.08.2026)
17. **MIGRACJA: Firebase → GitHub API (27.08.2026)**
    - Usunięcie Firebase SDK
    - Historia przechowywana w `data/history.json` via GitHub Contents API
    - Token w localStorage (nie w kodzie)
    - Zero backendu — w pełni statyczna aplikacja
    - Polling co 30s (limity GitHub API)
    - Auto-clear: tylko gdy cały zespół wylosowany
