// Browser smoke test: open the studio, start the Nuvem world, play for a moment
// and fail on any page error.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
await page.goto(pathToFileURL(resolve('index.html')).href);
await page.uncheck('#chk-tour');
await page.click('[data-world="nuvem"]');
await page.waitForSelector('#studio:not([hidden])');
for (const tab of ['#tab-desenhar', '#tab-montar', '#tab-jogar']) { await page.click(tab); await page.waitForTimeout(300); }
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(800); await page.keyboard.up('ArrowRight');
await browser.close();
if (errors.length) { console.error('✗ page errors:\n' + errors.join('\n')); process.exit(1); }
console.log('✓ smoke test passed');
