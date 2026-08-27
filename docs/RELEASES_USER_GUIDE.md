# Releases — Poradnik użytkownika

## Szybki start

1. Otwórz: https://bolttech-kamilamolas.github.io/alfinator/releases/ (lub w aplikacji: Releases tab)
2. **Utwórz wydanie:** Kliknij **Nowe wydanie** → wpisz numer wersji (np. 1.0.0)
3. **Dodaj issue:** Powiąż estymaty z wydaniem (ALF-123, ALF-124, ...)
4. **Śledzenie:** Historia wszystkich wydań jest zapisywana w bazie danych

## Jak działa

### Architektura

```
┌─────────────────────────────────────┐
│  GitHub Pages (frontend)            │
│  releases/index.html, app.js        │
└──────────────┬──────────────────────┘
               │ HTTP API (3s polling)
               ▼
┌─────────────────────────────────────┐
│  Backend API (Node.js + Express)    │
│  localhost:3001                     │
│  - GET/POST/PUT/DELETE /api/releases│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Turso Database                     │
│  - releases (wydania)               │
│  - release_issues (powiązania)      │
│  - daily_history (estymaty)         │
└─────────────────────────────────────┘
```

### Zmiana z Firebase na Turso

- **Poprzednio:** Firebase Realtime Database
- **Teraz:** Turso (SQLite serverless) + HTTP API
- **Komunikacja:** Polling co 3 sekundy
- **Magazyn:** Trwałe przechowywanie wydań

## Interfejs aplikacji

### Ekran główny (Lista wydań)

```
┌──────────────────────────────────────┐
│  Releases                            │
├──────────────────────────────────────┤
│                                      │
│  [  + Nowe wydanie  ]                │
│                                      │
│  📦 Wydanie 1.2.0                   │
│  ├─ Status: ✅ Ukończone            │
│  ├─ Estymata: 34 points             │
│  ├─ Issue: ALF-123, ALF-124         │
│  ├─ Data: 05.08.2026                │
│  └─ [Edytuj] [Usuń]                 │
│                                      │
│  📦 Wydanie 1.1.0                   │
│  ├─ Status: ⏳ W trakcie             │
│  ├─ Estymata: 21 points             │
│  ├─ Issue: ALF-120, ALF-121, ALF-122│
│  ├─ Data: 01.08.2026                │
│  └─ [Edytuj] [Usuń]                 │
│                                      │
│  📦 Wydanie 1.0.0                   │
│  ├─ Status: 🔴 Zaplanowane         │
│  ├─ Estymata: 55 points             │
│  ├─ Issue: 8 tasks                  │
│  └─ [Edytuj] [Usuń]                 │
│                                      │
└──────────────────────────────────────┘
```

### Dialog tworzenia wydania

```
┌──────────────────────────────────────┐
│  Nowe wydanie                        │
├──────────────────────────────────────┤
│                                      │
│  Numer wersji:                       │
│  [_1.3.0____________]               │
│                                      │
│  Status:                             │
│  [Zaplanowane ▼]                    │
│  └─ Zaplanowane / W trakcie / Ukół. │
│                                      │
│  Issue (wpisz numery):               │
│  [_ALF-123, ALF-124, ALF-125_]      │
│                                      │
│  [  Utwórz  ]  [  Anuluj  ]         │
│                                      │
└──────────────────────────────────────┘
```

## Jak używać

### 1. Utwórz nowe wydanie

1. Kliknij **+ Nowe wydanie**
2. Wpisz numer wersji (np. 1.3.0)
3. Wybierz status:
   - **Zaplanowane** — przyszłe wydanie
   - **W trakcie** — aktualnie pracowany
   - **Ukończone** — już wydane
4. Wpisz numery issue (np. ALF-123, ALF-124, ALF-125)
5. Kliknij **Utwórz**

### 2. Powiąż issue z wydaniem

Issue są powiązywane automatycznie na podstawie numerów wpisanych:

- **Szukane w bazie:** Numery ALF-XXX są szukane w historii planowania pokera
- **Estymata:** Każde issue ma przypisaną wartość (1, 2, 3, 5, 8, 13, 21, 34 points)
- **Suma:** Estymata wydania = suma wszystkich issue

Przykład:
```
Wydanie 1.3.0:
- ALF-123: 5 points
- ALF-124: 8 points
- ALF-125: 13 points
────────────────
Razem: 26 points
```

### 3. Edytuj wydanie

1. Kliknij **[Edytuj]** przy wydaniu
2. Zmień numer wersji, status lub issue
3. Kliknij **Zapisz**

### 4. Usuń wydanie

1. Kliknij **[Usuń]** przy wydaniu
2. Potwierdź usunięcie
3. Wydanie zostaje usunięte z bazy danych

### 5. Śledzenie postępu

