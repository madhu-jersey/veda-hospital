import { chromium } from 'playwright-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\madhu\\.gemini\\antigravity\\brain\\c6fc6606-974e-4538-a79b-9b39d294968f';

async function run() {
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const report = {};

  // --- 1. Desktop Test (1440px) ---
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await desktopContext.newPage();
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Check horizontal scroll at 1440px
  const desktopScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const desktopClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  report.desktopNoHorizontalScroll = desktopScrollWidth <= desktopClientWidth;

  // Check clinic status text
  const statusEl = await page.locator('[data-testid="status-open"]').first();
  const statusText = await statusEl.innerText();
  report.clinicStatus = statusText;

  // Check canvas dot field
  const canvasExists = await page.locator('canvas.hero-canvas').isVisible();
  report.canvasRendered = canvasExists;

  // Mouse interaction with hero to test dots response
  await page.mouse.move(300, 300);
  await page.waitForTimeout(200);
  await page.mouse.move(700, 350);
  await page.waitForTimeout(200);
  await page.mouse.click(600, 300);
  await page.waitForTimeout(300);

  // Check floating service cards on desktop
  const floatCardsCount = await page.locator('.anchor-card').count();
  report.desktopFloatCardsCount = floatCardsCount;

  // Screenshot 1440px hero
  const heroPath = path.join(artifactDir, 'sri-sai-hero-1440px.png');
  await page.locator('#home').screenshot({ path: heroPath });
  report.hero1440Screenshot = heroPath;

  // Ensure all reveal elements are fully visible and settled for full page capture
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    document.querySelectorAll('.doctor-card').forEach(el => el.classList.add('is-visible'));
  });
  await page.waitForTimeout(1000);

  // Check video section interaction
  const videoQueueButtons = page.locator('[data-testid^="button-video-queue-"]');
  const queueCount = await videoQueueButtons.count();
  report.videoQueueCount = queueCount;
  if (queueCount > 1) {
    await videoQueueButtons.nth(1).click();
    await page.waitForTimeout(400);
    const updatedFrameSrc = await page.locator('[data-testid="player-current-video"] iframe').getAttribute('src');
    report.videoSwitchedSuccessfully = updatedFrameSrc.includes('g-w7LMnzEa4');
  }

  // Screenshot 1440px full page
  const full1440Path = path.join(artifactDir, 'sri-sai-hospital-1440px.png');
  await page.screenshot({ path: full1440Path, fullPage: true });
  report.full1440Screenshot = full1440Path;

  await desktopContext.close();

  // --- 2. Mobile Test (390px) ---
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);

  // Check horizontal scroll at 390px
  const mobileScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  const mobileClientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
  report.mobileNoHorizontalScroll = mobileScrollWidth <= mobileClientWidth;
  report.mobileDimensions = { scrollWidth: mobileScrollWidth, clientWidth: mobileClientWidth };

  // Check touch bar exists
  const mobileActionsVisible = await mobilePage.locator('.mobile-actions').isVisible();
  report.mobileActionsVisible = mobileActionsVisible;

  // Screenshot 390px hero
  const hero390Path = path.join(artifactDir, 'sri-sai-hero-390px.png');
  await mobilePage.locator('#home').screenshot({ path: hero390Path });
  report.hero390Screenshot = hero390Path;

  // Ensure all reveal elements are fully visible and settled for full page capture
  await mobilePage.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    document.querySelectorAll('.doctor-card').forEach(el => el.classList.add('is-visible'));
  });
  await mobilePage.waitForTimeout(1000);

  // Screenshot 390px full page
  const full390Path = path.join(artifactDir, 'sri-sai-hospital-390px.png');
  await mobilePage.screenshot({ path: full390Path, fullPage: true });
  report.full390Screenshot = full390Path;

  await mobileContext.close();
  await browser.close();

  console.log(JSON.stringify(report, null, 2));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
