import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:5001/api';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./assets/', import.meta.url));

const HIDE_SCROLLBARS = `::-webkit-scrollbar { display: none !important; } html { scrollbar-width: none !important; }`;

async function tokenFor(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`login failed for ${email}`);
  return body.token;
}

const browser = await chromium.launch();

async function shot(name, path, { theme, token, waitFor, extraWait = 1200 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
  });
  if (theme || token) {
    await ctx.addInitScript(
      ([t, tok]) => {
        if (t) localStorage.setItem('gratiwall-theme', t);
        if (tok) localStorage.setItem('gratiwall_token', tok);
      },
      [theme, token]
    );
  }
  const page = await ctx.newPage();
  await page.addStyleTag({ content: HIDE_SCROLLBARS }).catch(() => {});
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  // let the intro splash finish and clear
  await page.waitForSelector('#intro', { state: 'detached', timeout: 8000 }).catch(() => {});
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 });
  await page.addStyleTag({ content: HIDE_SCROLLBARS });
  await page.waitForTimeout(extraWait);
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: false });
  console.log('captured', name);
  await ctx.close();
}

const studentToken = await tokenFor('aarav.mehta@gratiwall.edu');
const adminToken = await tokenFor('admin@gratiwall.edu');

await shot('wall-light', '/', { theme: 'light', waitFor: '.note-card', extraWait: 1500 });
await shot('wall-dark', '/', { theme: 'dark', waitFor: '.note-card', extraWait: 1500 });
await shot('submit', '/submit', { theme: 'light', token: studentToken, waitFor: 'form' });
await shot('admin-queue', '/admin', { theme: 'light', token: adminToken, waitFor: '.mod-card' });
await shot('analytics', '/admin/analytics', { theme: 'light', token: adminToken, waitFor: '.recharts-responsive-container', extraWait: 2500 });
await shot('recipient', `/to/${encodeURIComponent('Dr. Priya Raghavan')}`, { theme: 'light', waitFor: '.note-card' });

await browser.close();
console.log('done');
