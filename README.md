# Behandlungsplätze

Fall-, Fristen- und Honorarsteuerung für den ambulanten Teil der praktischen Ausbildung (PsychTh-APrV alte Route). Einzelseite, offline lauffähig, installierbar als PWA.

## Funktionen

- **Behandlungsplätze**: Sitzungsstand je Fall als Stundenband, Supervisionstakt 4:1 mit offener 4er-Marke, Marker für Sitzung 20 (KZT/LZT), Restkontingent, Zuordnung zur Supervisorin.
- **Supervision**: Terminliste nach Datum, Fall, Person, Einzel oder Gruppe; setzt den Sitzungsstand des Falls zurück.
- **Honorar**: Buchung der erbrachten Leistungen auf GOP mit Datum. Vierstufige Rechnung EBM-Wert → Kasse an Ambulanz (Auszahlungsquote) → verbleibt Institut → eigener Anteil. Quartalsübersicht mit voraussichtlichem Auszahlungsquartal.
- **Nachweis**: laufender Abgleich gegen die Sollwerte des § 4 PsychTh-APrV.
- **Berichtsbaukasten** (`bericht.html`): Bericht an die Gutachterin oder den Gutachter nach der Gliederung des PTV 3, umschaltbar zwischen Erst-, Umwandlungs- und Fortführungsantrag sowie VT und TP. Mit Helfern für Makroanalyse und SORKC, Umfangsanzeige gegen den Zwei-Seiten-Richtwert, Prüfliste und Textausgabe.
- **Falldarstellungs-Logbuch** (`logbuch.html`): laufende Dokumentation der Kandidatenfälle — Ausgangslage, Störungsmodell, Ziele, Verlaufsmessung mit Grafik, datierte Verlaufseinträge mit Wendepunktmarkierung, Abschluss und Reflexion. Übersicht über den Stand gegen die sechs geforderten Falldarstellungen und das abgedeckte Störungsspektrum.
- **Modul-Landkarten** (`module.html`): Sitzungsarchitektur für 22 Störungsbilder in acht Gruppen — Module mit Ziel, Bausteinen und typischen Stolpersteinen, skaliert auf die geplante Sitzungszahl, mit Haken und Fallnotizen je Modul.
- **Abschlussmaterialien** (`abschluss.html`): Rezidivprophylaxe-Blatt und Krisenkarte für Patient:innen, Abschlussgespräch-Checkliste und Katamnese-Anschreiben für die Behandlerseite. Eingabe links, druckfertiges Blatt rechts.
- **Verlaufsmonitoring** (`monitoring.html`): eigener Instrumentenkatalog mit Cutoff und RCI, Messplan mit Fälligkeitsanzeige, Werteerfassung, Verlaufsgrafik mit Cutoff-Linie und Einordnung der Veränderung. CSV-Import und -Export.

## Datenhaltung

Alle Daten liegen ausschließlich im `localStorage` des jeweiligen Browsers. Nichts wird übertragen, es gibt kein Backend. Über „Daten sichern“ und „Sicherung laden“ lässt sich der Stand als JSON exportieren und auf ein anderes Gerät übernehmen.

Es sind bewusst keine Felder für Klarnamen, Geburtsdaten oder Adressen vorgesehen. Die Zuordnung von Fallcode zu Person gehört nicht in dieses Werkzeug.

## Veröffentlichen über GitHub Pages

1. Repository anlegen und den Inhalt dieses Ordners in den Wurzelordner des Standardbranches legen.
2. Settings → Pages → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)`.
3. Aufruf unter `https://<benutzername>.github.io/<repository>/`.

Alle Pfade sind relativ, die Anwendung läuft daher auch im Unterordner einer Pages-Adresse. Die Datei `.nojekyll` verhindert, dass Jekyll den Ordner umschreibt. HTTPS ist Voraussetzung für den Service Worker; GitHub Pages liefert das mit.

## Installation als App

Nach dem ersten Aufruf über HTTPS bietet der Browser die Installation an (Chrome und Edge über das Symbol in der Adresszeile, Safari auf iOS über „Zum Home-Bildschirm“). Danach startet die Anwendung auch ohne Netz.

## Neue Version ausrollen

Nach jeder Änderung an `index.html`, `bericht.html`, `logbuch.html`, `module.html`, `abschluss.html`, `monitoring.html`, `sw.js`, `manifest.webmanifest` oder den Icons in `sw.js` die Zeile

```js
var VERSION = "v8";
```

hochzählen und neu hinzugekommene Dateien in die Liste `SHELL` eintragen. Sonst liefert der alte Cache weiter die vorige Fassung. Beim nächsten Aufruf erscheint oben die Leiste „Eine neue Version ist geladen“.

## Rechengrundlagen und Vorbehalt

Der Orientierungswert ist mit 12,7404 Cent (2026) vorbelegt, die Einzeltherapieziffern mit 941 Punkten. Die zum 1. April 2026 beschlossene Absenkung um 4,5 Prozent (899 Punkte) ist per Eilbeschluss des LSG Berlin-Brandenburg vom 9. Juli 2026 ausgesetzt, eine rückwirkende Anwendung bleibt möglich; der Schalter im Reiter „Honorar“ rechnet beide Szenarien.

