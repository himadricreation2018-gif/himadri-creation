import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const executablePath = process.env.HIMADRI_BROWSER_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(existsSync);
if (!executablePath) throw new Error('Set HIMADRI_BROWSER_PATH to your installed Chromium browser.');
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
// Local QA never sends analytics, external messages or credentials.
await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
const page = await context.newPage();
const results = [];
const routes = ['/', '/careers', '/booking.html', '/blog', '/admin/login'];
const widths = [1440, 1191, 1051, 1024, 768, 390, 320];
try {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(`http://127.0.0.1:8000${route}`, { waitUntil: 'load' });
      assert.equal(response.status(), 200);
      if (route === '/') await page.locator('.loader').waitFor({ state: 'detached' });
      const metrics = await page.locator('.site-header').evaluate(header => {
        const box = el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width }; };
        const parts = ['.brand', '.nav-brand-note', '.main-nav', '.header-cta', '.menu-toggle'].map(selector => header.querySelector(selector)).filter(el => el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
        return { header:box(header), parts:parts.map(box), tagline:header.querySelector('.nav-brand-note').textContent.trim(), width:innerWidth };
      });
      assert.equal(metrics.tagline, 'MEMORYCRAFTED SINCE 2018');
      assert.ok(metrics.header.left >= 0 && metrics.header.right <= width + 1, `Header exceeds viewport: ${route} @ ${width}`);
      for (let i = 0; i < metrics.parts.length; i++) {
        const part = metrics.parts[i];
        assert.ok(part.left >= metrics.header.left && part.right <= metrics.header.right + 1, `Header item exceeds container: ${route} @ ${width}`);
        if (i) assert.ok(part.left >= metrics.parts[i-1].right - 1, `Header items overlap: ${route} @ ${width}`);
      }
      assert.equal(await page.locator('.nav-brand-note').isVisible(), width > 1050);
      assert.equal(await page.locator('.main-nav').evaluate(nav => getComputedStyle(nav).fontSize), '15px');
      const labels = await page.locator('.eyebrow').evaluateAll(elements => elements.map(el => {
        const before = getComputedStyle(el, '::before');
        const after = getComputedStyle(el, '::after');
        return { before: [before.content, before.width, before.height, before.backgroundColor], after: [after.content, after.width, after.height, after.backgroundColor], fits: el.getBoundingClientRect().right <= innerWidth + 1 };
      }));
      for (const label of labels) {
        assert.deepEqual(label.before, label.after, `Label ornaments differ: ${route} @ ${width}`);
        assert.equal(label.before[2], '2px');
        assert.ok(label.fits, `Label overflows: ${route} @ ${width}`);
      }
      if (width <= 1050) {
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator('.main-nav').evaluate(nav => nav.inert), false);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('.main-nav').evaluate(nav => nav.inert), true);
      }
      const result = { route, width, headerFits:true, taglineVisible:width>1050, mobileMenu:width<=1050 };
      if (route === '/careers') {
        const dimensions = await page.locator('.careers-hero').evaluate(hero => ({ height:hero.getBoundingClientRect().height, padding:getComputedStyle(hero).paddingTop, heading:getComputedStyle(hero.querySelector('h1')).fontSize }));
        // Measure the previous hero proportions on the same rendered page/font.
        await page.addStyleTag({ content: '.careers-page .careers-hero { padding: clamp(45px,7vw,90px) 28px !important; } .careers-page .careers-hero .eyebrow { font-size:11px !important;letter-spacing:3px !important;margin-bottom:25px !important;} .careers-page .careers-hero h1 {font-size:clamp(32px,5vw,66px) !important;line-height:1.15 !important;max-width:850px !important;margin-bottom:24px !important;} .careers-page .careers-hero p:not(.eyebrow) { max-width:570px !important;font-size:1.1rem !important;line-height:1.8 !important;margin-bottom:30px !important;}' });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const previous = await page.locator('.careers-hero').evaluate(hero => hero.getBoundingClientRect().height);
        await page.locator('style').last().evaluate(style => style.remove());
        const reduction = (previous - dimensions.height) / previous * 100;
        if (width >= 1051) assert.ok(reduction >= 15 && reduction <= 25, `Hero reduction ${reduction.toFixed(1)}% @ ${width}`);
        Object.assign(result, dimensions, { previousHeight:previous, reductionPercent:Number(reduction.toFixed(1)) });
        await page.locator('.apply-now').click();
        const formTop = await page.locator('#careersForm').evaluate(form => form.getBoundingClientRect().top);
        assert.ok(formTop >= 75 && formTop <= 145, `Apply Now form position ${formTop} @ ${width}`);
        assert.equal(new URL(page.url()).hash, '#careersForm');
        await page.goto('http://127.0.0.1:8000/careers', { waitUntil:'load' });
        await page.screenshot({ path:`test-results/careers-${width}.png`, fullPage:false });
      }
      results.push(result);
    }
  }
  await writeFile('test-results/browser-results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ checks:results.length, pages:routes.length, widths, careers:results.filter(result => result.route === '/careers') }, null, 2));
} finally { await context.close(); await browser.close(); }
