// Team-Seite Raft 3D: zeigt buero/daten.json und PROJEKT.md, schreibt Lukas' Antworten direkt in GitHub.

const STATUS_TEXT = { frei: "frei", arbeitet: "arbeitet", wartet: "wartet auf Lukas", problem: "Problem" };
const ART_TEXT = { feature: "Neues Feature", spielgefuehl: "Spielgefühl", technik: "Technik", version: "Version vor Debugger-Test" };
const STUFEN = [
  ["idee", "Idee"], ["geplant", "Geplant"], ["in-arbeit", "In Arbeit"], ["debugger", "Beim Debugger"], ["fertig", "Fertig"],
];
const ANTWORT_TEXT = { freigegeben: "Freigegeben", aendern: "Ändern", spaeter: "Später" };

// Lukas wartet nicht auf sich selbst: bei ihm heißt „wartet“, dass Post für ihn da ist.
function statusText(agent) {
  if (agent.id === "lukas" && agent.status === "wartet") return "hat Post";
  return STATUS_TEXT[agent.status] || agent.status;
}

const SPEICHER_SCHLUESSEL = "raft3d-buero";
const STANDARD_EINSTELLUNGEN = { besitzer: "neidelbert", repo: "raft", zweig: "main", schluessel: "" };

let daten = null;
let dateiSha = null;

// ---------- Einstellungen (nur im Browser dieses Geräts) ----------
function leseEinstellungen() {
  try {
    return { ...STANDARD_EINSTELLUNGEN, ...JSON.parse(localStorage.getItem(SPEICHER_SCHLUESSEL) || "{}") };
  } catch {
    return { ...STANDARD_EINSTELLUNGEN };
  }
}
function speichereEinstellungen(werte) {
  try { localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(werte)); } catch {}
}
const einstellungen = () => leseEinstellungen();
const mitGithub = () => Boolean(einstellungen().schluessel);

// ---------- Hilfen ----------
const $ = (sel) => document.querySelector(sel);
function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[z]));
}
function heute() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
let meldungZeit = 0;
function zeigeMeldung(text) {
  const el = $("#meldung");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(meldungZeit);
  meldungZeit = setTimeout(() => (el.hidden = true), 3500);
}
function base64NachText(b64) {
  const roh = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(roh, (z) => z.charCodeAt(0)));
}
function textNachBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let roh = "";
  for (let i = 0; i < bytes.length; i += 0x8000) roh += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(roh);
}
async function kopiere(text) {
  try {
    await navigator.clipboard.writeText(text);
    zeigeMeldung("Kopiert. Jetzt in den Chat einfügen.");
  } catch {
    zeigeMeldung("Kopieren ging nicht, bitte Text markieren.");
  }
}

// ---------- GitHub ----------
function apiUrl(pfad) {
  const e = einstellungen();
  return `https://api.github.com/repos/${e.besitzer}/${e.repo}/contents/${pfad}?ref=${encodeURIComponent(e.zweig)}`;
}
function apiKopf() {
  return { Authorization: `Bearer ${einstellungen().schluessel}`, Accept: "application/vnd.github+json" };
}
async function holeAusGithub(pfad) {
  const antwort = await fetch(apiUrl(pfad) + `&t=${Date.now()}`, { headers: apiKopf(), cache: "no-store" });
  if (!antwort.ok) throw new Error(`GitHub antwortet ${antwort.status}`);
  const json = await antwort.json();
  return { text: base64NachText(json.content), sha: json.sha };
}
async function schreibeNachGithub(pfad, text, sha, nachricht) {
  const e = einstellungen();
  const antwort = await fetch(apiUrl(pfad).split("?")[0], {
    method: "PUT",
    headers: { ...apiKopf(), "Content-Type": "application/json" },
    body: JSON.stringify({ message: nachricht, content: textNachBase64(text), sha, branch: e.zweig }),
  });
  if (!antwort.ok) {
    const fehler = new Error(`GitHub antwortet ${antwort.status}`);
    fehler.status = antwort.status;
    throw fehler;
  }
  return (await antwort.json()).content.sha;
}