Die übrigen vorbelegten Punktzahlen stammen nicht aus dem KBV-Original und sind vor Gebrauch mit dem aktuellen EBM abzugleichen. Bei Ziffern ohne belastbaren Wert steht 0.

Die Honorarangaben sind eine Projektion, keine Honorarzusage. Maßgeblich sind die Vergütungsordnung der Ausbildungsambulanz und der Honorarbescheid der KV. Der Nachweisreiter ersetzt keinen Stundennachweis der Ausbildungsstätte; maßgeblich sind § 4 PsychTh-APrV und die Institutsordnung.

## Berichtsbaukasten

Die Gliederung folgt dem Leitfaden zum Erstellen des Berichts an die Gutachterin oder den Gutachter (PTV 3, Anlage 1 der Psychotherapie-Vereinbarung). Die Unterpunkte sind sinngemäß wiedergegeben und ersetzen den Originalvordruck nicht; maßgeblich ist dessen aktuelle Fassung.

Der Bericht enthält keine Klarnamen — die Zuordnung läuft über die Chiffre auf dem PTV 2. Die Prüfliste weist auf vollständige Datumsangaben und E-Mail-Adressen im Text hin, ersetzt aber keine eigene Durchsicht vor der Einreichung.

## Logbuch

Die sechs Falldarstellungen entstehen nicht am Ende, sondern über die gesamte Behandlung. Das Logbuch hält die Bausteine fest, die sich zwei Jahre später nicht mehr aus der Akte rekonstruieren lassen: den ersten Eindruck, die Wendepunkte, die Messwerte. Form und Umfang der Darstellungen regelt zusätzlich die Ordnung der Ausbildungsstätte.

## Modul-Landkarten

Die Modulfolgen sind ein Planungsraster aus der verhaltenstherapeutischen Manualliteratur, kein Bestandteil der Leitlinien. Die Leitlinien empfehlen Verfahren und Bausteine, nicht die Zahl der Sitzungen pro Modul. Jede Landkarte nennt die einschlägige Leitlinie mit Stand und Gültigkeit; die S3-Leitlinie Angststörungen (051-028) ist seit dem 05.04.2026 über ihre Gültigkeitsdauer hinaus, die Fortschreibung ist vor Gebrauch zu prüfen.

## Abschlussmaterialien

Patientenblätter sind mit **P** gekennzeichnet und in Alltagssprache gehalten, Behandlerblätter mit **T**. Die Patientenblätter sind zum gemeinsamen Ausfüllen in der Sitzung gedacht, nicht zum vorbereiteten Übergeben.

Die Krisenkarte druckt im Format 85,6 × 54 mm. Die bundesweiten Nummern (ärztlicher Bereitschaftsdienst 116 117, Telefonseelsorge 0800 111 0 111 und 116 123, Notruf 112) sind fest eingedruckt; die örtlichen Kontakte werden eingetragen. Vor dem Einsatz mit den Krisenwegen und Erreichbarkeitsregeln der Ambulanz abgleichen.

Das Katamnese-Anschreiben ist eine Vorlage und setzt eine dokumentierte Einwilligung zur Kontaktaufnahme voraus.

## Verlaufsmonitoring

Das Werkzeug speichert nur Kennwerte eines Verfahrens (Wertebereich, Richtung, Cutoff, Grenze der reliablen Veränderung), keine Itemtexte — Durchführung und Auswertung bleiben bei psychoEQ oder dem jeweiligen Verfahren. Cutoff und RCI sind verfahrensspezifisch und dem Manual zu entnehmen; ohne Eintrag unterbleibt die Einordnung der Veränderung.

Der CSV-Import erwartet die Spalten `Fallcode;Instrument;Datum;Sitzung;Wert;Anmerkung`. Ein Export aus psychoEQ lässt sich in dieses Format bringen; Dezimaltrennzeichen Komma oder Punkt werden beide gelesen.

Die Einordnung folgt der Logik von Jacobson und Truax: reliabel verändert, wenn die Differenz die eingetragene RCI-Grenze erreicht, klinisch bedeutsam zusätzlich beim Überschreiten des Cutoffs.

## Fallcodes über die Seiten hinweg

Die sechs Seiten speichern ihre Inhalte getrennt, teilen sich aber ein Verzeichnis der Fallcodes unter dem Schlüssel `pia-faelle-v1`. Jede Seite trägt dort die von ihr verwendeten Codes ein; die Behandlungsplätze ergänzen Bereich, Sitzungsstand und Status.

Alle Fallcode-Felder bieten die bekannten Codes als Vorschlagsliste an, mit Bereich und Sitzungsstand als Zusatzinfo. Das Verlaufsmonitoring greift für die Fälligkeitsprüfung auf den Sitzungsstand aus dem Verzeichnis zurück, solange dort kein eigener Stand gesetzt ist.

Das Verzeichnis enthält nur Codes und diese Metadaten, keine Inhalte. Die JSON-Sicherungen der einzelnen Seiten bleiben getrennt.
