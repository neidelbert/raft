// Prüft die Team-Seite (buero/) in iPhone-Ansicht: node tests/buero-test.js
// Arbeitet auf einer Kopie, die echte buero/daten.json bleibt unverändert.
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const PORT = 8799;
let fehlerZahl = 0;
function pruefe(bedingung, text) {
  console.log(`${bedingung ? "OK   " : "FEHLER"} ${text}`);
  if (!bedingung) fehlerZahl++;
}

(async () => {
  const kopie = fs.mkdtempSync(path.join(os.tmpdir(), "buero-"));
  fs.cpSync(path.join(REPO, "buero"), path.join(kopie, "buero"), { recursive: true });
  fs.copyFileSync(path.join(REPO, "PROJEKT.md"), path.join(kopie, "PROJEKT.md"));
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: kopie, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 800));

  const browser = await chromium.launch();
  const kontext = await browser.newContext({ ...devices["iPhone 13"] });
  const seite = await kontext.newPage();
  const konsolenFehler = [];
  seite.on("console", (m) => m.type() === "error" && konsolenFehler.push(m.text()));
  seite.on("pageerror", (e) => konsolenFehler.push(e.message));
  const url = `http://127.0.0.1:${PORT}/buero/`;

  try {
    await seite.goto(url);
    await seite.waitForSelector("[data-agent]");
    const daten = JSON.parse(fs.readFileSync(path.join(kopie, "buero/daten.json"), "utf8"));

    // Büro-Ansicht
    pruefe((await seite.locator("[data-agent]").count()) === daten.agents.length, `Team zeigt ${daten.agents.length} Plätze`);
    pruefe((await seite.locator("#ansicht-team .status-wartet").count()) >= 1, "Status „wartet“ sichtbar");
    const breite = await seite.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    pruefe(breite, "kein seitliches Scrollen auf iPhone-Breite");

    // Agent-Karte
    await seite.locator('[data-agent="planer"]').tap();
    pruefe(await seite.locator("#blatt-inhalt", { hasText: "Rolle" }).isVisible(), "Agent-Karte zeigt Rolle");
    pruefe(await seite.locator("#blatt-inhalt", { hasText: "Letzte Ergebnisse" }).isVisible(), "Agent-Karte zeigt Ergebnisse");
    await seite.fill("#auftrag-text", "Plane die Wasserfilter.");
    pruefe(await seite.locator("#auftrag-kopieren").isVisible(), "Auftrag-Feld mit Kopier-Knopf");
    await seite.locator(".schliessen").tap();

    // Postfach
    const offen = daten.freigaben.filter((f) => f.status === "offen").length;
    pruefe((await seite.textContent("#zaehler")) === String(offen), `Postfach-Zähler ${offen}`);
    await seite.locator('.leiste [data-ansicht="postfach"]').tap();
    pruefe((await seite.locator("#ansicht-postfach [data-aktion=freigegeben]").count()) === offen, "jede offene Freigabe hat Freigeben/Ändern/Später");

    // Ohne Schlüssel: Kopiertext
    await seite.locator('[data-freigabe="f-004"] [data-aktion="spaeter"]').tap();
    const kopiertext = await seite.inputValue("#kopier-text");
    pruefe(kopiertext.includes("Später") && kopiertext.includes("f-004"), "ohne Schlüssel entsteht Antwort-Text zum Kopieren");
    await seite.locator(".schliessen").tap();

    // Aufgaben
    await seite.locator('.leiste [data-ansicht="aufgaben"]').tap();
    const stufen = await seite.locator("#ansicht-aufgaben h3").allTextContents();
    pruefe(stufen.join("|") === "Idee|Geplant|In Arbeit|Beim Debugger|Fertig", "Aufgaben-Tafel mit 5 Stufen");

    // Projektdatei
    await seite.locator('.leiste [data-ansicht="projekt"]').tap();
    await seite.waitForSelector(".projekt h2");
    pruefe(await seite.locator(".projekt", { hasText: "Nächste Schritte" }).isVisible(), "Projektdatei mit nächsten Schritten");

    // Testaufgabe der Spezifikation: daten.json ändern, neu laden
    daten.freigaben.push({ id: "f-test", art: "spielgefuehl", titel: "Testfreigabe Wellenhöhe", text: "Test", von: "Test", datum: "24.10.2026", status: "offen", antwort: "", entschieden: "" });
    daten.agents.find((a) => a.id === "programmierer").status = "wartet";
    fs.writeFileSync(path.join(kopie, "buero/daten.json"), JSON.stringify(daten, null, 2));
    await seite.reload();
    await seite.waitForSelector("[data-agent]");
    pruefe(await seite.locator('[data-agent="programmierer"] .status-wartet').isVisible(), "Testaufgabe: Programmierer nach Neuladen „wartet“");
    await seite.locator('.leiste [data-ansicht="postfach"]').tap();
    pruefe(await seite.locator('[data-freigabe="f-test"]').isVisible(), "Testaufgabe: neue Freigabe nach Neuladen im Postfach");

    // Mit Schlüssel: schreibt direkt in GitHub (API nachgestellt)
    let gespeichert = null;
    const datei = () => Buffer.from(JSON.stringify(gespeichert || daten)).toString("base64");
    await kontext.route("https://api.github.com/**", async (route) => {
      const anfrage = route.request();
      const echt = anfrage.headers()["authorization"] === "Bearer test-schluessel";
      if (!echt) return route.fulfill({ status: 401, body: "{}" });
      const pfad = new URL(anfrage.url()).pathname;
      if (anfrage.method() === "GET" && pfad.endsWith("buero/daten.json"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: datei(), sha: "alt" }) });
      if (anfrage.method() === "GET" && pfad.endsWith("PROJEKT.md"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: Buffer.from("# Projekt Ä\n- Nächste Schritte").toString("base64"), sha: "p" }) });
      if (anfrage.method() === "PUT") {
        const koerper = JSON.parse(anfrage.postData());
        pruefe(koerper.sha === "alt" && koerper.branch === "main", "PUT nutzt aktuellen sha und Zweig main");
        gespeichert = JSON.parse(Buffer.from(koerper.content, "base64").toString("utf8"));
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: { sha: "neu" } }) });
      }
      route.fulfill({ status: 404, body: "{}" });
    });
    await seite.evaluate(() => localStorage.setItem("raft3d-buero", JSON.stringify({ schluessel: "test-schluessel" })));
    await seite.reload();
    await seite.waitForSelector("[data-agent]");
    pruefe((await seite.textContent("#stand")).includes("GitHub verbunden"), "mit Schlüssel: lädt aus GitHub");
    await seite.locator('.leiste [data-ansicht="postfach"]').tap();
    await seite.locator('[data-freigabe="f-002"] [data-aktion="aendern"]').tap();
    await seite.fill("#aenderung-text", "Ordner „spiel“ heißt „game“.");
    await seite.locator("#aenderung-senden").tap();
    await seite.waitForSelector("#meldung:not([hidden])");
    const f2 = gespeichert && gespeichert.freigaben.find((f) => f.id === "f-002");
    pruefe(f2 && f2.status === "aendern" && f2.antwort === "Ordner „spiel“ heißt „game“.", "Ändern mit Text landet in daten.json (Umlaute heil)");
    await seite.locator('[data-freigabe="f-001"] [data-aktion="freigegeben"]').tap();
    await seite.waitForFunction(() => document.querySelector("#meldung").textContent.includes("Freigegeben"));
    const f1 = gespeichert.freigaben.find((f) => f.id === "f-001");
    pruefe(f1.status === "freigegeben" && /\d\d\.\d\d\.\d{4}/.test(f1.entschieden), "Freigeben landet mit Datum in daten.json");
    pruefe(gespeichert.freigaben.find((f) => f.id === "f-002").status === "aendern", "frühere Antwort bleibt erhalten");
    pruefe((await seite.locator('#ansicht-postfach [data-freigabe="f-001"] [data-aktion]').count()) === 0, "erledigte Freigabe hat keine Knöpfe mehr");
    await seite.locator('.leiste [data-ansicht="projekt"]').tap();
    await seite.waitForSelector(".projekt h2");
    pruefe((await seite.textContent(".projekt h2")) === "Projekt Ä", "Projektdatei aus GitHub mit Umlauten");

    await seite.screenshot({ path: path.join(kopie, "bildschirm.png") });
    pruefe(konsolenFehler.length === 0, `keine Konsolenfehler${konsolenFehler.length ? ": " + konsolenFehler.join(" | ") : ""}`);
  } catch (fehler) {
    pruefe(false, `Ablauf abgebrochen: ${fehler.message}`);
  } finally {
    await browser.close();
    server.kill();
    fs.rmSync(kopie, { recursive: true, force: true });
  }
  console.log(fehlerZahl ? `\n${fehlerZahl} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
  process.exit(fehlerZahl ? 1 : 0);
})();
