# Planning Poker — Poradnik użytkownika

## Szybki start

1. Otwórz: https://bolttech-kamilamolas.github.io/alfinator/poker/
2. **Moderator:** Kliknij **Utwórz nowy pokój** → poczekaj na kod pokoju
3. **Gracze:** Wklej kod i kliknij **Dołącz**
4. **Wszyscy:** Klikaj karty (1, 2, 3, 5, 8, 13, 21, 34, ?) → Moderator kliknie **Odsłoń karty**
5. Historia estymaty jest zapisywana w bazie danych

## Jak działa

### Architektura

```
┌─────────────────────────────────────┐
│  GitHub Pages (frontend)            │
│  poker/index.html, poker.js         │
└──────────────┬──────────────────────┘
               │ HTTP API (2s polling)
               ▼
┌─────────────────────────────────────┐
│  Backend API (Node.js + Express)    │
│  localhost:3001                     │
│  - GET/POST  /api/poker/rooms       │
│  - GET/POST  /api/poker/rooms/:id   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Turso Database                     │
│  - poker_rooms (pokoje)             │
│  - poker_players (gracze)           │
│  - poker_estimates (estymaty)       │
│  - poker_reactions (emotikony)      │
└─────────────────────────────────────┘
```

### Zmiana z Firebase na Turso

- **Poprzednio:** Firebase Realtime Database
- **Teraz:** Turso (SQLite serverless) + HTTP API
- **Komunikacja:** Polling co 2 sekundy (zamiast real-time)
- **Magazyn:** Trwałe przechowywanie estymaty w bazie danych

## Interfejs aplikacji

### Ekran startowy

```
┌─────────────────────────────────────┐
│  Planning Poker                     │
├─────────────────────────────────────┤
│                                     │
│  Kto jesteś?                        │
│  [Moderator] [Gracz]               │
│                                     │
│  Kod pokoju (dla graczy):           │
│  [__________________]               │
│  [  Dołącz do pokoju  ]             │
│                                     │
│  [  Utwórz nowy pokój  ]            │
│                                     │
└─────────────────────────────────────┘
```

### Pokój (Moderator)

```
┌─────────────────────────────────────┐
│  Planning Poker — Pokój ABC123      │
├─────────────────────────────────────┤
│                                     │
│  📌 Kod pokoju: ABC123 [📋 Kopiuj] │
│  👥 Gracze (3):                     │
│     ✓ Piotr (zaproponował 5)       │
│     ✓ Ewa (zaproponowała 8)        │
│     ⏳ Jan (czeka...)                │
│                                     │
│  Zadanie/Issue:                     │
│  [  Dodaj numer issue  ] [ALF-123]  │
│                                     │
│  [  Odsłoń karty  ]                 │
│                                     │
│  Historia estymaty:                 │
│  - 14:30: 5 (wszyscy się zgodzili) │
│  - 14:20: dyskusja (różne karty)    │
│                                     │
└─────────────────────────────────────┘
```

### Pokój (Gracz)

```
┌─────────────────────────────────────┐
│  Planning Poker — Pokój ABC123      │
├─────────────────────────────────────┤
│                                     │
│  👥 Gracze (3):                     │
│     ✓ Piotr (głosuje...)           │
│     ✓ Ewa (głosuje...)             │
│     ✓ Ty (ty)                      │
│                                     │
│  Wybierz kartę:                     │
│  [ 1 ] [ 2 ] [ 3 ] [ 5 ]           │
│  [ 8 ] [ 13] [ 21] [ 34] [ ? ]     │
│                                     │
│  Twoja karta: 5 ✓                  │
│                                     │
│  Czekaj na odsłonięcie...           │
│                                     │
└─────────────────────────────────────┘
```

## Jak grać

### 1. Utwórz pokój (Moderator)

1. Otwórz https://bolttech-kamilamolas.github.io/alfinator/poker/
2. Kliknij **Moderator**
3. Kliknij **Utwórz nowy pokój**
4. Dostaniesz kod pokoju (np. ABC123) — wyślij go graczom

### 2. Dołącz do pokoju (Gracze)

1. Otwórz https://bolttech-kamilamolas.github.io/alfinator/poker/
2. Kliknij **Gracz**
3. Wklej kod pokoju (np. ABC123)
4. Kliknij **Dołącz**

### 3. Dodaj zadanie (Moderator)

1. Wpisz numer issue (np. ALF-123)
2. Kliknij **Dodaj numer issue**
3. Historia estymaty będzie powiązana z tym issue

