# ALFinator — Fix Logiki Skreślenia vs Wylosowania (05.08.2026)

## Problem

System miał błąd w logice:
- Gdy osoba była **skreślona** (unchecked), trafiała do historii jak wylosowana
- To powodowało, że skreślona osoba **blokowała** losowanie kolejnego dnia
- Historia nie była przywracana prawidłowo

## Rozwiązanie

### 1. Rozróżnienie stanów

```
┌─────────────────────────────────────────────────────────────┐
│ DOSTĘPNI (checked) - zielony, "Imię Nazwisko"               │
│  ├─ Wylosowani (w historii)  - żółty, "Imię Nazwisko ✓"     │
│  └─ Niewylosowani (eligible) - zielony, "Imię Nazwisko"     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ SKREŚLENI (unchecked) - szary, "Imię Nazwisko" (przekreślony)│
│  ├─ NIE pojawia się w losowaniu                             │
│  ├─ NIE trafia do historii                                  │
│  └─ Reset o północy                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2. Zmiany w kodzie

#### a) Zmiana struktury danych
```javascript
// BYŁO:
const usedNames = weekHistory.map(h => h.name);
available.filter(m => !usedNames.includes(m.fullName));

// JEST:
const usedNames = new Set(weekHistory.map(h => h.name));
available.filter(m => !usedNames.has(m.fullName));
```

**Powód:** `Set.has()` to O(1), `Array.includes()` to O(n). Ważne dla wydajności przy dużej historii.

#### b) Logika auto-clear

```javascript
// BYŁO:
const available = getAvailableMembers();  // dostępni (nie skreśleni)
const usedNames = weekHistory.map(h => h.name);
const remaining = available.filter(m => !usedNames.includes(m.fullName));

// JEST:
const available = getAvailableMembers();  // dostępni (nie skreśleni)
const usedNames = new Set(weekHistory.map(h => h.name));  // wylosowani
const remaining = available.filter(m => !usedNames.has(m.fullName));  // dostępni ale niewylosowani

if (remaining.length === 0 && available.length > 0) {
    // Clear history only when ALL AVAILABLE were PICKED, not disabled
    clearHistory();
}
```

**Powód:** Teraz liczą się TYLKO wylosowani. Skreśleni nie wpływają na auto-clear.

#### c) Obsługa skreśleń

```javascript
function loadDisabledMembers() {
    try {
        // Wyczyść stare wpisy z poprzednich dni
        for (let i = localStorage.length - 1; i >= 0; i--) {  // ← reverse iteration
            const key = localStorage.key(i);
            if (key && key.startsWith('alfinator-disabled-') && key !== getDisabledKey()) {
                localStorage.removeItem(key);
            }
        }
        const stored = localStorage.getItem(getDisabledKey());
        disabledMembers = stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        disabledMembers = new Set();
    }
}
```

**Powód:** Iteracja w odwrotnym kierunku unika problemów przy usuwaniu elementów z tablicy.

#### d) Watcher zmian dnia

```javascript
function startDayChangeWatcher() {
    let lastKey = getDisabledKey();
    setInterval(() => {
        const currentKey = getDisabledKey();
        if (currentKey !== lastKey) {
            lastKey = currentKey;
            loadDisabledMembers();  // Reset skreśleń
            renderMembers();
        }
    }, 60000); // Check every minute
}
```

**Powód:** O północy automatycznie resetuje się lista skreślonych. Sprawdzane co minutę, nie dokładnie o północy (bo JS nie ma gwarantowanego timera).

### 3. Wizualizacja

```css
.member-toggle {
    /* Dostępny, niewylosowany */
    border: 1.5px solid var(--success);      /* Zielony */
    background: var(--success-light);
    color: var(--success);
}

.member-toggle.used {
    /* Dostępny, WYLOSOWANY */
    border-color: var(--yellow-60);          /* Żółty */
    background: var(--yellow-20);
    color: var(--gray-600);
    /* Dodany znaczek ✓ */
}

