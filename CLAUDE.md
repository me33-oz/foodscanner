# Projektkontext für Claude Code

## Was das ist

„Etikett" — eine Progressive Web App ohne Server und ohne Build-Schritt. Sie
liest Lebensmittel-Barcodes mit der Handykamera und zeigt Nährwerte, Zutaten
und Produktbilder aus der offenen Datenbank Open Food Facts.

Auftraggeber und Nutzer ist Max Eckel (Company Move GmbH, Hamburg). Er arbeitet
in der betrieblichen Gesundheitsförderung und setzt die App sowohl privat als
auch in Beratung, Kursen und Vorträgen ein. Er hat wenig Programmiererfahrung:
Erklär Änderungen in klaren Worten, schick ihn nicht in die Kommandozeile, wenn
es ohne geht, und begründe technische Entscheidungen kurz statt sie nur zu
treffen. Die Projektsprache ist durchgehend Deutsch — Oberfläche, Kommentare,
Dokumentation.

## Aufbau

Statische Dateien, alle im Projektwurzelverzeichnis — bewusst flach, damit
Max sie auf github.com ohne Ordnernavigation bearbeiten und hochladen kann:

| Datei | Inhalt |
|---|---|
| `index.html` | **Die gesamte App.** HTML, CSS und JavaScript in einer Datei, thematisch in Blöcke unterteilt und auf Deutsch kommentiert. |
| `sw.js` | Service Worker. Hält die App-Hülle samt Schriften und Icons offline vor, cacht bewusst keine Produktdaten. |
| `manifest.json` | Macht die App installierbar. Pfade sind relativ (`./`), damit GitHub Pages im Unterordner funktioniert. |
| `icon.svg` | Quellform des App-Icons: grünes Rechteck mit sieben Balken. |
| `icon-192.png`, `icon-512.png`, `icon-maskable.png` | Icons fürs Manifest. Die maskable-Fassung hat Rand, weil Android beschneidet. Erzeugt aus `icon.svg`. |
| `apple-touch-icon.png` | 180×180, deckend und ohne runde Ecken — iOS rundet selbst und kann mit SVG-Icons nichts anfangen. Ohne diese Datei legt Safari beim Hinzufügen zum Home-Bildschirm einen Bildschirmausschnitt ab. |
| `fraunces.woff2`, `public-sans.woff2` | Die beiden Schriften, lokal statt von Google. Variable Schriften: je eine Datei deckt alle Strichstärken ab. |
| `SCHRIFTEN-LIZENZ.txt` | SIL OFL 1.1 im Volltext. Die Lizenz verlangt, dass er mitgeliefert wird. |
| `.nojekyll` | Leer, sorgt dafür dass GitHub Pages die Dateien unverändert ausliefert. |
| `README.md` | Anwenderdokumentation samt Anleitung für GitHub Pages. |
| `LICENSE` | MIT (gilt für den Code, nicht für die Schriften). |

**Keine externen Schriften nachladen.** Google Fonts lag hier bis September
2026 als `<link>` im Kopf. Das überträgt bei jedem Aufruf die IP-Adresse der
Nutzer an Google, ohne Einwilligung — für eine App, die Max in Beratung und
Kursen weitergibt, ist das das größte vermeidbare Risiko. Wer Schriften
ändert, legt sie wieder lokal ab und ergänzt die Lizenz.

Es gibt bewusst kein npm, kein Framework und keinen Build. Das soll so bleiben:
Max muss die Dateien notfalls direkt auf github.com im Browser bearbeiten
können. Externe Bibliotheken nur, wenn es ohne wirklich nicht geht — aktuell
ist es genau eine, ZXing, und die wird nur dann nachgeladen, wenn der Browser
keine eigene Barcode-Erkennung mitbringt.

## Funktionsumfang

- Barcode-Scan über `BarcodeDetector` (Chrome, neuere iOS-Safari), sonst ZXing
  von jsDelivr als Rückfallebene, sonst manuelle Eingabe
- Suche nach Produktnamen als dritter Weg ins Produkt, seitenweise nachladbar,
  auf den deutschen Markt eingegrenzt
- Nutri-Score, NOVA-Verarbeitungsgrad, Green-Score
- Portionsrechner mit Vorschlägen aus Herstellerangabe, Produktgruppe und
  Packungsgröße; Nährwerte je 100 g, je Portion und als Anteil der
  EU-Referenzmenge nach Verordnung 1169/2011
- Zutatenliste in allen Sprachen, die Open Food Facts für das Produkt hat;
  fehlt Deutsch oder Englisch, übersetzt die App auf Knopfdruck: sofort über
  ein eingebautes Glossar, dann maschinell über MyMemory nachgereicht
