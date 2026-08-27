# ALFinator — Poradnik użytkownika (Daily Picker)

## Szybki start

1. Otwórz: https://bolttech-kamilamolas.github.io/alfinator/
2. Widzisz listę dostępnych osób na dzisiaj
3. Kliknij **Losuj!** — aplikacja losuje osobę prowadzącą daily standup
4. Historia losowań jest wspólna dla całego zespołu (aktualizuje się co 5 sekund)

## Jak działa

### Źródło danych

Aplikacja pobiera dostępność zespołu z pliku `data/capacity.xlsx` (SharePoint, aktualizowany cotygodniowo):

- **Plik:** `Planowanie_IT_R&D*.xlsx`
- **Zakładka:** `capacity`
- **Kolumny:** NAME, SURNAME, TEAM, oraz daty (DZIEŃ1, DZIEŃ2, ...)
- **Filtrowanie:** Tylko osoby z `TEAM = "ALF"`
- **Dostępność:** wartość 1 lub 100% = dostępna, 0 lub puste = niedostępna (urlop)

Bieżący dzień jest wykrywany automatycznie na podstawie dat w nagłówkach Excela.

### Proces losowania

1. **Filtracja:** Aplikacja wczytuje osoby dostępne na dzisiaj z Excela
2. **Wykluczeni:** Następujące osoby są zawsze wyłączone z losowania:
   - Kamila Molas (lider zespołu)
   - Adrian Słabicki (inny projekt)
   - Szymon Bartnik (inny projekt)
3. **Odznaczenia:** Możesz odznaczyć kogoś ręcznie (np. jest nieobecny ad hoc)
   - Osoba skreślona **nie trafia do historii**
   - Skreślenia resetują się codziennie o północy
4. **Historia:** Historia losowań jest wspólna dla wszystkich
   - Osób, które już prowadziły daily — aplikacja wyłącza z losowania
   - Gdy wszyscy dostępni zostaną wylosowani → historia kasuje się automatycznie (nowa runda)
5. **Losowanie:** Aplikacja losuje spośród pozostałych osób

## Interfejs aplikacji

```
┌─────────────────────────────────────────────────┐
│         ALFinator — Daily Picker                │
├─────────────────────────────────────────────────┤
│                                                 │
│  📅 Dzisiaj: 14 czwartek sierpnia              │
│  👥 Dostępnych osób: 5                         │
│  📊 Już wylosowanych: 2                        │
│                                                 │
│  ☑️  Piotr Nowak          ← dostępny           │
│  ☑️  Ewa Lewandowska      ← dostępna           │
│  ☐  Jan Kowalski         ← skreślony (szary)  │
│  ☑️  Maria Dąbrowska      ← dostępna           │
│  ☑️  Marek Zieliński      ← dostępna           │
│                                                 │
│  🎲 [  LOSUJ!  ]  [  CZYSZCZENIE (ADMIN)  ]   │
│                                                 │
│  Historia losowań:                              │
│  ✓ 09:15 - Piotr Nowak       [usunąć]         │
│  ✓ 09:00 - Ewa Lewandowska   [usunąć]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Symbole

- **☑️ (zaznaczone)** — osoba dostępna, bierze udział w losowaniu
- **☐ (niezaznaczone)** — osoba skreślona (szara), NIE bierze udziału w losowaniu dzisiaj
- **✓ (żółty)** — wylosowana osoba, dodana do historii

### Akcje

| Akcja | Co się dzieje |
|-------|---------------|
| Kliknij **Losuj!** | Losuje osobę spośród dostępnych i dodaje do historii |
| Odznaczy osobę (checkbox) | Osoba skreślona (szara), nie bierze udziału w losowaniu |
| Zaznacz osobę (checkbox) | Osoba wróci do puli losowania |
| Kliknij **[usunąć]** przy osobie w historii | Usuwamy wpis z historii (administrator) |
| Wpisz `?admin` w URL | Pokaż przycisk do czyszczenia całej historii |

## Odznaczenia vs Wylosowani

### Odznaczenia (skreślenie)

- **Stan:** szara, przekreślona nazwa
- **Co się nie dzieje:** nie pojawia się w losowaniu, NIE dodawana do historii
- **Reset:** codziennie o północy wszystkie odznaczenia resetują się
- **Cel:** szybkie wyłączenie z losowania bez trwałych zmian (np. osoba jest na lunch)

### Wylosowani (historia)

- **Stan:** żółty, ze znaczkiem ✓
- **Co się dzieje:** pojawia się w historii losowań
- **Historia:** do wyczerpania puli (gdy wszyscy wylosowani → auto-clear)
- **Cel:** śledzenie, kto już prowadził daily

## Historia losowań

Historia jest wspólna dla całego zespołu. Aktualizuje się co 5 sekund.

### Auto-clear (automatyczne czyszczenie)

Historia czyści się **automatycznie**, gdy:
- Wszyscy dostępni użytkownicy (po odznaczeniach) zostali wylosowani

### Czyszczenie ręczne (administrator)

Aby uzyskać dostęp do opcji czyszczenia historii:
1. Dodaj `?admin` do URL aplikacji: `https://bolttech-kamilamolas.github.io/alfinator/?admin`
2. Pojawi się przycisk **CZYSZCZENIE (ADMIN)**
3. Kliknij, aby wyczyszczić historię