// ---------- Laden ----------
async function ladeDaten() {
  if (mitGithub()) {
    const { text, sha } = await holeAusGithub("buero/daten.json");
    dateiSha = sha;
    return JSON.parse(text);
  }
  const antwort = await fetch(`daten.json?t=${Date.now()}`, { cache: "no-store" });
  if (!antwort.ok) throw new Error(`daten.json fehlt (${antwort.status})`);
  return antwort.json();
}
async function ladeProjektdatei() {
  if (mitGithub()) return (await holeAusGithub("PROJEKT.md")).text;
  const antwort = await fetch(`../PROJEKT.md?t=${Date.now()}`, { cache: "no-store" });
  if (!antwort.ok) throw new Error(`PROJEKT.md fehlt (${antwort.status})`);
  return antwort.text();
}

// ---------- Team ----------
function zeigeTeam() {
  const teile = [`<h2>Team</h2>`];
  for (const agent of daten.agents) {
    teile.push(`
      <button class="karte" data-agent="${esc(agent.id)}">
        <div class="zeile">
          <span><span class="name">${esc(agent.name)}</span><br><span class="leise">${esc(agent.kurz)}</span></span>
          <span class="status status-${esc(agent.status)}">${esc(statusText(agent))}</span>
        </div>
        ${agent.aufgabe ? `<div class="aufgabe">${esc(agent.aufgabe)}</div>` : ""}
      </button>`);
  }
  $("#ansicht-team").innerHTML = teile.join("");
}

function zeigeAgentKarte(id) {
  const agent = daten.agents.find((a) => a.id === id);
  if (!agent) return;
  const ergebnisse = (agent.ergebnisse || []).slice(0, 5)
    .map((e) => `<li><span class="leise">${esc(e.datum)}</span> ${esc(e.text)}</li>`).join("");
  const istLukas = agent.id === "lukas";
  $("#blatt-inhalt").innerHTML = `
    <h2>${esc(agent.name)}</h2>
    <span class="status status-${esc(agent.status)}">${esc(statusText(agent))}</span>
    <h3>Rolle</h3><p>${esc(agent.rolle)}</p>
    <h3>Aktuelle Aufgabe</h3><p>${esc(agent.aufgabe || "keine")}</p>
    <h3>Letzte Ergebnisse</h3>${ergebnisse ? `<ul class="ergebnisse">${ergebnisse}</ul>` : `<p class="leer">noch keine</p>`}
    ${istLukas ? "" : `
      <h3>Auftrag geben</h3>
      <textarea id="auftrag-text" placeholder="Was ist zu tun?"></textarea>
      <div class="knoepfe"><button class="knopf-haupt" id="auftrag-kopieren">Auftrag kopieren</button></div>
      <p class="leise">Den kopierten Text im Chat einfügen. Der Leiter gibt ihn weiter.</p>`}`;
  oeffneBlatt();
  const knopf = $("#auftrag-kopieren");
  if (knopf) knopf.onclick = () => {
    const text = $("#auftrag-text").value.trim();
    if (!text) return zeigeMeldung("Bitte erst den Auftrag schreiben.");
    kopiere(`Auftrag an ${agent.name} (Raft 3D), ${heute()}:\n${text}\n\nBitte als Leiter nach TEAM.md weitergeben.`);
  };
}

// ---------- Postfach ----------
function postfachKarte(f, mitKnoepfen) {
  const antwort = f.status !== "offen"
    ? `<p class="leise">${esc(ANTWORT_TEXT[f.status] || f.status)}${f.entschieden ? ` am ${esc(f.entschieden)}` : ""}${f.antwort ? `: „${esc(f.antwort)}“` : ""}</p>` : "";
  return `
    <div class="karte" data-freigabe="${esc(f.id)}">
      <span class="art">${esc(ART_TEXT[f.art] || f.art)}</span>
      <div class="name">${esc(f.titel)}</div>
      <p>${esc(f.text)}</p>
      ${f.beiFreigabe ? `<p class="leise">Bei Freigeben: ${esc(f.beiFreigabe)}</p>` : ""}
      <p class="leise">von ${esc(f.von)}, ${esc(f.datum)}</p>
      ${antwort}
      ${mitKnoepfen ? `
        <div class="knoepfe">
          <button class="knopf-ja" data-aktion="freigegeben">Freigeben</button>
          <button data-aktion="aendern">Ändern</button>
          <button data-aktion="spaeter">Später</button>
        </div>` : ""}
    </div>`;
}