- Ähnliche Produkte und günstiger bewertete Alternativen aus derselben
  Kategorie, mit Angabe was konkret besser ist
- Produktfoto, Zutatenlisten- und Nährwertfoto einzeln herunterladbar
- Scan-Verlauf der letzten 40 Produkte, als CSV exportierbar
- Helles und dunkles Design, manuell umschaltbar

## Schnittstellen und ihre Tücken

### Open Food Facts — Produktabruf
`GET https://world.openfoodfacts.org/api/v2/product/<ean>.json`
Grenze: 15 Abrufe pro Minute und IP. Läuft zuverlässig.

### Open Food Facts — Kategoriesuche
`GET https://world.openfoodfacts.org/api/v2/search?categories_tags=<tag>&…`

**Hier sitzen die beiden wichtigsten Erfahrungen des Projekts.**

**(1) Die Kategorie-Tags sind nicht sauber sortiert.** `categories_tags`
enthält neben der englischen Systematik auch Einträge, die Freiwillige in
ihrer eigenen Sprache eingetippt haben — bei Nutella stehen am Ende
`fr:Nutella` und `fr:Nuttela`, bei Coca-Cola `pt:bebidas cafeína`. Die App
hat lange den **letzten** Eintrag genommen, weil dort normalerweise die
speziellste Kategorie steht. Auf so einen Tag antwortet der Dienst mit
**HTTP 200 und null Treffern** — kein Fehler, also kein zweiter Versuch, und
die leere Liste wurde 24 Stunden gepuffert. Deshalb erschienen bis September
2026 nie Vorschläge. Brauchbare Tags erkennt man daran, dass sie mit `en:`
beginnen und durchgehend klein geschrieben sind; alles, was nicht in der
Systematik steht, behält seine ursprüngliche Schreibweise. Das macht
`categoryLadder()`.

Die speziellste Stufe trifft oft nur Varianten desselben Produkts (bei
Nutella sechs Nutella-Größen). `loadSimilar()` steigt deshalb bis zu drei
Stufen nach oben, bis mindestens sechs Produkte beisammen sind **und**
mindestens eines besser bewertet ist, und sammelt die Treffer dabei auf,
statt sie zu ersetzen.

**(2) Die Abweisung ist Lastabwurf, keine Strafe.** Sie kommt als HTTP 503
**ohne CORS-Header**. Der Browser darf die Antwort deshalb nicht lesen und
wirft nur `TypeError: Failed to fetch` — der Statuscode ist im Frontend nicht
sichtbar. Das sieht nach einem CORS-Problem aus, ist aber keins.

Neu gemessen (22. September 2026, echte Aufrufe aus fremder Origin):

- Eine Abweisung kommt nach **0,2 Sekunden** zurück, eine echte Antwort
  braucht **rund eine Sekunde**. Der Server wirft sofort ab, wenn er
  ausgelastet ist.
- Schnelles Nachfassen wirkt: mit 1,5 s Abstand war über drei Kategorien
  hinweg spätestens der vierte Versuch erfolgreich.
- **Lange Pausen bringen nichts.** Dieselbe Kategorie wurde mit 20 Sekunden
  Abstand genauso abgewiesen wie mit zwei. Die früher hier dokumentierten
  sechs Sekunden Mindestabstand haben also nur Wartezeit gekostet.
- Es ist **nicht** die Ergebnisgröße: `en:spreads` mit 9.210 Treffern lief
  durch, während `en:sweet-spreads` dreimal hintereinander abgewiesen wurde.
  `page_size` zu senken hilft daher nicht.
- `sort_by=unique_scans_n` wird praktisch immer abgewiesen. **Nicht wieder
  einbauen**, auch nicht `sort_by=popularity_key`.
- Ein serverseitiger Filter `nutriscore_grade=b` ist **kaputt**: die Antwort
  enthält Produkte mit c, d und e. Nicht verwenden, clientseitig filtern.
- `https://search.openfoodfacts.org` (Search-a-licious) beantwortet genau die
  Abfragen, an denen die alte Schnittstelle scheitert, sendet aber **keinen
  `access-control-allow-origin`-Header**. Aus dem Browser damit unbrauchbar.
  Vor einem erneuten Anlauf zuerst die Kopfzeilen prüfen.

Daraus die aktuelle Strategie in `searchCategory()`: kein `sort_by`,
`SEARCH_GAP_MS = 1500`, `SEARCH_TRIES = 5`, Treffer 24 Stunden in
`localStorage` gepuffert, **leere Trefferlisten nur eine Stunde**, und die
Suche startet erst auf Klick statt automatisch bei jedem Produkt. Wer daran
schraubt, sollte vorher gegen den echten Dienst messen, nicht raten.

