// Staged E2E for the login-refresh fix + loyalty points system.
// Usage: node scripts/tmp/loyalty-e2e.mjs <stage>
// Stages: register | login | loyalty | checkout | negative | locale | mobile
import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
import fs from "node:fs";

const { chromium } = pw;
const BASE = "http://localhost:3000";
const STATE_FILE = new URL("./loyalty-state.json", import.meta.url).pathname;
const AUTH_FILE = new URL("./loyalty-auth.json", import.meta.url).pathname;
const SHOTS = new URL("./shots/", import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });

const stage = process.argv[2];
// Booking target for the checkout stages (meet-greet, $85/adult, 3h lead).
const TEST_ENV = {
  PRODUCT_SLUG: process.env.PRODUCT_SLUG || "meet-greet",
  PKG_ID: process.env.PKG_ID || "be661a63-e311-41a7-9524-79f52fc3d2ad",
  BOOK_DATE: process.env.BOOK_DATE || "2026-11-20",
  FOREIGN_CODE: process.env.FOREIGN_CODE || "RWD-AAAAAA",
  EXPIRED_CODE: process.env.EXPIRED_CODE || "RWD-BBBBBB",
};
const state = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
  : {};
const save = (patch) => {
  Object.assign(state, patch);
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
};

const browser = await chromium.launch({
  headless: false,
  channel: process.env.PW_CHANNEL || "chrome",
  ignoreDefaultArgs: ["--enable-automation"],
  args: ["--disable-blink-features=AutomationControlled", "--start-maximized"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 2500));
});

const shot = async (name) => {
  await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: false });
  console.log(`shot: ${name}`);
};
const bodyText = () => page.locator("body").innerText();
const fail = async (msg) => {
  console.error("FAIL:", msg);
  await shot(`FAIL-${stage}`);
  console.error("pageerrors:", errors.slice(0, 5));
  await browser.close();
  process.exit(1);
};

/** Wait until the Turnstile widget wrote its token into the form. */
async function waitTurnstile() {
  try {
    await page.waitForFunction(
      () => {
        const el = document.querySelector('input[name="cf-turnstile-response"]');
        return el && el.value && el.value.length > 20;
      },
      { timeout: 45000 },
    );
    console.log("turnstile token present");
  } catch {
    await fail("Turnstile never produced a token (bot-flagged browser?)");
  }
}