### 4. Głosuj (Gracze)

1. Kliknij jedną z kart: 1, 2, 3, 5, 8, 13, 21, 34, ?
2. Karta jest ukryta do momentu odsłonięcia
3. Moderator widzi, że głos został oddany (✓)

### 5. Odsłoń karty (Moderator)

1. Kliknij **Odsłoń karty**
2. Gracze widzą karty wszystkich
3. Jeśli karty są różne — dyskusja (ponownie kliknij karty)
4. Jeśli karty są równe — estymata zapisana w bazie danych ✓

### 6. Historia estymaty

Historia wszystkich rund jest wyświetlona w dolnej części ekranu:
- **Godz.** — kiedy była estymata
- **Wartość** — ostateczna karta
- **Status** — czy wszyscy się zgodzili, czy była dyskusja

## Karty Fibonacciego

| Karta | Znaczenie |
|-------|-----------|
| **1** | Bardzo mały | Kilka minut pracy |
| **2** | Mały | ~30 minut pracy |
| **3** | Średni (mały) | ~1 godzina pracy |
| **5** | Średni | ~2-3 godziny pracy |
| **8** | Duży | ~1 dzień pracy |
| **13** | Bardzo duży | ~2-3 dni pracy |
| **21** | Ogromny | ~1 tydzień pracy |
| **34** | Za duży | Należy podzielić zadanie |
| **?** | Nie wiem | Brak wystarczających informacji |

## Interfejs ruchliwy (responsywny)

Aplikacja działa na urządzeniach mobilnych:

- **Laptop/Desktop:** Pełny widok
- **Tablet:** Karty ułożone w rzędy
- **Telefon:** Karty przewijane poziomo

## Przechowywanie danych

- **Pokoje:** Utrzymywane w bazie danych (Turso)
- **Estymaty:** Zapisywane permanentnie
- **Historia:** Dostępna dla moderatora i graczy
- **Kod pokoju:** Unikalny identyfikator (np. ABC123)

Pokoje są przechowywane, dopóki ktoś je nie usunie (moderator lub admin).

## Troubleshooting

### Nie mogę dołączyć do pokoju

**Problem:** Kod pokoju nie jest rozpoznawany.

**Przyczyny i rozwiązania:**
1. Kod pokoju jest nieprawidłowy
   - Sprawdzenie: Upewnij się, że przepisałeś kod poprawnie (wielkie litery)
   - Rozwiązanie: Poproś moderatora o ponowne wysłanie kodu

2. Backend API nie działa
   - Sprawdzenie: Otwórz konsolę (F12 → Console) i sprawdź błędy
   - Rozwiązanie: Upewnij się, że serwer jest uruchomiony na porcie 3001

3. Pokój został usunięty
   - Rozwiązanie: Poproś moderatora o utworzenie nowego pokoju

### Karty nie są odsłaniane

**Problem:** Kliknąłem kartę, ale nic się nie dzieje.

**Przyczyny i rozwiązania:**
1. Sieć jest wolna
   - Rozwiązanie: Poczekaj 2-3 sekundy (polling co 2s)

2. Backend API ma problem
   - Sprawdzenie: Otwórz konsolę (F12 → Console)
   - Rozwiązanie: Odśwież stronę (F5)

3. Moderator nie kliknął "Odsłoń karty"
   - Rozwiązanie: Czekaj na moderatora

### Historia estymaty jest pusta

**Problem:** Historia nie pokazuje poprzednich estymaty.

**Przyczyny i rozwiązania:**
1. Backend API nie zapisywał danych
   - Sprawdzenie: Sprawdzić logi backendu
   - Rozwiązanie: Spróbuj ponownie

2. Baza danych Turso jest niedostępna
   - Rozwiązanie: Sprawdź połączenie internetowe

### Czasami odsłanianie się nie synchronizuje

**Problem:** Jeden gracz widzi odsłonięte karty, inny — nie.

**Przyczyna:** Polling co 2 sekundy (zamiast real-time)

**Rozwiązanie:** 
- Poczekaj 2-3 sekundy na synchronizację
- Jeśli problem się powtarza, odśwież stronę (F5)

## Kontakt

Problemy lub pytania? Skontaktuj się z Kamilą Molas.

---

**Ostatnia aktualizacja:** sierpień 2026  
**Backend:** Turso (SQLite serverless)  
**Frontend:** GitHub Pages  
**API:** REST HTTP (2s polling)  
**Schemat:** Fibonacci