Historia wydań pokazuje:
- **Data utworzenia** — kiedy wydanie było zaplanowane
- **Status** — bieżący stan (zaplanowane, w trakcie, ukończone)
- **Estymata** — liczba story points
- **Issue** — lista powiązanych zadań

## Statusy wydań

| Status | Kolor | Ikon | Znaczenie |
|--------|-------|------|-----------|
| **Zaplanowane** | 🔴 Czerwony | 🔴 | Przyszłe wydanie, jeszcze nie zaczęte |
| **W trakcie** | ⏳ Żółty | ⏳ | Aktualnie pracowany, release imminent |
| **Ukończone** | ✅ Zielony | ✅ | Już wydane, dostępne dla użytkowników |

## Integracja z Planning Poker

Wydania są automatycznie powiązane z estymatiami z planowania pokera:

1. W Planning Poker: Dodaj estimate dla ALF-123
2. W Releases: Utwórz wydanie i dodaj ALF-123
3. Aplikacja automatycznie pobierze wartość estymaty (np. 8 points)

Jeśli issue nie ma estymaty w planowaniu → wartość 0 points (należy dodać ręcznie lub estymować ponownie).

## Przechowywanie danych

- **Wydania:** Przechowywane w tabeli `releases` (Turso)
- **Powiązania:** Tabela `release_issues` łączy wydania z issue
- **Historia:** Dostępna dla wszystkich użytkowników
- **Polling:** Dane aktualizują się co 3 sekundy

## Troubleshooting

### Nie mogę utworzyć wydania

**Problem:** Po kliknięciu "Utwórz" nic się nie dzieje.

**Przyczyny i rozwiązania:**
1. Backend API nie działa
   - Sprawdzenie: Otwórz konsolę (F12 → Console) i sprawdź błędy
   - Rozwiązanie: Upewnij się, że serwer jest uruchomiony na porcie 3001

2. Numer wersji jest nieprawidłowy
   - Sprawdzenie: Upewnij się, że format to X.Y.Z (np. 1.3.0)
   - Rozwiązanie: Popraw numer wersji

3. Baza danych Turso jest niedostępna
   - Rozwiązanie: Sprawdź połączenie internetowe

### Estymata nie jest liczona prawidłowo

**Problem:** Suma story points jest różna od oczekiwanej.

**Przyczyny i rozwiązania:**
1. Issue nie ma estymaty w planowaniu pokera
   - Sprawdzenie: Sprawdź, czy issue ma wartość w Planning Poker
   - Rozwiązanie: Dodaj estymację w Planning Poker dla tego issue

2. Numer issue jest źle wpisany
   - Sprawdzenie: Upewnij się, że numer to ALF-123 (wielkie litery)
   - Rozwiązanie: Popraw numer issue

### Wydanie zniknęło z listy

**Problem:** Wydanie, które właśnie utworzyłem, nie pojawia się na liście.

**Przyczyna:** Polling co 3 sekundy (zamiast real-time)

**Rozwiązanie:**
- Poczekaj 3-4 sekundy na synchronizację
- Jeśli problem się powtarza, odśwież stronę (F5)

### Nie mogę usunąć wydania

**Problem:** Przycisk "Usuń" nie reaguje.

**Przyczyny i rozwiązania:**
1. Backend API ma problem
   - Sprawdzenie: Otwórz konsolę (F12 → Console)
   - Rozwiązanie: Spróbuj ponownie

2. Wydanie jest powiązane z innymi danymi
   - Rozwiązanie: Najpierw usuń powiązania (issue), potem wydanie

## Best Practices

### Nazewnictwo wersji

Używaj [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (np. 1.3.0)
- **MAJOR:** Duże zmiany (破裂 zmian)
- **MINOR:** Nowe funkcje (wstecz kompatybilne)
- **PATCH:** Poprawki błędów

Przykłady:
- 1.0.0 — pierwsza wersja
- 1.1.0 — nowe funkcje dodane
- 1.1.1 — poprawka błędu
- 2.0.0 — duże zmiany (niezgodne wstecz)

### Planowanie wydań

1. Utwórz wydanie ze statusem **Zaplanowane**
2. Dodaj issue na podstawie planów zespołu
3. Zmień status na **W trakcie**, gdy prace się zaczynają
4. Zmień na **Ukończone**, gdy wydanie zostaje wdrożone

### Śledzenie postępu

Każdy dzień sprawdź:
1. Ile issue już ma estymację?
2. Ile points jeszcze do zrobienia?
3. Czy będzie na czas?

## Kontakt

Problemy lub pytania? Skontaktuj się z Kamilą Molas.

---

**Ostatnia aktualizacja:** sierpień 2026  
**Backend:** Turso (SQLite serverless)  
**Frontend:** GitHub Pages  
**API:** REST HTTP (3s polling)  
**Wersjonowanie:** Semantic Versioning (MAJOR.MINOR.PATCH)