if (stage === "register") {
  const rand = Math.random().toString(36).slice(2, 8);
  const email = `bv.loyalty.${rand}@example.com`;
  const password = `Test-${rand}-Passw0rd!`;
  console.log("auth file exists:", fs.existsSync(AUTH_FILE));
  await page.goto(`${BASE}/register`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  console.log("after goto url:", page.url());
  await page.fill('input[name="name"]', "Loyalty Tester");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirm"]', password);
  await page.check('input[name="terms"]');
  await waitTurnstile();
  await page.locator('form:has(input[name="confirm"]) button[type="submit"]').click();
  console.log("after click url:", page.url());
  await page.waitForURL("**/verify-email**", { timeout: 30000 }).catch(() => {});
  console.log("after wait url:", page.url());
  const errText = await page.locator("form p.text-danger, form .text-danger").allInnerTexts().catch(() => []);
  console.log("form errors:", errText);
  if (!page.url().includes("verify-email")) {
    await fail(`register did not reach verify-email; url=${page.url()} text=${(await bodyText()).slice(0, 400)}`);
  }
  save({ email, password });
  await context.storageState({ path: AUTH_FILE });
  console.log("registered:", email);
  await shot("register-done");
}

if (stage === "login") {
  // Start signed out so the header shows "Sign in | Register".
  await context.clearCookies();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const signInLink = page.locator('header a[href="/login"]');
  if (!(await signInLink.count())) await fail("guest header not showing sign-in link");
  // SPA-navigate to the login form (the auth pages render no header).
  await signInLink.click();
  await page.waitForURL("**/login", { timeout: 15000 });
  await page.waitForTimeout(1200);
  // Marker survives only if there is NO full page reload.
  await page.evaluate(() => { window.__noReloadMarker = "alive"; });
  await page.fill('input[name="email"]', state.email);
  await page.fill('input[name="password"]', state.password);
  await waitTurnstile();
  await page.locator('form:has(input[name="password"]) button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 30000 }).catch(() => {});
  if (page.url() !== `${BASE}/`) await fail(`login did not navigate home: ${page.url()}`);
  const marker = await page.evaluate(() => window.__noReloadMarker ?? "gone");
  if (marker !== "alive") await fail("page RELOADED during login (marker gone) — SPA update failed");
  // The initials button must appear without any reload.
  const menuBtn = page.locator('header button[aria-label="Account menu"], header button[aria-label="Menu akun"]');
  await menuBtn.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  if (!(await menuBtn.isVisible())) await fail("initials menu did not appear after login");
  const initials = await menuBtn.innerText();
  console.log("initials shown without reload:", initials);
  await menuBtn.click();
  await page.waitForTimeout(400);
  const menuText = await page.locator('[role="menu"]').innerText();
  console.log("menu text:", menuText.replace(/\n/g, " | "));
  if (!/Points|Poin/.test(menuText)) await fail("points line missing in dropdown");
  const expectPoints = process.env.EXPECT_POINTS || state.balanceAfter || "500";
  if (!menuText.includes(expectPoints)) await fail(`dropdown does not show the real balance ${expectPoints}: ${menuText}`);
  save({ menuTextAfterLogin: menuText });
  await shot("login-initials-menu");
  await context.storageState({ path: AUTH_FILE });
}

if (stage === "loyalty") {
  await page.goto(`${BASE}/account/loyalty`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const text = await bodyText();
  if (!/Redeem your points|Tukar poin/.test(text)) await fail("rewards catalog not rendered");
  const redeemButtons = page.getByRole("button", { name: /^(Redeem|Tukar)$/ });
  const n = await redeemButtons.count();
  console.log("redeem buttons:", n);
  if (n < 3) await fail(`expected >=3 rewards, got ${n}`);
  await shot("loyalty-before");

  // Balance before (from the panel's big number).
  const before = await page.locator("section p.text-\\[32px\\]").first().innerText().catch(() => "?");
  console.log("balance before:", before);

  // Open a SECOND tab BEFORE redeeming — its overview stays stale (old
  // balance), so its Redeem button remains enabled and the server must be
  // the one that refuses the second redemption.
  const page2 = await context.newPage();
  await page2.goto(`${BASE}/account/loyalty`, { waitUntil: "load" });
  await page2.waitForTimeout(2000);

  // Redeem the first reward (diskon-10, 500 points).
  await redeemButtons.first().click();
  await page.waitForTimeout(2500);
  const afterText = await bodyText();
  if (!/Voucher RWD-|voucher RWD-/.test(afterText)) {
    await fail(`no success notice with voucher code; text=${afterText.slice(0, 600)}`);
  }
  const codeMatch = afterText.match(/RWD-[A-Z2-9]{6}/);
  const voucherCode = codeMatch ? codeMatch[0] : null;
  const after = await page.locator("section p.text-\\[32px\\]").first().innerText().catch(() => "?");
  console.log("balance after:", after, "voucher:", voucherCode);
  save({ voucherCode, balanceBefore: before, balanceAfter: after });
  await shot("loyalty-redeemed");

  // Stale second tab: its overview still shows the old balance, so its
  // Redeem button is enabled — the SERVER must refuse with a friendly message.
  const btn2 = page2.getByRole("button", { name: /^(Redeem|Tukar)$/ }).first();
  if (await btn2.isEnabled()) {
    await btn2.click();
    await page2.waitForTimeout(2500);
    const t2 = await page2.locator("body").innerText();
    const notice = t2.match(/(Poin kamu belum cukup[^\n]*|Not enough points[^\n]*)/);
    console.log("second redemption notice:", notice ? notice[0] : "(none — button may have been disabled)");
    if (!notice) await fail("expected friendly insufficient-points refusal on stale tab");
    await page2.screenshot({ path: `${SHOTS}loyalty-refused.png` });
  } else {
    console.log("second tab button disabled (overview already refreshed) — server refusal tested via DB stage");
  }
  await page2.close();

  // History must show the redemption.
  const histText = await bodyText();
  if (!/Points history|Riwayat poin/.test(histText)) await fail("history section missing");
  await shot("loyalty-history");
}

if (stage === "checkout") {
  const { PRODUCT_SLUG, PKG_ID, BOOK_DATE } = TEST_ENV;
  if (!PRODUCT_SLUG || !BOOK_DATE) await fail("set PRODUCT_SLUG and BOOK_DATE");
  const url = `${BASE}/booking/${PRODUCT_SLUG}?date=${BOOK_DATE}&time=10:00&adult=1${PKG_ID ? `&pkg=${PKG_ID}` : ""}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  // Step 1: add-ons → continue
  await page.getByRole("button", { name: /Continue|Lanjut/ }).last().click();
  await page.waitForTimeout(800);
  // Step 2: details
  const inputs = page.locator("input");
  await page.locator('input[type="text"]').nth(1).fill("Jakarta"); // location (0 is readonly airport)
  // Contact fields: find by order within the contact card — use labels instead.
  const fillByLabel = async (label, value) => {
    const input = page.locator(`label:has-text("${label}")`).locator("xpath=following::input[1]");
    await input.first().fill(value);
  };
  await fillByLabel("First name", "Loyalty");
  await fillByLabel("Last name", "Tester");
  await fillByLabel("Email", state.email);
  await fillByLabel("Phone", "81234567890");
  await fillByLabel("Traveler 1", "Loyalty Tester");
  await page.getByRole("button", { name: /Continue to payment|Lanjut ke pembayaran/i }).click();
  await page.waitForTimeout(1200);
  await shot("checkout-payment-step");

  // Voucher list must show the redeemed voucher.
  const payText = await bodyText();
  if (!payText.includes(state.voucherCode)) await fail(`voucher ${state.voucherCode} not listed in StepPayment`);
  // Summary total before applying.
  const totalBefore = await page.locator("aside .text-xl").first().innerText();
  await page.getByRole("button", { name: /^(Apply|Pakai)$/ }).first().click();
  await page.waitForTimeout(2000);
  const totalAfter = await page.locator("aside .text-xl").first().innerText();
  console.log("summary total before:", totalBefore, "after:", totalAfter);
  if (totalBefore === totalAfter) await fail("summary total did not change after applying voucher");
  const asideText = await page.locator("aside").innerText();
  if (!/Discount|Diskon/.test(asideText)) await fail("discount line missing in sticky summary");
  if (!/points for this booking|poin untuk pesanan/.test(asideText)) await fail("earn preview missing in summary");
  await shot("checkout-voucher-applied");

  // Submit the booking.
  await page.getByRole("button", { name: /Book now|Pesan sekarang/i }).click();
  await page.waitForTimeout(4000);
  const resultText = await bodyText();
  const codeMatch = resultText.match(/BV-[A-Z2-9]{6}/);
  if (!codeMatch) await fail(`booking failed: ${resultText.slice(0, 600)}`);
  save({ bookingCode: codeMatch[0], totalBefore, totalAfter });
  console.log("booking created:", codeMatch[0]);
  await shot("checkout-result");
}

if (stage === "negative") {
  const { PRODUCT_SLUG, PKG_ID, BOOK_DATE, FOREIGN_CODE, EXPIRED_CODE } = TEST_ENV;
  const url = `${BASE}/booking/${PRODUCT_SLUG}?date=${BOOK_DATE}&time=10:00&adult=1${PKG_ID ? `&pkg=${PKG_ID}` : ""}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Continue|Lanjut/ }).last().click();
  await page.waitForTimeout(800);
  const fillByLabel = async (label, value) => {
    const input = page.locator(`label:has-text("${label}")`).locator("xpath=following::input[1]");
    await input.first().fill(value);
  };
  await fillByLabel("First name", "Loyalty");
  await fillByLabel("Last name", "Tester");
  await fillByLabel("Email", state.email);
  await fillByLabel("Phone", "81234567890");
  await fillByLabel("Traveler 1", "Loyalty Tester");
  await page.getByRole("button", { name: /Continue to payment|Lanjut ke pembayaran/i }).click();
  await page.waitForTimeout(1200);

  for (const [label, code] of [["foreign", FOREIGN_CODE], ["expired", EXPIRED_CODE]]) {
    if (!code) { console.log(`skip ${label} (no code)`); continue; }
    await page.fill('input[placeholder*="promo" i], input[placeholder*="voucher" i]', code);
    await page.getByRole("button", { name: /^(Check|Cek)$/ }).click();
    await page.waitForTimeout(2000);
    const t = await bodyText();
    const refused = /terikat ke akun lain|another account|sudah berakhir|has ended|expired/i.test(t);
    console.log(`${label} voucher refused:`, refused);
    if (!refused) await fail(`${label} voucher was NOT refused: ${t.slice(0, 500)}`);
    await shot(`negative-${label}`);
  }
}

if (stage === "locale") {
  // Loyalty page: EN -> ID -> EN, every new string must switch.
  await page.goto(`${BASE}/account/loyalty`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const setLang = async (label) => {
    await page.locator("header button", { hasText: / \| (USD|IDR)/ }).first().click();
    await page.getByRole("menuitemradio", { name: label }).click();
    await page.waitForTimeout(600);
  };
  const accountMenuBtn = page.locator('header button[aria-label="Account menu"], header button[aria-label="Menu akun"]');
  const expectText = async (patterns, name) => {
    const t = await bodyText();
    for (const p of patterns) {
      if (!p.test(t)) await fail(`locale ${name}: missing ${p}`);
    }
    console.log(`locale ${name}: ok`);
  };
  await expectText([/Redeem your points/, /My vouchers/, /Points history/], "EN-initial");
  await page.screenshot({ path: `${SHOTS}loyalty-full-en.png`, fullPage: true });
  await setLang(/Indonesia/);
  await expectText([/Tukar poin kamu/, /Voucher saya/, /Riwayat poin/], "ID");
  await shot("locale-id-loyalty");
  await page.screenshot({ path: `${SHOTS}loyalty-full-id.png`, fullPage: true });
  // Header menu in ID.
  await accountMenuBtn.click();
  await page.waitForTimeout(400);
  const menuId = await page.locator('[role="menu"]').last().innerText();
  if (!/Poin/.test(menuId) || !/Keluar/.test(menuId)) await fail(`ID menu wrong: ${menuId}`);
  await shot("locale-id-menu");
  await page.keyboard.press("Escape");
  await setLang(/English/);
  await expectText([/Redeem your points/, /My vouchers/], "EN-back");
  // Header menu in EN.
  await accountMenuBtn.click();
  await page.waitForTimeout(400);
  const menuEn = await page.locator('[role="menu"]').last().innerText();
  if (!/Points/.test(menuEn) || !/Sign out/.test(menuEn)) await fail(`EN menu wrong: ${menuEn}`);
  await page.keyboard.press("Escape");

  // Checkout labels in both languages.
  const { PRODUCT_SLUG, PKG_ID, BOOK_DATE } = TEST_ENV;
  const url = `${BASE}/booking/${PRODUCT_SLUG}?date=${BOOK_DATE}&time=10:00&adult=1${PKG_ID ? `&pkg=${PKG_ID}` : ""}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Continue|Lanjut/ }).last().click();
  await page.waitForTimeout(800);
  const fillByLabel = async (label, value) => {
    const input = page.locator(`label:has-text("${label}")`).locator("xpath=following::input[1]");
    await input.first().fill(value);
  };
  await fillByLabel("First name", "Loyalty");
  await fillByLabel("Last name", "Tester");
  await fillByLabel("Email", state.email);
  await fillByLabel("Phone", "81234567890");
  await fillByLabel("Traveler 1", "Loyalty Tester");
  await page.getByRole("button", { name: /Continue to payment|Lanjut ke pembayaran/i }).click();
  await page.waitForTimeout(1200);
  await expectText([/Have a promo code\?/, /points for this booking/], "checkout-EN");
  await shot("locale-en-checkout");
  await setLang(/Indonesia/);
  await expectText([/Punya kode promo\?/, /poin untuk pesanan/], "checkout-ID");
  await shot("locale-id-checkout");
}

if (stage === "amount-id") {
  // Indonesian UI + the "amount" reward kind: redeem potongan-5 ($5 off),
  // apply it at checkout, verify the ID discount line and the snapshot.
  await page.addInitScript(() => {
    try { localStorage.setItem("booking-vip:locale", '"id"'); } catch {}
  });
  await page.goto(`${BASE}/account/loyalty`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const tukar = page.getByRole("button", { name: /^Tukar$/ });
  await tukar.nth(1).click();
  await page.waitForTimeout(2500);
  const notice = await page.locator("body").innerText();
  const m = notice.match(/RWD-[A-Z2-9]{6}/);
  if (!m || !/Berhasil!/.test(notice)) await fail(`ID redeem failed: ${notice.slice(0, 400)}`);
  const code2 = m[0];
  console.log("ID redeem ok, voucher:", code2);
  save({ voucherCode2: code2 });
  await page.screenshot({ path: `${SHOTS}amount-id-redeemed.png` });

  const { PRODUCT_SLUG, PKG_ID, BOOK_DATE } = TEST_ENV;
  await page.goto(`${BASE}/booking/${PRODUCT_SLUG}?date=${BOOK_DATE}&time=10:00&adult=1${PKG_ID ? `&pkg=${PKG_ID}` : ""}`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Lanjutkan|Continue/i }).last().click();
  await page.waitForTimeout(800);
  const fillByLabel = async (label, value) => {
    const input = page.locator(`label:has-text("${label}")`).locator("xpath=following::input[1]");
    await input.first().fill(value);
  };
  await fillByLabel("Nama Depan", "Loyalty");
  await fillByLabel("Nama Belakang", "Tester");
  await fillByLabel("Email", state.email);
  await fillByLabel("Telepon", "81234567890");
  await fillByLabel("Traveler 1", "Loyalty Tester");
  await page.getByRole("button", { name: /Lanjut ke Pembayaran|Continue to Payment/i }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /^Pakai$/ }).first().click();
  await page.waitForTimeout(2000);
  const aside = await page.locator("aside").innerText();
  console.log("ID aside:", aside.replace(/\n/g, " | "));
  if (!/Diskon/.test(aside)) await fail("ID discount label missing in summary");
  if (!/\$80\.00|Rp/.test(aside)) await fail(`ID discounted total wrong: ${aside}`);
  await page.screenshot({ path: `${SHOTS}amount-id-checkout.png` });
  await page.getByRole("button", { name: /Pesan Sekarang|Book Now/i }).click();
  await page.waitForTimeout(4000);
  const resultText = await page.locator("body").innerText();
  const bm = resultText.match(/BV-[A-Z2-9]{6}/);
  if (!bm) await fail(`ID booking failed: ${resultText.slice(0, 500)}`);
  save({ bookingCode2: bm[0] });
  console.log("ID booking with $5 voucher:", bm[0]);
  await page.screenshot({ path: `${SHOTS}amount-id-result.png` });
}

if (stage === "home-id") {
  // Signed OUT, ID preference: does the home hydration mismatch still occur?
  await context.clearCookies();
  await page.addInitScript(() => {
    try { localStorage.setItem("booking-vip:locale", '"id"'); } catch {}
  });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  const hyd = errors.filter((e) => /Hydration failed/.test(e));
  console.log("signed-out ID home hydration errors:", hyd.length);
}

if (stage === "history-shot") {
  await page.goto(`${BASE}/account/loyalty`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const text = await page.locator("body").innerText();
  const earnLines = text.match(/(Booking|Pesanan) BV-[A-Z2-9]{6}/g) ?? [];
  console.log("earn entries:", earnLines);
  if (earnLines.length < 2) await fail("earned-points history entries missing");
  const history = page.locator("section", { hasText: /Points history|Riwayat poin/ }).last();
  await history.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}history-earn.png` });
  console.log("history screenshot taken");
}

