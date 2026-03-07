import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('pageerror', err => {
        console.error('PAGE ERROR CAUGHT:', err.message);
        console.error(err.stack);
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('CONSOLE ERROR:', msg.text());
        }
    });

    console.log("Navigating to Price Tracker...");
    await page.goto('http://localhost:5173/apps/price-tracker', { waitUntil: 'networkidle2' });

    console.log("Waiting for textarea...");
    await page.waitForSelector('textarea', { timeout: 10000 });

    console.log("Adding a manual product...");
    await page.type('textarea', 'iPhone 15');

    console.log("Clicking Load Products...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loadBtn = btns.find(b => b.textContent && b.textContent.includes('Load Products'));
        if (loadBtn) loadBtn.click();
        else console.error("Load Products button not found!");
    });

    console.log("Waiting for Load Products to process...");
    await new Promise(r => setTimeout(r, 1000));

    console.log("Clicking Start Price Lookup...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const playBtn = btns.find(b => b.textContent && b.textContent.includes('Start Price Lookup'));
        if (playBtn) playBtn.click();
        else console.error("Start Price Lookup button not found!");
    });

    console.log("Waiting 2s for crash...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("Closing browser.");
    await browser.close();
})();
