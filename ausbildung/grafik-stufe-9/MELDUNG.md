# Meldung Zeichner: Grafik für Ausbildungsstufe 9 „Assets“

Quellen: `grafik/quellen/<gruppe>/<name>.svg`, PNGs: `grafik/<gruppe>/<name>.png`, Liste: `grafik/grafik.json`, Prüfbild: `grafik/kontaktbogen.png`.
`render.js`: 23 Bilder, keine Fehler.

| Name | Rahmen | Größe PNG (px) | Fußpunkt / Ankerpunkt | Bilder pro Sekunde | Schleife |
|---|---|---|---|---|---|
| `figuren/held-steht` | 1 | 213 × 256 | unten Mitte: (0,5 · B; 0,958 · H) = (106, 245) | – | – |
| `figuren/held-lauf-1` … `-6` | 6 | 213 × 256 je Rahmen | wie `held-steht`, in allen Rahmen gleich | 10 (Gehen), bis 14 (Rennen) | ja |
| `effekte/explosion-1` … `-6` | 6 | 128 × 128 je Rahmen | Mitte (64, 66) = Explosionspunkt | 15 (Dauer 0,4 s) | nein, nach Rahmen 6 entfernen |
| `gegenstaende/muenze-1` … `-6` | 6 | 128 × 128 je Rahmen | Mitte (64, 64) | 10 (eine halbe Drehung in 0,6 s) | ja |
| `symbole/ton-an` | 1 | 128 × 128 | Mitte | – | – |
| `symbole/ton-aus` | 1 | 128 × 128 | Mitte | – | – |
| `symbole/pause` | 1 | 128 × 128 | Mitte | – | – |
| `boden/wiese` | 1 | 512 × 512 | Kachel, nahtlos (2 × 2 geprüft) | – | – |

## Hinweise für Horst
- Held schaut nach **rechts**. Für links im Spiel spiegeln (`scale(-1, 1)` um den Fußpunkt).
- Laufzyklus: 1 Kontakt, 2 Tiefpunkt, 3 Durchgang/Hochpunkt, 4–6 dasselbe mit dem anderen Bein. Der Körper hebt und senkt sich im Bild selbst (8 px von 240 = 3,3 %), also kein zusätzliches Hüpfen per Code. Die Füße stehen im Bild auf der Grundlinie y = 230 (viewBox 200 × 240).
- Beim Wechsel Stehen ↔ Laufen bleibt der Fußpunkt gleich, Horst kann direkt umschalten.
- Explosion: Rauch steigt in den Rahmen 4–6 von selbst nach oben, Rahmen 6 ist fast leer (blass).
- Münze: Rahmen 1 bis 6 = 0° bis 150° Drehung. Vorder- und Rückseite sehen gleich aus, deshalb schließt Rahmen 6 nahtlos an Rahmen 1 an. Glanz und Stern bleiben mittig, die Münze springt nicht.
- Symbole: gleicher blauer Knopf, weißes Zeichen. Keine Schrift.
- Bodenschatten zeichnet das Spiel.
