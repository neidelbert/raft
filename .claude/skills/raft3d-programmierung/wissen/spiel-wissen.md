# Wissen: Spielinhalt Raft 3D

Was entschieden ist, steht in `PROJEKT.md`. Hier steht, **wie** die Vorbilder es machen, damit der Programmierer die Pakete richtig umsetzt.
Zahlen sind **Startwerte**: Sie kommen in `spiel/js/config/` mit dem Kommentar „Wert für Lukas zum Testen“. Lukas entscheidet das Spielgefühl.

## Grundgefühl (Raft)
- Man treibt auf einem kleinen Floß (Start 2 × 2 Felder) im offenen Meer. Treibgut zieht langsam in Strömungsrichtung am Floß vorbei.
- Die erste Minute: Treibgut sehen, angeln, eine Platte anbauen. Hunger und Durst sinken spürbar, bleiben aber erst einmal harmlos.
- Hart wie Raft/ARK: Wer nicht isst und trinkt, stirbt. Der Hai ist von Anfang an da.

## Treibgut mit Haken (Version 1)
- Arten in Raft: Planke, Plastik, Palmblatt, Fass (mehrere Teile auf einmal). Bei uns zuerst Planke, Plastik und Palmblatt; Fässer kann Lukas später freigeben.
- Haken: Aktionsknopf gedrückt halten, um Kraft aufzuladen, loslassen, um zu werfen. Der Haken fliegt in Blickrichtung der Figur, Weite je nach Kraft. Danach holt man ihn mit erneutem Halten ein. Treibgut in der Nähe des Hakens bleibt hängen.
- Auf dem Handy statt Zielen: Der Haken fliegt zum nächsten Treibgut vor der Figur (Hilfe beim Zielen, wie in den Hai-Vorschlägen).
- Startwerte: Wurfweite 4–12 m, Einholen 3 m/s, Treibgut erscheint alle 2–4 s, höchstens 50 gleichzeitig (Budget).

## Raster-Floß (Version 1)
- Feldgröße 1,5 m. Felder hängen nur an den Seiten zusammen (nicht über Ecken).
- Bauen: Baumodus mit einem Knopf, dann zeigen freie Randfelder einen Umriss. Tippen baut, wenn genug Material da ist. Startkosten: 2 Planken + 2 Plastik pro Platte.
- Das Floß ist ein Raster mit Spalte und Zeile (`"s,z"` → Feld mit Lebenspunkten). Alles andere (Hai-Schaden, Speichern) baut darauf auf.

## Hai (entschieden: alle 4 Vorschläge, Reihenfolge 1+2, 3, 4)
1. **Bauteil-Biss:** Der Hai wählt eine Platte am Rand, beißt mehrmals zu (je Biss Schaden). Bei 0 Lebenspunkten ist die Platte weg, Gegenstände darauf fallen ins Wasser.
2. **Warnung:** Ablauf Kreisen (Flosse sichtbar) → Anschwimmen (1–2 s, eigener Sound) → Biss. Nie ohne Vorwarnung zubeißen.
3. **Abwehr:** Speer mit Aktionsknopf, automatisch auf den nächsten Hai in Reichweite gezielt. Nach einigen Treffern flieht er und kommt nach einer Pause wieder.
4. **Schwimmer-Jagd:** Wer im Wasser ist, wird zum Ziel. Nach dem Sprung gibt es eine kurze Schonzeit. Ein Biss richtet viel Schaden an, tötet aber nicht sofort.
- Startwerte: Kreisradius 8 m, Angriff alle 40–70 s, Platte 3 Bisse, Biss an der Figur 35 % Gesundheit, Schonzeit 3 s.
- Der Hai ist ein Zustandsautomat: `kreisen → anschwimmen → beissen → (fliehen) → kreisen`. Jeden Zustand einzeln testbar halten.

## Überleben (ARK-Stil)
- Werte 0–100: Hunger, Durst, Gesundheit, beim Tauchen dazu Sauerstoff. Startwerte: Durst sinkt in 6 Minuten von 100 auf 0, Hunger in 9 Minuten. Bei 0 sinkt die Gesundheit.
- Wetter, Tag und Nacht, Kälte und Wärme sind entschieden, kommen aber nach Version 1 (Pakete erst nach Plan).
- Wasser: Salzwasser macht durstig. Trinkbar wird es erst über Becher plus Wasserfilter/Kocher. Der **Wasserfilter ist entschieden für Version 1**.
- Essen: Fisch über Netz oder Angel, roh wenig, gebraten mehr. **Netze sind entschieden für Version 1**: Ein Netz am Floßrand fängt Treibgut automatisch.

## Flaschenpost (Version 1: nur Treibgut mit Hinweisen)
- Treibt wie anderes Treibgut. Angeln öffnet einen kurzen Hinweis (Text auf Deutsch, typografische Anführungszeichen). Die volle Wirkung kommt erst mit den Inseln.

## Fortschritt
- Werkzeug-Stufen (z. B. Haken aus Plastik → Haken aus Metall) und freischaltbare Bau-Rezepte. Konkrete Liste: noch offen, Lukas entscheidet.

## Hinweise statt Tutorial (entschieden)
- Kurze Texte am oberen Rand, wenn etwas zum ersten Mal passiert („Halte den Knopf, um den Haken zu werfen.“). Jeder Hinweis erscheint nur einmal (im Spielstand merken).

## Speichern (entschieden: automatisch, ein Spielstand)
- `localStorage` unter `raft3d-v1`. Gespeichert wird alle 30 s, bei `visibilitychange` und `pagehide`.
- Beim Laden über die Standardwerte legen, damit neue Felder alte Spielstände nicht kaputt machen (siehe `muster.md`).