function zeigePostfach() {
  const offen = daten.freigaben.filter((f) => f.status === "offen");
  const spaeter = daten.freigaben.filter((f) => f.status === "spaeter");
  const erledigt = daten.freigaben.filter((f) => f.status === "freigegeben" || f.status === "aendern");
  const hinweis = mitGithub() ? "" :
    `<p class="karte leise">Ohne GitHub-Schlüssel (⚙) wird deine Antwort als Text zum Kopieren erzeugt.</p>`;
  $("#ansicht-postfach").innerHTML = `
    <h2>Wartet auf Lukas</h2>${hinweis}
    ${offen.length ? offen.map((f) => postfachKarte(f, true)).join("") : `<p class="leer">Nichts offen.</p>`}
    <details><summary>Später (${spaeter.length})</summary>${spaeter.map((f) => postfachKarte(f, true)).join("")}</details>
    <details><summary>Erledigt (${erledigt.length})</summary>${erledigt.map((f) => postfachKarte(f, false)).join("")}</details>`;
  const zaehler = $("#zaehler");
  zaehler.textContent = offen.length;
  zaehler.hidden = offen.length === 0;
}

function frageAenderung(freigabe) {
  $("#blatt-inhalt").innerHTML = `
    <h2>Ändern: ${esc(freigabe.titel)}</h2>
    <p>Was soll anders sein?</p>
    <textarea id="aenderung-text"></textarea>
    <div class="knoepfe"><button class="knopf-haupt" id="aenderung-senden">Senden</button></div>`;
  oeffneBlatt();
  $("#aenderung-senden").onclick = () => {
    const text = $("#aenderung-text").value.trim();
    if (!text) return zeigeMeldung("Bitte kurz schreiben, was anders sein soll.");
    schliesseBlatt();
    beantworte(freigabe.id, "aendern", text);
  };
}

async function beantworte(id, status, text = "") {
  const freigabe = daten.freigaben.find((f) => f.id === id);
  if (!mitGithub()) {
    const zeilen = [`Antwort von Lukas (Raft 3D), ${heute()}:`, `${freigabe.titel} (${id}): ${ANTWORT_TEXT[status]}`];
    if (text) zeilen.push(`Änderung: ${text}`);
    return zeigeKopiertext(zeilen.join("\n"));
  }
  // Frisch laden, damit nichts überschrieben wird, was ein Agent inzwischen geändert hat.
  for (let versuch = 0; versuch < 2; versuch++) {
    try {
      const { text: roh, sha } = await holeAusGithub("buero/daten.json");
      const frisch = JSON.parse(roh);
      const ziel = frisch.freigaben.find((f) => f.id === id);
      if (!ziel) throw new Error("Eintrag nicht mehr da");
      ziel.status = status;
      ziel.antwort = text;
      ziel.entschieden = heute();
      const neuerSha = await schreibeNachGithub("buero/daten.json", JSON.stringify(frisch, null, 2) + "\n", sha,
        `Büro: Lukas – ${ANTWORT_TEXT[status]}: ${ziel.titel}`);
      daten = frisch;
      dateiSha = neuerSha;
      zeigeAlles();
      return zeigeMeldung(`Gespeichert: ${ANTWORT_TEXT[status]}`);
    } catch (fehler) {
      if (fehler.status === 409 && versuch === 0) continue;
      return zeigeMeldung(`Speichern ging nicht: ${fehler.message}`);
    }
  }
}

