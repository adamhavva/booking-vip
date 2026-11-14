// Verification of the stacked-discount ("diskon akumulasi") admin feature.
// Run: node scripts/tmp/verify-discount.mjs
import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const { chromium } = pw;
const BASE = "http://localhost:3000";
const SHOTS = "scripts/tmp/shots";
fs.mkdirSync(SHOTS, { recursive: true });

// Sign-in: no admin password is stored in the repo, so we issue a session
// cookie for the EXISTING ADMIN account (admin@vip.com, role ADMIN in the
// local DB) with the project's own Firebase server credentials — the same
// mechanism `signInAdmin` uses. No account is created or modified.
const env = {};
for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}
const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
const auth = getAuth(app);
const ADMIN_UID = "QyBuaTRSz3cBFNBovUVX0KDq8Nk1"; // admin@vip.com (User.role = ADMIN)
const customToken = await auth.createCustomToken(ADMIN_UID);
const signInRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${env.FIREBASE_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  },
).then((r) => r.json());
if (!signInRes.idToken) throw new Error(`custom-token sign-in failed: ${JSON.stringify(signInRes)}`);
const sessionCookie = await auth.createSessionCookie(signInRes.idToken, {
  expiresIn: 8 * 3600 * 1000,
});

let failures = 0;
function check(cond, msg) {
  if (cond) console.log("  ok:", msg);
  else {
    failures++;
    console.error("  FAIL:", msg);
  }
}

async function api() {
  const res = await fetch(`${BASE}/api/promo-check`);
  return res.json();
}

const browser = await chromium.launch({
  headless: true,
  args: ["--start-maximized", "--window-size=1920,1080"],
});
const context = await browser.newContext({ viewport: null, locale: "en-US" });
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

// Full screen per the user's standing rule (CDP, clears viewport override).
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.clearDeviceMetricsOverride");
const { windowId } = await cdp.send("Browser.getWindowForTarget");
await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "fullscreen" } });

const vform = () => page.locator("form:visible");

const shot = async (name) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
  console.log("  shot:", `${SHOTS}/${name}.png`);
};

// ---- 1. sign in -----------------------------------------------------------
console.log("1. sign in as the existing ADMIN account (session cookie)");
await context.addCookies([
  {
    name: "admin_session",
    value: sessionCookie,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  },
]);
await page.goto(`${BASE}/admin`, { waitUntil: "load" });
await page.waitForURL(`${BASE}/admin`, { timeout: 30000 });
check(page.url() === `${BASE}/admin`, "admin session accepted, landed on /admin");

// ---- 2. list page ---------------------------------------------------------
console.log("2. open the Diskon Akumulasi tab");
await page.goto(`${BASE}/admin/catalog/discount-campaigns`, { waitUntil: "load" });
// A concurrent `npm run db:seed` can wipe the unregistered Setting key — if
// the demo campaign is gone, recreate it through the UI (same key slug).
if (!(await page.locator("tr", { hasText: "Diskon Akumulasi VIP" }).count())) {
  console.log("2a. demo campaign missing — recreating it via the UI");
  await page.getByRole("link", { name: "Add campaign" }).click();
  await page.waitForURL("**/discount-campaigns/new");
  await vform().locator('input[id$="-name"]').fill("Diskon Akumulasi VIP");
  await vform().locator('select[id$="-lineSlug"]').selectOption("vip-service");
  await vform().locator("label", { hasText: "Baggage & Porter Assistance" }).locator("input").check();
  await vform().locator("label", { hasText: "Family VIP Package" }).locator("input").check();
  await vform().getByRole("button", { name: "Simpan", exact: true }).click();
  await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
  await page.reload({ waitUntil: "load" });
}
await page.getByText("Diskon Akumulasi VIP").first().waitFor();
check(await page.getByRole("link", { name: "Add campaign" }).count() === 1, "create button present (en)");
await shot("01-list-desktop");

// ---- 2b. clean up leftovers from a previous partial run --------------------
for (const name of ["TEST Akumulasi Rename", "TEST Akumulasi"]) {
  const row = page.locator("tr", { hasText: name });
  if (await row.count()) {
    console.log("2b. removing leftover campaign:", name);
    await row.getByRole("button", { name: "Hapus" }).click();
    const d = page.getByRole("dialog");
    await d.waitFor();
    await d.getByPlaceholder("Enter the exact name").fill(name);
    await d.getByRole("button", { name: "Delete Permanently" }).click();
    await page.waitForTimeout(1500);
  }
}
// the seeded campaign must start active for the expected averages below
{
  const seeded = page.locator("tr", { hasText: "Diskon Akumulasi VIP" });
  if ((await seeded.innerText()).includes("Inactive")) {
    console.log("2b. reactivating the seeded campaign");
    await seeded.getByRole("link", { name: "Edit campaign" }).click();
    await page.waitForURL("**/discount-campaigns/diskon-akumulasi-vip");
    await vform().locator('input[id$="-active"]').check();
    await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
    await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
    await page.reload({ waitUntil: "load" });
  }
}