### Open Food Facts — Suche nach Produktnamen
`GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=…&json=1`

Die v2-Schnittstelle kann **keine** Volltextsuche, nur nach Kategorien und
Merkmalen filtern. Dafür gibt es diese ältere Adresse. Gemessen am
22. September 2026:

- Sendet `Access-Control-Allow-Origin: *`, ist aus dem Browser also nutzbar —
  anders als der Nachfolger search.openfoodfacts.org.
- `fields` wird beachtet, die Antwort bleibt damit klein.
- Landesfilter über das Tripel `tagtype_0=countries`, `tag_contains_0=contains`,
  `tag_0=germany`. Achtung: hier steht der blanke Name, nicht `en:germany` wie
  bei `MARKET`. `searchText()` schneidet das Präfix deshalb ab.
- Dasselbe Überlastverhalten wie die Kategoriesuche: HTTP 503 nach 0,2 s,
  echte Antwort nach etwa 0,5 s. Es gelten also dieselben Konstanten
  `SEARCH_GAP_MS` und `SEARCH_TRIES`, und `lastSearchAt` wird mit der
  Kategoriesuche geteilt, damit sich beide nicht gegenseitig ausbremsen.

### Die Falle mit `en:plant-based-foods-and-beverages`

`categories_tags` enthält bei jedem pflanzlichen Lebensmittel den Sammelbegriff
`en:plant-based-foods-and-beverages` — bei Haferflocken, Brot, Nudeln, Gemüse,
Nüssen. Ein Mustervergleich auf `beverages` über die zusammengefügten Tags
erklärt damit den halben Supermarkt zum Getränk. Genau das ist passiert:
Haferflocken wurden in Millilitern gerechnet und mit „Glas · 250 ml“
vorgeschlagen, obwohl der Hersteller 100 g angibt.

Deshalb gibt es `categoryText(p)`. Die Funktion wirft Tags mit
`foods-and-beverages` raus, bevor verglichen wird, und wird von `isDrink()`
und `portionSuggestions()` gemeinsam benutzt. Wer neue Mustervergleiche über
Kategorien baut, nimmt `categoryText(p)` und nicht `categories_tags.join(" ")`.

### MyMemory — Übersetzung
`GET https://api.mymemory.translated.net/get?q=…&langpair=en|de`
Kostenlos ohne Anmeldung, rund 5.000 Zeichen pro Tag und IP. Die Konstante
`TRANSLATE_EMAIL` hebt das auf 50.000, überträgt die Adresse dann aber an den
Dienst — sie ist absichtlich leer und wird nur auf ausdrücklichen Wunsch
gefüllt. Lange Texte werden an Kommas in Stücke unter 450 Zeichen geteilt.

## Regeln beim Ändern

1. **Versionsnummer hochzählen.** Nach jeder Änderung an `index.html` in
   `sw.js` die Zeile `const VERSION = "etikett-vN";` erhöhen. Sonst behalten
   Geräte, die die App schon geöffnet haben, die alte Fassung aus dem Cache.
   Aktueller Stand: `etikett-v5`, App-Version `2.3`.
2. **Kein Lookbehind in regulären Ausdrücken** (`(?<=…)`). Ältere iOS-Safari
   werfen dabei schon beim Parsen einen Fehler und die ganze App bleibt
   schwarz. Das ist in diesem Projekt schon einmal passiert.
3. **Erst prüfen, dann behaupten.** Wo eine fremde Schnittstelle im Spiel ist,
   lieber einen echten Aufruf machen als annehmen, dass die Dokumentation
   stimmt. Die 503-Geschichte oben wäre sonst nie aufgefallen.
4. **Fehlermeldungen erklären die Lage.** Keine durchgereichten technischen
   Meldungen, sondern ein Satz, der sagt was los ist und was hilft.
5. **Datenlage ehrlich zeigen.** Open Food Facts ist von Freiwilligen gepflegt
   und lückenhaft. Fehlende Angaben werden als fehlend dargestellt, nie
   geschätzt oder stillschweigend übersprungen. Bei Allergenen steht immer der
   Hinweis, dass die Verpackung zählt.
6. **Lizenzhinweise mitführen.** Produktdaten stehen unter ODbL, Bilder unter
   CC-BY-SA. Beides ist in der Fußzeile vermerkt und bleibt dort.

## Offene Ideen

- Vergleich zweier gescannter Produkte nebeneinander
- Export einer Produktübersicht als PDF für Handouts in Kursen
- Eigene Portionsprofile, die über Sitzungen hinweg erhalten bleiben
- Lokales Git-Repository und Veröffentlichung per `git push` statt
  Datei-Upload über die GitHub-Oberfläche
