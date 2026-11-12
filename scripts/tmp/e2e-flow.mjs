import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
const { chromium } = pw;
const link = process.argv[2];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "id-ID" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(link, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
console.log("after load url:", page.url());
const complete = page.getByText("COMPLETE VERIFICATION");
if (await complete.count()) { await complete.first().click(); await page.waitForTimeout(6000); }
console.log("after complete url:", page.url());
console.log("text:", (await page.locator("body").innerText()).slice(0, 300).replace(/\n/g, " | "));
const cont = page.getByText("CONTINUE");
if (await cont.count()) { await cont.first().click(); await page.waitForTimeout(6000); }
console.log("after continue url:", page.url());
console.log("text2:", (await page.locator("body").innerText()).slice(0, 300).replace(/\n/g, " | "));
console.log("errors:", errors.slice(0,3));
await browser.close();
