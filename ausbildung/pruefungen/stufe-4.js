// Prüfung Stufe 4 (Ausbilder): node ausbildung/pruefungen/stufe-4.js
const t = require("../../werkzeuge/test-hilfe.js");
const URL = "http://127.0.0.1:8940/index.html?test=1&seed=3";
const z = (seite) => seite.evaluate(() => ({ zustand: window.spiel.zustand, punkte: window.spiel.punkte, rekord: window.spiel.rekord, leben: window.spiel.spieler.leben }));

(async () => {
  const lauf = await t.starte({ ordner: "ausbildung/uebungen/stufe-4", port: 8940, pfad: "index.html?test=1&seed=3" });
  const { seite } = lauf;
  try {
    await seite.evaluate(() => localStorage.removeItem("uebung-4"));
    await seite.reload(); await seite.waitForFunction("window.spiel && window.spiel.bereit");
    t.pruefe((await z(seite)).zustand === "titel", "startet im Titel");
    await seite.waitForTimeout(1500);
    t.pruefe((await z(seite)).punkte === 0, "im Titel laufen keine Punkte");
    await t.tippe(seite, 195, 400);
    await seite.waitForTimeout(300);
    t.pruefe((await z(seite)).zustand === "spiel", "Tippen startet das Spiel");
    await seite.waitForTimeout(2300);
    const s1 = await z(seite);
    t.pruefe(Number.isInteger(s1.punkte) && s1.punkte >= 2 && s1.punkte <= 3, `Punkte = überlebte Sekunden (${s1.punkte})`);
    await seite.evaluate(() => window.spiel.test.schaden(99));
    await seite.waitForTimeout(300);
    const s2 = await z(seite);
    t.pruefe(s2.zustand === "ende", "0 Leben → Ende");
    t.pruefe(s2.rekord === s2.punkte && s2.rekord >= 2, `Rekord übernommen (${s2.rekord})`);
    const text = await seite.evaluate(() => document.body.innerText);
    t.pruefe(/Rekord/.test(text), "Ende zeigt den Rekord");
    await seite.waitForTimeout(1500);
    t.pruefe((await z(seite)).punkte === s2.punkte, "im Ende laufen keine Punkte weiter");

    await t.tippe(seite, 195, 400);
    await seite.waitForTimeout(400);
    const s3 = await z(seite);
    t.pruefe(s3.zustand === "spiel" && s3.leben === 5 && s3.punkte === 0, "neue Runde setzt Leben und Punkte zurück");
    t.pruefe(await seite.evaluate(() => window.spiel.gegnerAktiv) <= 5, "neue Runde beginnt ohne alte Gegner");
    await seite.evaluate(() => window.spiel.test.schaden(99));
    await seite.waitForTimeout(300);
    t.pruefe((await z(seite)).rekord === s2.rekord, "niedrigere Punktzahl ändert den Rekord nicht");

    await seite.reload(); await seite.waitForFunction("window.spiel && window.spiel.bereit");
    t.pruefe((await z(seite)).rekord === s2.rekord, "Rekord nach Neuladen erhalten");

    // Pause bei verstecktem Tab
    await t.tippe(seite, 195, 400); await seite.waitForTimeout(1200);
    const vor = (await z(seite)).punkte;
    await seite.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    await seite.waitForTimeout(2200);
    const waehrend = (await z(seite)).punkte;
    await seite.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
    t.pruefe(waehrend - vor <= 1, `Pause bei verstecktem Tab (${waehrend - vor} Punkte dazu)`);

    await seite.evaluate(() => localStorage.setItem("uebung-4", "kaputt{"));
    await seite.goto(URL); await seite.waitForFunction("window.spiel && window.spiel.bereit", null, { timeout: 8000 });
    const s4 = await z(seite);
    t.pruefe(s4.zustand === "titel" && s4.rekord === 0, "kaputter Speicherstand → Standardwerte, kein Absturz");
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
