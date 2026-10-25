// Steuerung und Ton.
export const JOYSTICK = {
  radius: 50,           // Punkte bis zum vollen Ausschlag
  totzone: 0.12,        // Anteil des Radius ohne Wirkung (Zittern des Daumens)
  knopfRadius: 22,      // Daumen-Kreis in Punkten
};

export const TON = {
  lautstaerke: 0.8,     // Gesamtlautstärke 0 … 1
  mindestAbstand: 0.05, // s: gleicher Sound nicht öfter (viele Tipps auf einmal)
};

export const TON_KNOPF = {
  groesse: 48,          // Punkte (CSS), Symbol wird doppelt aufgelöst gezeichnet
};
