# Etikett — Produkt-Scanner

Eine kleine Web-App, die Lebensmittel-Barcodes mit der Handykamera liest und
Nährwerte, Zutaten, Allergene und Produktfotos aus der offenen Datenbank
[Open Food Facts](https://world.openfoodfacts.org) anzeigt. Die Fotos von
Produkt, Zutatenliste und Nährwerttabelle lassen sich einzeln herunterladen.

Kein Server, kein Build, kein Framework: vier statische Dateien, die GitHub
Pages direkt ausliefern kann.

## Funktionen

- Barcode per Kamera scannen (EAN-13, EAN-8, UPC, Code-128) oder eintippen
- Nutri-Score, NOVA-Verarbeitungsgrad und Green-Score als Karten
- **Portionsrechner:** Portionsgröße eingeben oder aus Vorschlägen wählen
  (Herstellerangabe, übliche Größe der Produktgruppe, ganze Packung). Die
  Nährwerte rechnen sich mit, dazu der Anteil an der EU-Referenzmenge
- Nährwerte je 100 g und je Portion, mit Ampelpunkten für Fett, gesättigte
  Fettsäuren, Zucker und Salz
- **Zutaten übersetzen:** Umschalten zwischen allen Sprachen, die Open Food
  Facts für das Produkt hat; fehlt Deutsch oder Englisch, übersetzt die App
  auf Knopfdruck — sofort per eingebautem Glossar, dann maschinell nachgereicht
- **Ähnliche Produkte** aus derselben Kategorie, nach Verbreitung sortiert
- **Günstiger bewertete Alternativen** mit Angabe, was konkret besser ist
  ("32 % weniger Zucker")
- Zutatenliste, Allergene, Zusatzstoffe mit E-Nummern, Siegel
- Produktfoto, Zutatenlisten- und Nährwertfoto einzeln herunterladbar
- Verlauf der letzten 40 Scans, als CSV exportierbar
- Helles und dunkles Design, installierbar als App, App-Hülle offline nutzbar

## Auf GitHub Pages veröffentlichen

1. Auf github.com oben rechts auf **+ → New repository**.
2. Namen vergeben, zum Beispiel `etikett`, **Public** wählen, **Create repository**.
3. Auf der leeren Repository-Seite **uploading an existing file** anklicken.
4. Diese Dateien gemeinsam in das Feld ziehen:
   `index.html`, `manifest.json`, `icon.svg`, `sw.js`, `.nojekyll`
   (README und LICENSE gern dazu). Unten **Commit changes**.
5. **Settings → Pages**. Unter *Build and deployment* bei *Source*
   **Deploy from a branch** stehen lassen, als Branch `main` und Ordner `/ (root)`
   wählen, **Save**.
6. Nach ein bis zwei Minuten steht die Adresse oben auf derselben Seite:
   `https://<benutzername>.github.io/etikett/`

Die Datei `.nojekyll` gehört dazu, damit GitHub die Dateien unverändert
ausliefert. Sie ist leer und im Datei-Explorer versteckt, weil ihr Name mit
einem Punkt beginnt — im Upload-Dialog von GitHub taucht sie trotzdem auf,
wenn man alle Dateien gemeinsam hineinzieht. Falls nicht: auf der
Repository-Seite **Add file → Create new file**, als Namen `.nojekyll`
eintippen, Feld leer lassen, speichern.

## Aufs Handy legen

- **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
- **Android (Chrome):** Menü → „App installieren“

Der Kamerazugriff funktioniert nur über https. GitHub Pages liefert
automatisch https aus, insofern passt das.

## Etwas ändern

Alles steckt in `index.html`, in einem Stück und kommentiert. Über
**Edit** (Stift-Symbol) lässt sich die Datei direkt auf github.com bearbeiten;
nach **Commit changes** ist die Änderung nach ein bis zwei Minuten online.

- **Farben:** der `:root`-Block ganz oben, `--accent` ist die Hauptfarbe
- **Nährwerte in der Tabelle:** die Liste `NUTRIENTS` im Skriptteil
- **Portionsvorschläge je Produktgruppe:** die Liste `CATEGORY_PORTIONS`
- **Übersetzungsglossar:** das Objekt `GLOSSARY_EN_DE`
- **Markt für Empfehlungen:** die Konstante `MARKET` (leerer String = weltweit)
- **Name der App:** `<title>`, die Überschrift `<h1>` und `manifest.json`
- **Welche Bilder angeboten werden:** die Funktion `pickImages`

Wichtig: Nach jeder Änderung an `index.html` in `sw.js` die Zeile
`const VERSION = "etikett-v1";` hochzählen, also `etikett-v2` und so weiter.
Sonst zeigt der Browser Besuchern weiter die alte Fassung aus dem Cache.

## Grenzen aus der Datenquelle

- Die Daten stammen von Freiwilligen. Besonders bei Handelsmarken fehlen oft
  Nährwerte oder Fotos. Vor einem Vortrag die konkreten Produkte durchtesten.
- Open Food Facts erlaubt 15 Produktabrufe und 10 Suchanfragen pro Minute und
  IP-Adresse. Scannt eine ganze Gruppe über dasselbe WLAN, kann das eng werden;
  die Empfehlungen sind dann kurzzeitig nicht verfügbar.
- Die Empfehlungen entstehen aus einer Kategoriesuche und dem Nutri-Score.
  Geschmack, Preis und Verfügbarkeit im Laden bleiben außen vor — als
  Gesprächseinstieg in der Beratung taugt es, als Kaufempfehlung nicht ohne
  eigenen Blick.
- Die maschinelle Übersetzung läuft über MyMemory: ohne Anmeldung rund 5.000
  Zeichen pro Tag. Trägst du in `index.html` bei `TRANSLATE_EMAIL` eine Adresse
  ein, steigt das Kontingent auf 50.000 — die Adresse geht dabei an MyMemory.
  Für Allergiefragen zählt immer die Originalliste auf der Verpackung.
- Fehlende Produkte lassen sich in der offiziellen Open-Food-Facts-App selbst
  anlegen und stehen danach allen zur Verfügung.
- Die Erkennung nutzt, wo vorhanden, die eingebaute Barcode-Funktion des
  Browsers. Fehlt sie (ältere iPhones), wird beim Kamerastart eine kleine
  Scanner-Bibliothek von einem CDN nachgeladen.

## Lizenz und Quellenangabe

Der Code steht unter der MIT-Lizenz, siehe `LICENSE`.

Die Produktdaten gehören Open Food Facts und stehen unter
[ODbL](https://opendatacommons.org/licenses/odbl/1.0/), die Produktfotos unter
[CC-BY-SA](https://creativecommons.org/licenses/by-sa/3.0/deed.de). Wandern
Fotos in Präsentationen oder Handouts, gehört „Quelle: Open Food Facts,
CC-BY-SA“ darunter. Vor breiterer Nutzung bittet das Projekt um Kenntnisnahme
der [Nutzungsbedingungen](https://world.openfoodfacts.org/terms-of-use).
