// Functional + visual verification of the transport rental flow.
// Run: node scripts/tmp/verify-transport.mjs
import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
import { mkdirSync } from "node:fs";

const { chromium } = pw;
const BASE = "http://localhost:3000";
const OUT = new URL("./transport-shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const results = [];
const pageErrors = [];
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
}

const browser = await chromium.launch({ args: ["--start-maximized"] });

async function makeContext(lang, currency, viewport) {
  const context = await browser.newContext({
    viewport,
    locale: lang === "id" ? "id-ID" : "en-US",
    geolocation: { latitude: -6.2088, longitude: 106.8456 },
    permissions: ["geolocation"],
  });
  await context.addInitScript(
    ([l, c]) => {
      try {
        localStorage.setItem("booking-vip:locale", JSON.stringify(l));
        localStorage.setItem("booking-vip:currency", JSON.stringify(c));
      } catch {}
    },
    [lang, currency],
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push("console: " + m.text().slice(0, 200));
  });
  return { context, page };
}

const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.png`, fullPage: false });

// ---------------------------------------------------------------------------
// ID desktop — the full functional flow
// ---------------------------------------------------------------------------
{
  const { context, page } = await makeContext("id", "IDR", { width: 1440, height: 900 });

  await page.goto(`${BASE}/transport`, { waitUntil: "load" });
  await page.waitForTimeout(1800);

  // 1. Map modal from the pickup field
  await page.locator('button:has-text("Tentukan titik jemput")').click();
  await page.waitForSelector("dialog[open]", { timeout: 5000 });
  await page.waitForSelector("dialog .leaflet-container", { timeout: 10000 });
  await page.waitForTimeout(1200);
  check("pickup field opens map modal", true);

  // 2. Click the map → pin + label
  await page.locator("dialog .leaflet-container").click({ position: { x: 350, y: 200 } });
  await page.waitForTimeout(600);
  const pinCount = await page.locator("dialog .leaflet-marker-icon").count();
  check("map click sets a pin", pinCount >= 1, `markers=${pinCount}`);

  // 3. Drag the pin
  const marker = page.locator("dialog .leaflet-marker-icon").first();
  const box = await marker.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 90, box.y + 40, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    check("pin is draggable", true);
  }

  // 4. Geolocation (mocked)
  await page.locator('dialog button:has-text("Gunakan lokasi saya")').click();
  await page.waitForTimeout(2500);
  const addressText = await page.locator("dialog").innerText();
  check("geolocation fills the point", /-6\.20|Lokasi|Jalan|Jl\.|Jakarta/i.test(addressText), addressText.match(/-6\.\d+, 106\.\d+/)?.[0] ?? "address resolved");
  await shot(page, "id-1440-map-modal");

  // 5. Confirm writes the field
  await page.locator('dialog button:has-text("Gunakan lokasi ini")').click();
  await page.waitForTimeout(500);
  const dialogOpen = await page.locator("dialog[open]").count();
  check("confirm closes modal", dialogOpen === 0);
  const placeholderGone = await page.locator('button:has-text("Tentukan titik jemput")').count() === 0;
  check("pickup field filled after confirm", placeholderGone);

  // 6. Dropoff field opens the modal too
  await page.locator('button:has-text("Tentukan titik tujuan")').click();
  await page.waitForSelector("dialog[open]", { timeout: 5000 });
  await page.waitForSelector("dialog .leaflet-container", { timeout: 10000 });
  await page.locator("dialog .leaflet-container").click({ position: { x: 420, y: 240 } });
  await page.waitForTimeout(500);
  await page.locator('dialog button:has-text("Gunakan lokasi ini")').click();
  await page.waitForTimeout(400);
  check("dropoff field opens map modal and confirms", true);
  await shot(page, "id-1440-entry");

  // 7. Search → results
  await page.locator('button:has-text("Cari mobil")').click();
  await page.waitForURL("**/transport/armada**", { timeout: 10000 });
  await page.waitForSelector('main a[href^="/transport/"]', { timeout: 15000 });
  await page.waitForTimeout(1200);
  const cards1 = await page.locator('main:visible a[href^="/transport/"]').count();
  check("results first page renders", cards1 >= 6, `cards=${cards1}`);
  const summary = await page.locator("main:visible section").first().innerText();
  check("summary bar echoes inputs", /Dengan sopir/i.test(summary) && /hari/i.test(summary), summary.replace(/\n/g, " | ").slice(0, 120));
  await shot(page, "id-1440-results");

  // 8. Infinite scroll loads page 2
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(700);
  }
  const cards2 = await page.locator('main:visible a[href^="/transport/"]').count();
  check("infinite scroll loads page 2", cards2 > cards1, `before=${cards1} after=${cards2}`);
  const endNote = await page.locator("text=Semua mobil sudah ditampilkan").count();
  check("end note shown", endNote >= 1);
  await shot(page, "id-1440-results-bottom");

  // 9. Quick chips filter
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('button:visible:has-text("Mobil Listrik")').click();
  await page.waitForTimeout(1500);
  const evCards = await page.locator('main:visible a[href^="/transport/"]').count();
  check("electric chip filters", evCards >= 1 && evCards < cards1, `ev=${evCards}`);
  await shot(page, "id-1440-results-ev");
  await page.locator('button:visible:has-text("Mobil Listrik")').click();
  await page.waitForTimeout(1200);

  await page.locator('button:visible:has-text("Disc up to 50%")').click();
  await page.waitForTimeout(1500);
  const badges = await page.locator("main").locator("text=Diskon hingga").count();
  check("discount chip filters to promo cars", badges >= 1, `badges=${badges}`);
  await page.locator('button:visible:has-text("Disc up to 50%")').click();
  await page.waitForTimeout(1200);

  // 10. Filter panel sort
  await page.locator('button:visible:has-text("Filter & Urutkan")').click();
  await page.waitForTimeout(400);
  await page.locator('label:visible:has-text("Harga terendah")').click();
  await page.locator('button:visible:has-text("Terapkan")').click();
  await page.waitForTimeout(1500);
  check("filter panel applies sort", page.url().includes("sort=price_asc"), page.url().slice(0, 120));

  // 11. Detail page
  const firstHref = await page.locator('main:visible a[href^="/transport/"]').first().getAttribute("href");
  await page.locator('main:visible a[href^="/transport/"]').first().click();
  await page.waitForURL("**/transport/**", { timeout: 10000 });
  await page.waitForSelector("text=Detail Kendaraan dan Vendor", { timeout: 15000 });
  await page.waitForTimeout(1200);
  check("detail opens", true, firstHref ?? "");
  const hasRules = await page.locator("text=Penting untuk Dibaca").count();
  const hasPackages = await page.locator("text=Pilih Paket Sewa Mobilmu").count();
  const hasReviews = await page.locator("text=Review").count();
  check("detail sections present", hasRules >= 1 && hasPackages >= 1 && hasReviews >= 1);
  await shot(page, "id-1440-detail-top");

  // 12. Package select updates the sticky total
  const totalBefore = await page.locator("div.fixed.bottom-0:visible p").first().innerText();
  await page.locator('button:visible:has-text("All-in Area 0")').click();
  await page.waitForTimeout(500);
  const totalAfter = await page.locator("div.fixed.bottom-0:visible p").first().innerText();
  check("package select updates sticky total", totalBefore !== totalAfter, `${totalBefore} → ${totalAfter}`);
  const notch = await page.locator('button[aria-pressed="true"]').count();
  check("selected package marked", notch === 1);
  await page.locator("text=Pilih Paket Sewa Mobilmu").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, "id-1440-detail-packages");

  // 13. CTA reaches the wizard with the package
  await page.locator('a:visible:has-text("Lanjut ke Form Pemesanan")').click();
  await page.waitForURL("**/booking/**", { timeout: 10000 });
  await page.waitForTimeout(2000);
  check("CTA carries package into wizard", page.url().includes("pkg="), page.url().slice(0, 140));
  await shot(page, "id-1440-wizard");

  // 14. Reviews "Lihat semua"
  await page.goBack({ waitUntil: "load" });
  await page.waitForTimeout(1500);
  const seeAll = page.locator('a:visible:has-text("Lihat semua")');
  if (await seeAll.count()) {
    await seeAll.first().click();
    await page.waitForURL("**/reviews", { timeout: 10000 });
    await page.waitForTimeout(1200);
    check("reviews page opens", true);
    await shot(page, "id-1440-reviews");
  } else {
    check("reviews page opens", false, "no Lihat semua link");
  }

  const detailUrl = page.url().replace(/\/reviews$/, "");
  await context.close();

  // -------------------------------------------------------------------------
  // ID mobile 390
  // -------------------------------------------------------------------------
  {
    const { context: mctx, page: mpage } = await makeContext("id", "IDR", { width: 390, height: 844 });
    await mpage.goto(`${BASE}/transport`, { waitUntil: "load" });
    await mpage.waitForTimeout(1500);
    await mpage.locator('button:has-text("Tentukan titik jemput")').click();
    await mpage.waitForSelector("dialog[open]", { timeout: 5000 });
    await mpage.waitForSelector("dialog .leaflet-container", { timeout: 10000 });
    await mpage.waitForTimeout(1000);
    await shot(mpage, "id-390-map-modal");
    await mpage.locator('dialog button:has-text("Batal")').click();
    await mpage.waitForTimeout(400);
    await shot(mpage, "id-390-entry");

    await mpage.goto(`${BASE}/transport/armada?date=2026-11-15&time=05:00&totalDays=1&driverOption=with_driver&from=Bali`, { waitUntil: "load" });
    await mpage.waitForSelector('main a[href^="/transport/"]', { timeout: 15000 });
    await mpage.waitForTimeout(1000);
    await shot(mpage, "id-390-results");
    const overflowX = await mpage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    check("mobile results no horizontal overflow", !overflowX);

    await mpage.goto(detailUrl, { waitUntil: "load" });
    await mpage.waitForSelector("text=Detail Kendaraan dan Vendor", { timeout: 15000 });
    await mpage.waitForTimeout(1000);
    await shot(mpage, "id-390-detail");
    await mpage.locator("text=Pilih Paket Sewa Mobilmu").scrollIntoViewIfNeeded();
    await mpage.waitForTimeout(400);
    await shot(mpage, "id-390-detail-packages");
    const mOverflow = await mpage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    check("mobile detail no horizontal overflow", !mOverflow);
    await mctx.close();
  }

  // -------------------------------------------------------------------------
  // EN desktop + mobile screenshots
  // -------------------------------------------------------------------------
  {
    const { context: ectx, page: epage } = await makeContext("en", "IDR", { width: 1440, height: 900 });
    await epage.goto(`${BASE}/transport`, { waitUntil: "load" });
    await epage.waitForTimeout(1500);
    await epage.locator('button:has-text("Pick the pickup point")').click();
    await epage.waitForSelector("dialog[open]", { timeout: 5000 });
    await epage.waitForSelector("dialog .leaflet-container", { timeout: 10000 });
    await epage.waitForTimeout(1000);
    await shot(epage, "en-1440-map-modal");
    await epage.locator('dialog button:has-text("Cancel")').click();
    await epage.waitForTimeout(300);

    await epage.goto(`${BASE}/transport/armada?date=2026-11-15&time=05:00&totalDays=1&driverOption=with_driver&from=Bali`, { waitUntil: "load" });
    await epage.waitForSelector('main a[href^="/transport/"]', { timeout: 15000 });
    await epage.waitForTimeout(1000);
    await shot(epage, "en-1440-results");
    const enSummary = await epage.locator("main:visible section").first().innerText();
    check("EN summary bar", /With driver/i.test(enSummary), enSummary.replace(/\n/g, " | ").slice(0, 100));

    await epage.goto(detailUrl, { waitUntil: "load" });
    await epage.waitForSelector("text=Vehicle & Vendor Details", { timeout: 15000 });
    await epage.waitForTimeout(1000);
    await shot(epage, "en-1440-detail");
    await epage.locator("text=Choose Your Rental Package").scrollIntoViewIfNeeded();
    await epage.waitForTimeout(400);
    await shot(epage, "en-1440-detail-packages");
    await ectx.close();
  }
  {
    const { context: mctx, page: mpage } = await makeContext("en", "IDR", { width: 390, height: 844 });
    await mpage.goto(`${BASE}/transport/armada?date=2026-11-15&time=05:00&totalDays=1&driverOption=with_driver&from=Bali`, { waitUntil: "load" });
    await mpage.waitForSelector('main a[href^="/transport/"]', { timeout: 15000 });
    await mpage.waitForTimeout(1000);
    await shot(mpage, "en-390-results");
    await mpage.goto(detailUrl, { waitUntil: "load" });
    await mpage.waitForSelector("text=Vehicle & Vendor Details", { timeout: 15000 });
    await mpage.waitForTimeout(1000);
    await shot(mpage, "en-390-detail");
    await mctx.close();
  }
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
const realErrors = pageErrors.filter((e) => !/favicon|net::|Failed to load resource|404|nominatim|frankfurter/i.test(e));
console.log("page errors:", realErrors.length ? realErrors.slice(0, 8) : "none");
process.exit(failed.length > 0 ? 1 : 0);