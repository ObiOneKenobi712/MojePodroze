# Przypadki testowe testów manualnych

Przypadki testowe do wykonania ręcznie w przeglądarce. Na ich podstawie powstają testy
automatyczne E2E w `tests/e2e/`.

Źródło wymagań: `docs/wymagania/opis-aplikacji-i-funkcjonalnosci.md`, sekcja 2 „Funkcjonalności
(zakres podstawowy)”.

## Pliki

| Plik | Wymaganie | Obszar |
|---|---|---|
| [01-logowanie-i-rejestracja.md](01-logowanie-i-rejestracja.md) | 2.1 | rejestracja, logowanie, wylogowanie |
| [02-ekran-glowny.md](02-ekran-glowny.md) | 2.2 | lista podróży w grupach, pogoda, kursy NBP |
| [03-podroz.md](03-podroz.md) | 2.3 | tworzenie, edycja, usuwanie, typ, charakter, statusy, archiwum |
| [04-sekcje-podrozy.md](04-sekcje-podrozy.md) | 2.4 | plan dnia, loty, transport, posiłki, noclegi i atrakcje, wydatki inne |
| [05-chce-odwiedzic-i-budzet.md](05-chce-odwiedzic-i-budzet.md) | 2.5 | lista „Chcę odwiedzić”, planowany budżet |
| [06-pamietnik-i-album.md](06-pamietnik-i-album.md) | 2.6 | wpisy pamiętnika, zdjęcia, album |
| [07-kosztorys-i-oceny.md](07-kosztorys-i-oceny.md) | 2.7 | sumy, budżet, oceny, widok archiwalny |
| [08-rekomendacje.md](08-rekomendacje.md) | 2.8 | rekomendacje z wcześniejszych podróży |

## Zasady

* **ID przypadku testowego:** `TC-<nr>`, numeracja wspólna dla wszystkich plików (`TC-01`,
  `TC-02`…). ID się nie zmienia, nawet gdy przypadek testowy zostanie usunięty – nowy przypadek
  testowy dostaje kolejny wolny numer.
* **Automat:**
  * ✅ **Tak** – dla przypadku testowego istnieje test E2E w `tests/e2e/` (w nazwie testu albo komentarzu ID TC),
  * ❌ **Nie** – tylko test manualny (np. ocena wyglądu albo przypadek testowy zbyt kosztowny
    w automatyzacji).
* **Priorytet:** Wysoki (główna ścieżka, reguła biznesowa), Średni, Niski.
* Każdy krok ma swój **oczekiwany wynik**. 
* Konto: przypadki testowe zakładają, że **użytkownik jest zalogowany** na istniejącym koncie.
  Rejestrację sprawdza osobno TC-01 (i TC-02). Dane potrzebne do testu (podróże, pozycje) opisują warunki wstępne; jeśli na koncie użytkownika istnieją już
  inne podróże, liczniki sprawdza się jako zmianę (np. „zwiększa się o 1”).
* Dane testowe: daty podawane są względem dnia testu („jutro”, „za 10 dni”).

## Przygotowanie środowiska

1. Uruchom aplikację: `docker compose up -d --build` (z katalogu głównego repozytorium).
2. Sprawdź `docker compose ps`: `backend` – **Up (healthy)**, `frontend` – **Up**.
3. Otwórz http://localhost:5173 w przeglądarce Chrome (okno 1280×800 lub większe).
4. Czysta baza (opcjonalnie): `docker compose down -v`, potem znowu krok 1.

## Szablon przypadku testowego

Każdy przypadek testowy w plikach wygląda tak (skopiuj ten fragment z widoku źródła pliku):

### TC-00 Tytuł opisujący zachowanie

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.x | Wysoki | ✅ Tak |

**Warunki wstępne:** …

**Dane testowe:** …

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | … | … |

**Wykonanie:** Data: … · Tester: … · Wynik: ✅ / ❌ / ⏭️ · Uwagi: …

---

Wynik: ✅ zaliczony, ❌ niezaliczony, ⏭️ pominięty (napisz dlaczego).
