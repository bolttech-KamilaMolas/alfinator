# ALFinator — Przywracanie Historii Losowań

## Dostępne opcje

### 1. Panel Admina (Zalecane) ⭐

**URL:** https://bolttech-kamilamolas.github.io/alfinator/admin-history.html

**Funkcje:**
- 📋 Pokaż bieżącą historię
- 📥 Eksportuj historię do JSON (backup)
- ♻️ Przywróć historię z JSON-a
- ➕ Dodaj wpis ręcznie
- 📊 Pokaż audit log (co się stało)
- 🗑️ Wyczyść historię (admin tylko)

**Jak użyć:**

1. Otwórz: https://bolttech-kamilamolas.github.io/alfinator/admin-history.html
2. Kliknij **"Pokaż historię bieżącą"** — zobaczysz kto losował dzisiaj
3. Jeśli historia została wymazana:
   - Kliknij **"Eksportuj do JSON"** (jeśli masz backup z innego źródła)
   - Wklej JSON w pole tekstowe
   - Kliknij **"✅ Przywróć Historię"**
4. Strona się odświeży i historia powinna być przywrócona

---

## Gdzie jest historia?

**Firebase Realtime Database** (baza danych czasu rzeczywistego)
- Projekt: `alfinator`
- Ścieżka: `history/current/`
- URL konsoli: https://console.firebase.google.com/project/alfinator/database

### Struktura danych

```json
{
  "history": {
    "current": {
      "key1": {
        "name": "Alice",
        "date": "poniedziałek, 5 sierpnia",
        "timestamp": "2026-08-05T08:30:00Z"
      },
      "key2": {
        "name": "Bob",
        "date": "poniedziałek, 5 sierpnia",
        "timestamp": "2026-08-05T08:45:00Z"
      }
    }
  }
}
```

---

## Scenariusz: Historia została wymazana

### Co się stało?

1. Wszyscy dostępni ludzie zostali wylosowani → auto-clear
2. Albo admin przypadkowo kliknął "Wyczyść historię"
3. Albo jakiś błąd systemu

### Jak przywrócić?

#### Opcja A: Jeśli masz backup JSON

1. Otwórz panel admina: https://bolttech-kamilamolas.github.io/alfinator/admin-history.html
2. Sekcja **"♻️ Przywróć Historię"**
3. Wklej JSON:
   ```json
   {
     "key1": {
       "name": "Alice",
       "date": "poniedziałek, 5 sierpnia",
       "timestamp": "2026-08-05T08:30:00Z"
     },
     "key2": {
       "name": "Bob",
       "date": "poniedziałek, 5 sierpnia",
       "timestamp": "2026-08-05T08:45:00Z"
     }
   }
   ```
4. Kliknij **"✅ Przywróć Historię"**

#### Opcja B: Jeśli NIE masz backup

1. Otwórz panel admina
2. Sekcja **"🔄 Dodaj Wpis Ręcznie"**
3. Wpisz imię i nazwisko każdej osoby, która losowała
4. Kliknij **"➕ Dodaj do historii"**
5. Historia będzie stopniowo przywracana

#### Opcja C: Firebase Console (zaawansowane)

1. Otwórz: https://console.firebase.google.com/project/alfinator/database
2. Kliknij na `history` → `current`
3. Kliknij **"+"** aby dodać wpis ręcznie

---

## Dziennik Audytu

W panelu admina możesz zobaczyć **"📊 Dziennik Audytu"** — to pokazuje:

```
[2026-08-05 12:30:15] Akcja: auto_clear → Wszyscy wylosowani
[2026-08-05 09:15:00] Akcja: admin_clear → Historia wyczyszczona przez admina
```

Każda akcja jest logowana, możesz sprawdzić co się stało.

---

## Czy historia może być przywrócona automatycznie?

**Nie.** Firebase nie ma wbudowanego backup-u dla darmowego planu. Ale:

1. **Wersjonowanie** — Firebase przechowuje wersje przez 30 dni (backup)
2. **Audit log** — możemy zobaczyć co się działo
3. **Ręczny backup** — regularnie klikaj "Eksportuj do JSON" i zapisuj

---

## Proaktywny Backup (Rekomendacja)

Aby uniknąć utraty danych:

1. Każdego dnia o końcu dnia:
   - Otwórz panel admina
   - Kliknij **"Eksportuj do JSON"**
   - Skopiuj JSON
   - Zapisz w pliku `backup-YYYY-MM-DD.json`

2. Przechowuj kopie w:
   - Notatce OneNote / Confluence
   - Pliku na dysku
   - Email

3. W razie potrzeby — odwołaj się do backup-u

---

## Troubleshooting

### Problem: Panel admina się nie ładuje

**Rozwiązanie:**
1. Otwórz DevTools (F12)
2. Sprawdź Console tab — czy są błędy?
3. Spróbuj odśwież stronę (Ctrl+F5)
4. Sprawdź połączenie internetowe

### Problem: Nie mogę eksportować/przywrócić

**Rozwiązanie:**
1. Sprawdź czy jesteś podłączony do Internetu
2. Kliknij **"⚙️ Status Bazy"** → **"Sprawdź połączenie"**
3. Jeśli Firebase nie odpowiada — spróbuj później

### Problem: Historia nie przywraca się

**Rozwiązanie:**
1. Sprawdź JSON format — musi być prawidłowy
2. Kopii JSON i wklej w validator: https://jsonlint.com/
3. Jeśli JSON jest OK — spróbuj ponownie

---

## Polecane operacje

### Tygodniowy backup

```bash
# Każdy piątek o 17:00:
# Otwórz admin-history.html
# Kliknij "Eksportuj do JSON"
# Skopiuj JSON
# Zapisz jako: backup-W33-2026.json
```

### Po Auto-clear

Kiedy historia się wymazała (wszyscy losowali):
1. Natychmiast otwórz admin panel
2. Kliknij **"Eksportuj do JSON"** → skopiujesz puste dane (OK)
3. Ale zachowaj wersję sprzed clear-u gdzieś

### Przywrócenie po awarii

1. Otwórz Firebase Console
2. Sprawdź **audit_log** — czy event `auto_clear` lub `admin_clear`?
3. Jeśli tak — wiesz co się stało
4. Odwołaj się do ostatniego backup-u

---

## Kontakt

Jeśli historia znika regularnie lub masz problemy — sprawdź:

1. Firebase Console → Realtime Database
2. Czy dane są tam fizycznie?
3. Czy są uprawnienia dostępu?

---

## Podsumowanie

✅ **Proste przywrócenie:** Otwórz `admin-history.html` → Eksportuj/Przywróć

✅ **Wciśnięty przycisk:** Ręczne dodawanie wpisów

✅ **Bezpieczna baza:** Firebase z audit log-iem

✅ **Backup:** Codzienny export do JSON
