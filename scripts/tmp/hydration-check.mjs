// Hydration check for the home page with a stored locale preference.
// Usage: node scripts/tmp/hydration-check.mjs [id|en]
import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
const { chromium } = pw;
const lang = process.argv[2] ?? "id";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((l) => {
  try { localStorage.setItem("booking-vip:locale", JSON.stringify(l)); } catch {}
}, lang);
const page = await context.newPage();
const problems = [];
page.on("console", (msg) => {
  const text = msg.text();
  if (msg.type() === "error" || msg.type() === "warning") {
    problems.push(`[console.${msg.type()}] ${text.slice(0, 2000)}`);
  }
});
page.on("pageerror", (e) => problems.push(`[pageerror] ${String(e).slice(0, 2000)}`));
await page.goto("http://localhost:3000/", { waitUntil: "load" });
await page.waitForTimeout(5000);
console.log(`lang=${lang} url=${page.url()}`);
console.log("problems:", problems.length);
for (const p of problems) console.log(" -", p.replace(/\n/g, " "));
await browser.close();
