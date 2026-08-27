# Przywracanie historii — ALFinator

## Gdzie jest historia?

**GitHub Repository** — plik `data/history.json` w repo `bolttech-KamilaMolas/alfinator`

- URL pliku: https://github.com/bolttech-KamilaMolas/alfinator/blob/main/data/history.json
- API: `GET https://api.github.com/repos/bolttech-KamilaMolas/alfinator/contents/data/history.json`

### Struktura danych

```json
[
  {
    "name": "Jan Kowalski",
    "date": "czwartek, 27 sierpnia",
    "timestamp": "2026-08-27T09:15:00.000Z"
  }
]
```

## Jak działa zapis

1. Frontend dekoduje token (obfuskowany w `app.js`)
2. Czyta aktualny `data/history.json` przez GitHub Contents API
3. Dodaje nowy wpis
4. Zapisuje przez PUT (tworzy commit w repo)
5. Każde losowanie = 1 commit w historii git

## Przywracanie historii

### Opcja A: Git revert

Ponieważ każde losowanie to commit, można przywrócić historię z dowolnego momentu:

```bash
cd c:\Users\kamila.molas\Kirus\daily-picker
git log --oneline -- data/history.json
# znajdź commit sprzed czyszczenia
git checkout <sha> -- data/history.json
git commit -m "Restore history"
git push
```

### Opcja B: Ręcznie edytuj plik

1. Otwórz `data/history.json` w edytorze
2. Wklej prawidłowe wpisy (format jak wyżej)
3. Commit + push

### Opcja C: GitHub web UI

1. Otwórz https://github.com/bolttech-KamilaMolas/alfinator/blob/main/data/history.json
2. Kliknij ołówek (edit)
3. Wklej JSON
4. Commit

## Admin — czyszczenie historii

URL: `https://bolttech-kamilamolas.github.io/alfinator/?admin`

Przycisk "🔑 Wyczyść historię" — usuwa dzisiejsze wpisy z `data/history.json`.

## FAQ

### Historia zniknęła — co się stało?
Sprawdź git log dla `data/history.json` — zobaczysz kto/co ją wyczyściło (auto-clear lub admin).

### Czy mogę przywrócić historię sprzed X dni?
Tak — git przechowuje pełną historię zmian pliku. Użyj `git log` + `git checkout`.

### Dlaczego historia się wyczyściła automatycznie?
Auto-clear odpala się gdy WSZYSCY z pełnej listy zespołu zostali wylosowani (nowa runda).

---

**Ostatnia aktualizacja:** 27.08.2026
