const { chromium } = require('playwright');
const { newInjectedContext } = require('fingerprint-injector');
const fs = require('fs');

function getRandomLanguageSet() {
    const languageSets = [
        { languages: ['tr-TR'], language: 'tr-TR' },
        { languages: ['tr', 'en', 'en-US'], language: 'tr' }
    ];
    return languageSets[Math.floor(Math.random() * languageSets.length)];
}

async function searchAndClickAd(page, keyword) {
    await page.goto('https://www.google.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('[name=q]').click();
    await page.keyboard.type(keyword);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // İlk reklam bağlantısını bul ve tıkla
    const adSelector = 'div[data-text-ad] a'; // Google reklamlarının CSS yapısı değişebilir
    const adLinks = await page.locator(adSelector);
    if (await adLinks.count() > 0) {
        await adLinks.first().click();
        await page.waitForTimeout(1000 + Math.random() * 2000); // 1-3 saniye bekle
    } else {
        console.log(`No ads found for: ${keyword}`);
    }
}

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await newInjectedContext(browser, {
        fingerprintOptions: { devices: ['mobile'], operatingSystems: ['android'] },
        newContextOptions: { geolocation: { latitude: 51.50853, longitude: -0.12574 } }
    });

    const randomLangs = getRandomLanguageSet();
    await context.addInitScript((langs) => {
        Object.defineProperty(navigator, 'languages', { get: () => langs.languages });
        Object.defineProperty(navigator, 'language', { get: () => langs.language });
    }, randomLangs);

    const page = await context.newPage();

    const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf-8'));
    for (const task of tasks) {
        console.log(`Processing location: ${task.Location}`);
        for (const keyword of task.Keywords) {
            console.log(`Searching for: ${keyword}`);
            await searchAndClickAd(page, keyword);
            await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 saniye bekle
        }
    }

    await browser.close();
})();
