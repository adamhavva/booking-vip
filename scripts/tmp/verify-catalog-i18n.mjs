// Visual + console verification of the catalog ID/EN locale switch.
// Desktop shots are fullscreen (per the user's standing Playwright rule);
// the 390px mobile shot is explicitly requested by the task.
// NOTE: addInitScript re-seeds the stored locale on every navigation, so
// each freshly loaded page starts in ID; EN is exercised via the UI toggle.
import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
import fs from "node:fs";
const { chromium } = pw;
const SHOTS = "/tmp/i18n-shots";
fs.mkdirSync(SHOTS, { recursive: true });

const problems = [];
function watch(page, tag) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      problems.push(`[${tag}][console.${msg.type()}] ${msg.text().slice(0, 300)}`);
    }
  });
  page.on("pageerror", (e) => problems.push(`[${tag}][pageerror] ${String(e).slice(0, 300)}`));
}

const results = [];
function check(name, ok, detail = "") {
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

async function setLocale(page, lang) {
  const trigger = page.locator('button[aria-haspopup="menu"]', { hasText: /\|/ }).first();
  await trigger.click();
  await page.getByRole("menuitemradio", { name: lang === "id" ? "Indonesia" : "English" }).click();
  await page.waitForTimeout(700);
}

const browser = await chromium.launch();

// ---------- Desktop, ID-preferring visitor (locale + IDR currency stored) ----------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "id-ID" });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("booking-vip:locale", JSON.stringify("id"));
    localStorage.setItem("booking-vip:currency", JSON.stringify("IDR"));
    localStorage.setItem("booking-vip:last-search", JSON.stringify({
      service: "Airport VIP Service", href: "/vip-service", values: {},
    }));
  } catch {}
});
const page = await ctx.newPage();
watch(page, "desktop");
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.clearDeviceMetricsOverride");
const { windowId } = await cdp.send("Browser.getWindowForTarget");
await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "fullscreen" } });

await page.goto("http://localhost:3000/", { waitUntil: "load" });
await page.waitForTimeout(5000);
let text = await page.locator("body").innerText();
check("home ID: section title", text.includes("Penawaran spesial"));
check("home ID: tour product title", text.includes("Jelajah Bali"));
check("home ID: VIP product title", text.includes("Fast Track Imigrasi"));
check("home ID: duration unit", text.includes("3H2M"));
check("home ID: resume strip label", text.includes("Layanan VIP Bandara"));
check("home ID: IDR price", text.includes("Rp"));
check("home ID: no EN section title", !text.includes("Special deals"));
await page.screenshot({ path: `${SHOTS}/home-id.png` });

// Toggle to EN via the header menu (same document).
await setLocale(page, "en");
text = await page.locator("body").innerText();
check("home EN after toggle: section title", text.includes("Special deals"));
check("home EN after toggle: tour product title", text.includes("Bali Highlights"));
check("home EN after toggle: VIP product title", text.includes("Fast Track Immigration"));
check("home EN after toggle: duration unit", text.includes("3D2N"));
check("home EN after toggle: resume strip label", text.includes("Airport VIP Service"));
await page.screenshot({ path: `${SHOTS}/home-en.png` });

// ---------- Product detail (VIP) — loads in ID, toggle to EN ----------
await page.goto("http://localhost:3000/vip-service/fast-track-immigration", { waitUntil: "load" });
await page.waitForSelector("h1", { timeout: 90000 });
await page.waitForTimeout(1200);
text = await page.locator("body").innerText();
check("detail ID: title", text.includes("Fast Track Imigrasi"));
check("detail ID: description", text.includes("Lewati antrean di imigrasi dan bea cukai."));
check("detail ID: breadcrumb line label", text.includes("Layanan VIP Bandara"));
check("detail ID: add-on label", text.includes("Bantuan Pendaftaran eVOA"));
await page.screenshot({ path: `${SHOTS}/product-vip-id.png` });
await setLocale(page, "en");
text = await page.locator("body").innerText();
check("detail EN after toggle: title", text.includes("Fast Track Immigration"));
check("detail EN after toggle: description", text.includes("Skip the queues at immigration and customs."));
check("detail EN after toggle: add-on label", text.includes("eVOA Registration Assistance"));
await page.screenshot({ path: `${SHOTS}/product-vip-en.png` });

// ---------- Product detail (tour) ----------
await page.goto("http://localhost:3000/tour-package/bali-highlights", { waitUntil: "load" });
await page.waitForSelector("h1", { timeout: 90000 });
await page.waitForTimeout(1200);
text = await page.locator("body").innerText();
check("tour ID: title", text.includes("Jelajah Bali"));
check("tour ID: duration", text.includes("3H2M"));
check("tour ID: description", text.includes("Bali · 3H2M"));
check("tour ID: ribbon", text.includes("Terlaris"));
await page.screenshot({ path: `${SHOTS}/product-tour-id.png` });

// ---------- Product detail (eVOA) ----------
await page.goto("http://localhost:3000/evoa/tourist-evoa", { waitUntil: "load" });
await page.waitForSelector("h1", { timeout: 90000 });
await page.waitForTimeout(1200);
text = await page.locator("body").innerText();
check("evoa ID: title", text.includes("eVOA Turis"));
check("evoa ID: description", text.includes("30 hari · proses 24 jam"));
check("evoa ID: duration label", text.includes("30 hari"));
await page.screenshot({ path: `${SHOTS}/product-evoa-id.png` });
await ctx.close();

// ---------- Mobile 390 (explicitly requested) ----------
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "id-ID",
});
await mctx.addInitScript(() => {
  try { localStorage.setItem("booking-vip:locale", JSON.stringify("id")); } catch {}
});
const mpage = await mctx.newPage();
watch(mpage, "mobile");
await mpage.goto("http://localhost:3000/", { waitUntil: "load" });
await mpage.waitForTimeout(5000);
text = await mpage.locator("body").innerText();
check("mobile home ID: tour title", text.includes("Jelajah Bali"));
check("mobile home ID: section title", text.includes("Penawaran spesial"));
await mpage.screenshot({ path: `${SHOTS}/mobile-home-id.png` });
await mpage.goto("http://localhost:3000/vip-service/fast-track-immigration", { waitUntil: "load" });
await mpage.waitForSelector("h1", { timeout: 90000 });
await mpage.waitForTimeout(1200);
text = await mpage.locator("body").innerText();
check("mobile detail ID: title", text.includes("Fast Track Imigrasi"));
await mpage.screenshot({ path: `${SHOTS}/mobile-product-id.png` });
await mctx.close();

await browser.close();

console.log(results.join("\n"));
const hydration = problems.filter((p) => /hydrat/i.test(p));
console.log(`\nconsole/page problems: ${problems.length} (hydration: ${hydration.length})`);
for (const p of problems) console.log(" -", p.replace(/\n/g, " "));
console.log("\nshots:", fs.readdirSync(SHOTS).join(", "));
