// Lädt den Teil der Probeseite, den der Test braucht (?teil=joystick → teil-joystick.js). Nur für Tests.
const teil = new URLSearchParams(location.search).get('teil') || '';
if (!/^[a-z]+$/.test(teil)) throw new Error(`Unbekannter Teil: ${teil}`);
await import(`./teil-${teil}.js`);
