import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
const { chromium } = pw;
const log = (...a) => console.log("[e2e-verify-link]", ...a);
const actionUrl = process.argv[2];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "id-ID" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(actionUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const btn = page.getByText("COMPLETE VERIFICATION");
if (await btn.count()) {
  await btn.first().click();
  await page.waitForTimeout(6000);
}
log("final url:", page.url());
log("text:", (await page.locator("body").innerText()).slice(0, 300).replace(/\n/g, " | "));
log("errors:", errors.slice(0, 3));
await browser.close();