// ---- 3. create campaign: 50% + 60% = 55% ----------------------------------
console.log("3. create campaign with the 50% and 60% test products");
await page.getByRole("link", { name: "Add campaign" }).click();
await page.waitForURL("**/discount-campaigns/new");
await vform().locator('input[id$="-name"]').fill("TEST Akumulasi");
await vform().locator('select[id$="-lineSlug"]').selectOption("vip-service");
await vform().locator("label", { hasText: "TEST Diskon 50" }).locator("input").check();
await vform().locator("label", { hasText: "TEST Diskon 60" }).locator("input").check();
await page.waitForTimeout(300);
const preview = vform().getByTestId("campaign-preview-percent");
check((await preview.innerText()) === "55%", `live preview shows 55% (got "${await preview.innerText()}")`);
const previewText = (await preview.locator("xpath=..").innerText()).replace(/\s+/g, " ");
check(previewText.includes("(50% + 60%) / 2 = 55%"), `preview shows the averaged math: ${previewText.replace(/\n/g, " | ")}`);
check(!previewText.includes("110%"), "preview never shows 110%");
await shot("02-form-desktop");
await vform().getByRole("button", { name: "Simpan", exact: true }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads
const testRow = page.locator("tr", { hasText: "TEST Akumulasi" });
await testRow.waitFor();
check((await testRow.innerText()).includes("55%"), "list row shows 55%");
check(!(await testRow.innerText()).includes("110%"), "list never shows 110%");
await shot("03-list-with-campaign");

// ---- 4. public reader -----------------------------------------------------
console.log("4. getCampaignDiscounts (both campaigns active: (0+0+50+60)/4 = 27.5 -> 28)");
let discounts = await api();
check(discounts["vip-service"] === 28, `vip-service = 28 with both campaigns active (got ${JSON.stringify(discounts)})`);

// ---- 5. deactivate the seeded campaign → only 50+60 remain → 55 -----------
console.log("5. edit the seeded campaign: active off");
const seededRow = page.locator("tr", { hasText: "Diskon Akumulasi VIP" });
await seededRow.getByRole("link", { name: "Edit campaign" }).click();
await page.waitForURL("**/discount-campaigns/diskon-akumulasi-vip");
await vform().locator('input[id$="-active"]').uncheck();
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads
discounts = await api();
check(discounts["vip-service"] === 55, `inactive campaign excluded → vip-service = 55 (got ${JSON.stringify(discounts)})`);

// ---- 6. add a 0% member → (50+60+0)/3 = 33 --------------------------------
console.log("6. add a third product at 0% → 33%");
await page.locator("tr", { hasText: "TEST Akumulasi" }).getByRole("link", { name: "Edit campaign" }).click();
await page.waitForURL("**/discount-campaigns/test-akumulasi");
await vform().locator("label", { hasText: "Meet & Greet" }).locator("input").check();
await page.waitForTimeout(300);
check((await preview.innerText()) === "33%", `preview recomputes to 33% (got "${await preview.innerText()}")`);
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads
check((await page.locator("tr", { hasText: "TEST Akumulasi" }).innerText()).includes("33%"), "list shows 33%");
discounts = await api();
check(discounts["vip-service"] === 33, `public reader = 33 (got ${JSON.stringify(discounts)})`);

// ---- 7. remove a member → (50+0)/2 = 25 -----------------------------------
console.log("7. remove the 60% member → 25%");
await page.locator("tr", { hasText: "TEST Akumulasi" }).getByRole("link", { name: "Edit campaign" }).click();
await page.waitForURL("**/discount-campaigns/test-akumulasi");
await vform().locator("label", { hasText: "TEST Diskon 60" }).locator("input").uncheck();
await page.waitForTimeout(300);
check((await preview.innerText()) === "25%", `preview recomputes to 25% (got "${await preview.innerText()}")`);
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads

// ---- 8. empty selection → friendly field error, no save -------------------
console.log("8. empty selection → field error");
await page.locator("tr", { hasText: "TEST Akumulasi" }).getByRole("link", { name: "Edit campaign" }).click();
await page.waitForURL("**/discount-campaigns/test-akumulasi");
await vform().locator("label", { hasText: "TEST Diskon 50" }).locator("input").uncheck();
await vform().locator("label", { hasText: "Meet & Greet" }).locator("input").uncheck();
await page.waitForTimeout(300);
check((await vform().getByText("Select products to see the averaged discount.").count()) === 1, "preview shows the empty hint");
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await vform().getByText("Pilih minimal satu produk untuk kampanye ini.").first().waitFor();
check(page.url().includes("/discount-campaigns/test-akumulasi"), "stayed on the form — nothing saved");
await shot("04-form-field-error");
// restore one member and save
await vform().locator("label", { hasText: "TEST Diskon 50" }).locator("input").check();
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads
check((await page.locator("tr", { hasText: "TEST Akumulasi" }).innerText()).includes("50%"), "single 50% member → list shows 50%");

// ---- 9. edit name + active ------------------------------------------------
console.log("9. rename + deactivate the test campaign");
await page.locator("tr", { hasText: "TEST Akumulasi" }).getByRole("link", { name: "Edit campaign" }).click();
await page.waitForURL("**/discount-campaigns/test-akumulasi");
await vform().locator('input[id$="-name"]').fill("TEST Akumulasi Rename");
await vform().locator('input[id$="-active"]').uncheck();
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads
const renamedRow = page.locator("tr", { hasText: "TEST Akumulasi Rename" });
await renamedRow.waitFor();
check((await renamedRow.innerText()).includes("Inactive"), "renamed row shows Inactive");
discounts = await api();
check(discounts["vip-service"] === undefined, `all campaigns inactive → no vip-service entry (got ${JSON.stringify(discounts)})`);
// reactivate for the delete step
await renamedRow.getByRole("link", { name: "Edit campaign" }).click();
await page.waitForURL("**/discount-campaigns/test-akumulasi");
await vform().locator('input[id$="-active"]').check();
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads

// ---- 10. delete via exact-name modal --------------------------------------
console.log("10. delete with the exact-name modal");
await page.locator("tr", { hasText: "TEST Akumulasi Rename" }).getByRole("button", { name: "Hapus" }).click();
const dialog = page.getByRole("dialog");
await dialog.waitFor();
const confirmInput = dialog.getByPlaceholder("Enter the exact name");
const deleteBtn = dialog.getByRole("button", { name: "Delete Permanently" });
await confirmInput.fill("TEST Akumulasi rename"); // wrong case
check(await deleteBtn.isDisabled(), "wrong name keeps Delete Permanently disabled");
await confirmInput.fill("TEST Akumulasi Rename "); // trailing space
check(await deleteBtn.isDisabled(), "trailing space keeps the button disabled");
await shot("05-delete-modal");
await confirmInput.fill("TEST Akumulasi Rename"); // exact
check(await deleteBtn.isEnabled(), "exact name enables the button");
await deleteBtn.click();
await page.waitForTimeout(1500);
check((await page.locator("tr", { hasText: "TEST Akumulasi Rename" }).count()) === 0, "campaign deleted from the list");
discounts = await api();
check(discounts["vip-service"] === undefined, `public reader empty after delete (got ${JSON.stringify(discounts)})`);

// ---- 11. restore the seeded campaign --------------------------------------
console.log("11. reactivate the seeded campaign");
await page.locator("tr", { hasText: "Diskon Akumulasi VIP" }).getByRole("link", { name: "Edit campaign" }).click();
await page.waitForURL("**/discount-campaigns/diskon-akumulasi-vip");
await vform().locator('input[id$="-active"]').check();
await vform().getByRole("button", { name: "Simpan Perubahan" }).click();
await page.waitForURL(`${BASE}/admin/catalog/discount-campaigns`);
await page.reload({ waitUntil: "load" }); // bypass the router cache so the list re-reads
discounts = await api();
check(discounts["vip-service"] === 0, `seeded campaign (two 0% products) → vip-service = 0 (got ${JSON.stringify(discounts)})`);

// ---- 12. locale switch -----------------------------------------------------
console.log("12. locale switch id ↔ en");
await page.evaluate(() => window.localStorage.setItem("booking-vip:locale", JSON.stringify("id")));
await page.reload({ waitUntil: "load" });
await page.getByText("Diskon Akumulasi VIP").first().waitFor();
check((await page.getByRole("link", { name: "Tambah Kampanye" }).count()) === 1, "Indonesian: 'Tambah Kampanye'");
check((await page.getByText("Diskon (rata-rata)").count()) >= 1, "Indonesian column header 'Diskon (rata-rata)'");
await shot("06-list-id");
await page.evaluate(() => window.localStorage.setItem("booking-vip:locale", JSON.stringify("en")));
await page.reload({ waitUntil: "load" });
await page.getByText("Diskon Akumulasi VIP").first().waitFor();
check((await page.getByRole("link", { name: "Add campaign" }).count()) === 1, "English: 'Add campaign'");
check((await page.getByText("Discount (avg)").count()) >= 1, "English column header 'Discount (avg)'");

// ---- 13. form at 390px -----------------------------------------------------
console.log("13. form at 390px (explicitly requested responsive check)");
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/admin/catalog/discount-campaigns/new`, { waitUntil: "load" });
await vform().locator('input[id$="-name"]').waitFor();
await vform().locator('select[id$="-lineSlug"]').selectOption("vip-service");
await vform().locator("label", { hasText: "TEST Diskon 50" }).locator("input").check();
await page.waitForTimeout(300);
await shot("07-form-390");
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check(!overflow, "no horizontal page overflow at 390px");

console.log("\npage errors:", errors.slice(0, 5));
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);