Każde czyszczenie (ręczne i automatyczne) jest logowane w dzienniku audytu.

## Panel Admina — Zarządzanie Historią

**URL:** https://bolttech-kamilamolas.github.io/alfinator/admin-history.html

Panel administracyjny oferuje pełne zarządzanie danymi:

- **📋 Pokaż historię** — tabela ze wszystkimi wpisami
- **📥 Eksportuj do JSON** — backup historii (do przechowywania)
- **♻️ Przywróć Historię** — wklej JSON i przywróć dane
- **➕ Dodaj Wpis Ręcznie** — dla zmian manualnych
- **📊 Dziennik Audytu** — przeglądanie logów (auto_clear, admin_clear, manual_add)
- **🗑️ Wyczyść Historię** — natychmiastowe usunięcie całej historii
- **⚙️ Status Bazy** — sprawdzenie połączenia z backend API

Szczegóły: [`PRZYWRACANIE_HISTORII.md`](./PRZYWRACANIE_HISTORII.md)

## Aktualizacja pliku dostępności

Plik `data/capacity.xlsx` aktualizuje się **co tydzień** z SharePoint.

### Automatycznie (skrypt Windows)

1. Pobierz plik Excel z SharePoint: https://digitalcarepl.sharepoint.com/:x:/s/RND/IQCIGRMMoA8VQrf-JLfqtMzpAUFLNubkKagObaL7WUXllHs
2. Dwuklik na `update-capacity.bat` w folderze projektu
   - Skrypt automatycznie znajdzie najnowszy `Planowanie_IT_R&D*.xlsx` w folderze Pobrane
   - Skopiuje go jako `data/capacity.xlsx`
   - Zrobi `git commit` + `git push` (jeśli plik się zmienił)
3. Aplikacja pobierze nowy plik automatycznie (dzięki autofetch z repozytorium)

### Ręcznie (bez skryptu)

```bash
cd c:\Users\kamila.molas\Kirus\daily-picker

# Skopiuj plik jako data/capacity.xlsx

git add data/capacity.xlsx
git commit -m "Update capacity"
git push
```

## Troubleshooting

### Aplikacja nie pokazuje osób

**Problem:** Lista dostępnych osób jest pusta.

**Przyczyny i rozwiązania:**
1. Plik `data/capacity.xlsx` jest uszkodzony
   - Sprawdzenie: Otwórz panel admina → **⚙️ Status Bazy**
   - Rozwiązanie: Zaktualizuj plik (zobacz sekcję "Aktualizacja pliku dostępności")

2. Zakładka "capacity" nie istnieje w pliku
   - Rozwiązanie: Upewni się, że plik pochodzi z SharePoint i ma poprawną strukturę

3. Bieżący dzień nie ma kolumny w Excelu
   - Rozwiązanie: Sprawdź format dat w nagłówkach (powinny być w formacie "14 czwartek sierpnia")

### Historia nie synchronizuje się

**Problem:** Historia nie aktualizuje się dla innych użytkowników.

**Przyczyny i rozwiązania:**
1. Backend API nie działa
   - Sprawdzenie: Panel admina → **⚙️ Status Bazy**
   - Rozwiązanie: Upewnij się, że serwer backend jest uruchomiony na porcie 3001

2. Firewall blokuje połączenie
   - Rozwiązanie: Sprawdź ustawienia zapory (port 3001 musi być dostępny)

### Nie mogę wyczyścić historii

**Problem:** Przycisk czyszczenia nie pojawia się.

**Rozwiązanie:**
1. Dodaj `?admin` do URL: `https://bolttech-kamilamolas.github.io/alfinator/?admin`
2. Kliknij przycisk **CZYSZCZENIE (ADMIN)**

Jeśli przycisk nadal nie pojawia się, upewnij się, że backend API działa (panel admina → **⚙️ Status Bazy**)

### Historia została stracona

**Problem:** Historia losowań została przypadkowo wyczyszczona.

**Rozwiązanie:**
1. Idź do panelu admina: https://bolttech-kamilamolas.github.io/alfinator/admin-history.html
2. Kliknij **♻️ Przywróć Historię**
3. Wklej ostatni znany JSON (jeśli wcześniej go zaeksprtowałeś)
4. Kliknij **Przywróć**

Jeśli nie masz kopii zapasowej, niestety dane są stracone — historię można odbudować ręcznie, klikając **➕ Dodaj Wpis Ręcznie**.

## Kontakt

Problemy lub pytania? Skontaktuj się z Kamilą Molas.

---

**Ostatnia aktualizacja:** sierpień 2026  
**Backend:** Turso (SQLite serverless)  
**Frontend:** GitHub Pages  
**API:** REST HTTP (5s polling)