.member-toggle.unchecked {
    /* Skreślony dzisiaj */
    border-color: var(--gray-200);           /* Szary */
    background: var(--gray-50);
    color: var(--gray-600);
    text-decoration: line-through;           /* Przekreślony */
    opacity: 0.6;                            /* Bardziej przezroczysty */
}
```

## Scenariusze testowe

### Scenariusz 1: Skreślenie osoby

1. Rano: Alice, Bob, Charlie dostępni
2. User klika checkbox Alice (skreśla)
3. **Alice NIE pojawia się w losowaniu**
4. User losuje → Bob wylosowany
5. **Historia:** [Bob]
6. User losuje → Charlie wylosowany
7. **Historia:** [Bob, Charlie]
8. O północy: Alice checkbox wraca ✓

### Scenariusz 2: Przywrócenie po odznaczeniu

1. Rano: Alice, Bob dostępni
2. User skreśla Alice
3. User losuje → Bob wylosowany
4. User odkrywa Alice (zmienia zdanie)
5. User losuje → **Alice może być wylosowana** (bo ma dostępność i nie ma w historii)

### Scenariusz 3: Auto-clear

1. Rano: Alice, Bob, Charlie dostępni
2. User skreśla Alice
3. User losuje → Bob
4. User losuje → Charlie
5. **Historia:** [Bob, Charlie] (2 z 2 dostępnych wylosowani)
6. **Auto-clear trigger:** `remaining.length === 0 && available.length > 0`
   - `available.length = 2` (Alice jest dostępna, tylko skreślona)
   - `remaining.length = 0` (wszyscy dostępni wylosowani)
7. **CLEAR HISTORY** → Alice checkbox wraca, zacyna się od nowa

## Architektura po zmianach

```
┌──────────────────────────────────────────┐
│ RENDER MEMBERS                           │
├──────────────────────────────────────────┤
│ for each member in teamData:             │
│   - isUsed = is in weekHistory?          │
│   - isDisabled = is in disabledMembers?  │
│                                          │
│   CSS class:                             │
│   - if isDisabled → .unchecked (szary)   │
│   - else if isUsed → .used (żółty)       │
│   - else → default (zielony)             │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ GET ELIGIBLE MEMBERS                     │
├──────────────────────────────────────────┤
│ available = getAvailableMembers()        │
│   (exclude disabledMembers)              │
│                                          │
│ return available.filter(m =>             │
│   !usedNames.has(m.fullName)             │
│ )                                        │
│                                          │
│ WAŻNE: usedNames = Set (nie Array)       │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ DO PICK                                  │
├──────────────────────────────────────────┤
│ 1. Pick random from eligible             │
│ 2. ADD TO HISTORY (Firebase)             │
│                                          │
│ 3. Check auto-clear:                     │
│    - available = non-disabled            │
│    - remaining = available & not picked  │
│                                          │
│    if remaining.length === 0:            │
│      CLEAR HISTORY                       │
│      RESET disabledMembers               │
└──────────────────────────────────────────┘
```

## Odzyskiwanie historii

Jeśli historia zostanie wymazana przypadkowo:

```javascript
// Firebase Console:
// https://console.firebase.google.com/project/alfinator/database
// Ścieżka: history/current
// Można przywrócić z wersji wcześniejszej (30 dni)
```

## Wdrożenie

1. Zmień plik `app.js` (wszystkie logiki wyżej)
2. Zmień `styles.css` (dodaj `.unchecked { opacity: 0.6; }`)
3. Commit: `git commit -m "Fix: Rozróżnienie skreślenia od wylosowania"`
4. Push: `git push`
5. GitHub Pages auto-deploy (może potrwać ~2 min)

## Testy w przeglądarce

1. Otwórz DevTools (F12)
2. Console:
   ```javascript
   // Check disabledMembers state
   console.log('Disabled:', disabledMembers);
   
   // Check eligible
   console.log('Eligible:', getEligibleMembers());
   
   // Check history
   console.log('History:', weekHistory);
   ```

## Timeline zmian

- **21.07.2026** - v1: Upload Excel + checkboxy do odznaczania
- **25.07.2026** - v2: Firebase Realtime Database
- **27.07.2026** - v3: Fix `update-capacity.bat` dla `&`
- **03.08.2026** - v4: Fix parsowania dat z rokiem
- **05.08.2026** - v5: Fix skreślenia vs wylosowania ← **TU JESTEŚMY**