function zeigeKopiertext(text) {
  $("#blatt-inhalt").innerHTML = `
    <h2>Antwort kopieren</h2>
    <p>Kein GitHub-Schlüssel eingerichtet. Diesen Text in den Chat einfügen:</p>
    <textarea id="kopier-text" readonly>${esc(text)}</textarea>
    <div class="knoepfe"><button class="knopf-haupt" id="kopier-knopf">Kopieren</button></div>`;
  oeffneBlatt();
  $("#kopier-knopf").onclick = () => kopiere(text);
}

// ---------- Aufgaben ----------
function zeigeAufgaben() {
  const teile = [`<h2>Aufgabenpakete</h2>`];
  for (const [stufe, titel] of STUFEN) {
    const pakete = daten.pakete.filter((p) => p.stufe === stufe);
    teile.push(`<div class="stufe-kopf"><h3>${titel}</h3><span class="anzahl">${pakete.length}</span></div>`);
    if (!pakete.length) teile.push(`<p class="leer">leer</p>`);
    for (const p of pakete) {
      const agent = daten.agents.find((a) => a.id === p.agent);
      teile.push(`
        <div class="karte" data-paket="${esc(p.id)}">
          <div class="name">${esc(p.id)} · ${esc(p.titel)}</div>
          ${agent ? `<div class="leise">bei ${esc(agent.name)}</div>` : ""}
          ${p.fertigWenn ? `<div class="aufgabe">Fertig, wenn: ${esc(p.fertigWenn)}</div>` : ""}
        </div>`);
    }
  }
  $("#ansicht-aufgaben").innerHTML = teile.join("");
}

