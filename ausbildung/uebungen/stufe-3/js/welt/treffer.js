// Treffer zwischen Gegnern und Spieler (Regeln ohne DOM, mit node testbar).
// Der Spieler hat dafür { leben, unverwundbar, schutz }: schutz = verbleibende Sekunden Unverwundbarkeit.

// Schutzzeit herunterzählen; danach ist der Spieler wieder verwundbar.
export function aktualisiereSchutz(spieler, dt) {
  if (!spieler.unverwundbar) return;
  spieler.schutz -= dt;
  if (spieler.schutz <= 0) { spieler.schutz = 0; spieler.unverwundbar = false; }
}

// Berührt ein Gegner den Spieler (Kreise), kostet das genau 1 Leben und startet die Schutzzeit.
// Während des Schutzes und bei 0 Leben passiert nichts. Gibt true zurück, wenn es einen Treffer gab.
export function pruefeTreffer(spieler, schwarm, trefferRadius, schutzZeit) {
  if (spieler.unverwundbar || spieler.leben <= 0) return false;
  const beruehrung = trefferRadius + schwarm.einstellung.radius, beruehrung2 = beruehrung * beruehrung;
  for (let i = 0; i < schwarm.anzahl; i++) {
    const dx = schwarm.x[i] - spieler.x, dy = schwarm.y[i] - spieler.y;
    if (dx * dx + dy * dy < beruehrung2) {
      spieler.leben -= 1;
      spieler.unverwundbar = true;
      spieler.schutz = schutzZeit;
      return true;
    }
  }
  return false;
}