if (stage === "probe") {
  for (const path of ["/", "/login", "/account/loyalty", "/booking/meet-greet?date=2026-11-20&time=10:00&adult=1"]) {
    errors.length = 0;
    await page.goto(`${BASE}${path}`, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const real = errors.filter((e) => !/Content Security Policy|font-size:0|challenges\.cloudflare|Download the React DevTools/i.test(e));
    console.log(path, "→", real.length ? real.slice(0, 4) : "clean");
  }
}

if (stage === "mobile") {
  // Layout test only — pin EN so the label selectors are deterministic.
  await page.addInitScript(() => {
    try { localStorage.setItem("booking-vip:locale", '"en"'); } catch {}
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/account/loyalty`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  // Horizontal overflow check.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log("mobile loyalty horizontal overflow:", overflow);
  if (overflow > 1) await fail(`mobile loyalty overflows by ${overflow}px`);
  await shot("mobile-loyalty");
  await page.screenshot({ path: `${SHOTS}mobile-loyalty-full.png`, fullPage: true });
  const { PRODUCT_SLUG, PKG_ID, BOOK_DATE } = TEST_ENV;
  const url = `${BASE}/booking/${PRODUCT_SLUG}?date=${BOOK_DATE}&time=10:00&adult=1${PKG_ID ? `&pkg=${PKG_ID}` : ""}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Continue|Lanjut/ }).last().click();
  await page.waitForTimeout(800);
  const fillByLabel = async (label, value) => {
    const input = page.locator(`label:has-text("${label}")`).locator("xpath=following::input[1]");
    await input.first().fill(value);
  };
  await fillByLabel("First name", "Loyalty");
  await fillByLabel("Last name", "Tester");
  await fillByLabel("Email", state.email);
  await fillByLabel("Phone", "81234567890");
  await fillByLabel("Traveler 1", "Loyalty Tester");
  await page.getByRole("button", { name: /Continue to payment|Lanjut ke pembayaran/i }).click();
  await page.waitForTimeout(1200);
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log("mobile checkout horizontal overflow:", overflow2);
  if (overflow2 > 1) await fail(`mobile checkout overflows by ${overflow2}px`);
  await shot("mobile-checkout");
}

console.log("pageerrors:", errors.length ? errors.slice(0, 5) : "none");
if (stage !== "home-id") {
  await context.storageState({ path: AUTH_FILE }).catch(() => {});
}
await browser.close();
console.log(`stage ${stage}: DONE`);