// ---------- Projektdatei ----------
function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function markdownNachHtml(md) {
  const aus = [];
  let liste = null;
  let tabelle = null;
  const schliessen = () => {
    if (liste) { aus.push(`<${liste}>`.replace("<", "</")); liste = null; }
    if (tabelle) { aus.push("</table>"); tabelle = null; }
  };
  for (const zeile of md.split("\n")) {
    const z = zeile.trimEnd();
    let m;
    if ((m = z.match(/^(#{1,4})\s+(.*)/))) {
      schliessen();
      const ebene = Math.min(m[1].length + 1, 4);
      aus.push(`<h${ebene}>${inline(m[2])}</h${ebene}>`);
    } else if ((m = z.match(/^\s*[-*]\s+(.*)/)) || (m = z.match(/^\s*\d+\.\s+(.*)/))) {
      const art = /^\s*\d+\./.test(z) ? "ol" : "ul";
      if (liste !== art) { schliessen(); aus.push(`<${art}>`); liste = art; }
      aus.push(`<li>${inline(m[1])}</li>`);
    } else if (z.startsWith("|")) {
      if (/^\|[\s|:-]+\|$/.test(z)) continue;
      if (!tabelle) { schliessen(); aus.push("<table>"); tabelle = true; }
      const zellen = z.slice(1, -1).split("|").map((c) => `<td>${inline(c.trim())}</td>`).join("");
      aus.push(`<tr>${zellen}</tr>`);
    } else if (!z.trim()) {
      schliessen();
    } else {
      schliessen();
      aus.push(`<p>${inline(z)}</p>`);
    }
  }
  schliessen();
  return aus.join("\n");
}
async function zeigeProjekt() {
  const ziel = $("#ansicht-projekt");
  try {
    ziel.innerHTML = `<div class="projekt">${markdownNachHtml(await ladeProjektdatei())}</div>`;
  } catch (fehler) {
    ziel.innerHTML = `<p class="karte">Projektdatei konnte nicht geladen werden: ${esc(fehler.message)}</p>`;
  }
}

// ---------- Einstellungen ----------
function zeigeEinstellungen() {
  const e = einstellungen();
  $("#blatt-inhalt").innerHTML = `
    <h2>Einstellungen</h2>
    <p class="leise">Mit einem GitHub-Schlüssel schreibt das Büro deine Antworten direkt in <code>buero/daten.json</code>.
    Der Schlüssel bleibt nur auf diesem Gerät. Nimm einen „Fine-grained token“ nur für dieses Repo mit „Contents: Read and write“.</p>
    <label>GitHub-Schlüssel<input type="password" id="e-schluessel" value="${esc(e.schluessel)}" autocomplete="off"></label>
    <label>Besitzer<input type="text" id="e-besitzer" value="${esc(e.besitzer)}" autocapitalize="off"></label>
    <label>Repo<input type="text" id="e-repo" value="${esc(e.repo)}" autocapitalize="off"></label>
    <label>Zweig<input type="text" id="e-zweig" value="${esc(e.zweig)}" autocapitalize="off"></label>
    <div class="knoepfe"><button class="knopf-haupt" id="e-speichern">Speichern</button></div>
    <div class="knoepfe"><button id="e-loeschen">Schlüssel löschen</button></div>`;
  oeffneBlatt();
  $("#e-speichern").onclick = () => {
    speichereEinstellungen({
      schluessel: $("#e-schluessel").value.trim(),
      besitzer: $("#e-besitzer").value.trim() || STANDARD_EINSTELLUNGEN.besitzer,
      repo: $("#e-repo").value.trim() || STANDARD_EINSTELLUNGEN.repo,
      zweig: $("#e-zweig").value.trim() || STANDARD_EINSTELLUNGEN.zweig,
    });
    schliesseBlatt();
    starte();
  };
  $("#e-loeschen").onclick = () => {
    speichereEinstellungen({ ...einstellungen(), schluessel: "" });
    schliesseBlatt();
    starte();
  };
}

// ---------- Blatt und Navigation ----------
function oeffneBlatt() { $("#blatt").hidden = false; }
function schliesseBlatt() { $("#blatt").hidden = true; }

function wechsleAnsicht(name) {
  document.querySelectorAll(".ansicht").forEach((s) => s.classList.toggle("aktiv", s.id === `ansicht-${name}`));
  document.querySelectorAll(".leiste button").forEach((b) => b.classList.toggle("aktiv", b.dataset.ansicht === name));
  if (name === "projekt") zeigeProjekt();
  window.scrollTo(0, 0);
}

function zeigeAlles() {
  $("#stand").textContent = `Stand ${daten.stand}${mitGithub() ? " · GitHub verbunden" : ""}`;
  zeigeTeam();
  zeigePostfach();
  zeigeAufgaben();
}

document.addEventListener("click", (ereignis) => {
  const ziel = ereignis.target;
  const reiter = ziel.closest(".leiste button");
  if (reiter) return wechsleAnsicht(reiter.dataset.ansicht);
  const agent = ziel.closest("[data-agent]");
  if (agent) return zeigeAgentKarte(agent.dataset.agent);
  const aktion = ziel.closest("[data-aktion]");
  if (aktion) {
    const id = aktion.closest("[data-freigabe]").dataset.freigabe;
    const freigabe = daten.freigaben.find((f) => f.id === id);
    if (aktion.dataset.aktion === "aendern") return frageAenderung(freigabe);
    return beantworte(id, aktion.dataset.aktion);
  }
  if (ziel.closest(".schliessen") || ziel.id === "blatt") return schliesseBlatt();
  if (ziel.closest("#knopf-einstellungen")) return zeigeEinstellungen();
});

async function starte() {
  try {
    daten = await ladeDaten();
    zeigeAlles();
    if ($("#ansicht-projekt").classList.contains("aktiv")) zeigeProjekt();
  } catch (fehler) {
    $("#stand").textContent = "Fehler beim Laden";
    $("#ansicht-team").innerHTML = `<p class="karte">Daten konnten nicht geladen werden: ${esc(fehler.message)}</p>`;
  }
}

// Beim Zurückkehren in den Tab neu laden, damit Änderungen der Agents sichtbar werden.
document.addEventListener("visibilitychange", () => { if (!document.hidden) starte(); });
starte();
