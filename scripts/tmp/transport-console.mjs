// Console probe: transport detail must SSR without the dompurify error and
// hydrate cleanly (plain-text description first, sanitized HTML after mount).
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const slug = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") problems.push(m.type() + ": " + m.text());
});
await page.goto(`http://localhost:3000/transport/${slug}`, { waitUntil: "load" });
await page.waitForTimeout(2500);
const desc = await page.locator(".transport-description").first().innerHTML();
const hasHtml = /<[a-z]+[\s>]/i.test(desc);
console.log("description rendered as HTML after mount:", hasHtml);
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "CONSOLE CLEAN");
await browser.close();