const { chromium } = require('playwright');
const { newInjectedContext } = require('fingerprint-injector');
const fs = require('fs');
const cityCoordinates = JSON.parse(fs.readFileSync('city_coordinates.json', 'utf-8'));

function getRandomLanguageSet() {
    const languageSets = [
        { languages: ['tr-TR'], language: 'tr-TR' },
        { languages: ['tr', 'en', 'en-US'], language: 'tr' }
    ];
    return languageSets[Math.floor(Math.random() * languageSets.length)];
}

async function dismissGoogleNotification(page) {
    const notificationSelector = 'button:has-text("İptal"), button:has-text("Hayır"), button:has-text("Kapat"), button:has-text("Tamam")';
    for (let i = 0; i < 5; i++) { // 5 kez kontrol et
        const notificationButton = page.locator(notificationSelector);
        if (await notificationButton.count() > 0) {
            await notificationButton.first().click();
            console.log("Google bildirimi kapatıldı.");
            return;
        }
        await page.waitForTimeout(1000); // 1 saniye bekleyip tekrar kontrol et
    }
}

async function searchAndClickAd(page, keyword) {
    await page.goto('https://www.google.com', { waitUntil: 'networkidle', timeout: 30000 });
    await dismissGoogleNotification(page);
    await page.locator('[name=q]').click();
    await page.keyboard.type(keyword);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await dismissGoogleNotification(page);

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
    

    const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf-8'));
    for (const task of tasks) {
        const browser = await chromium.launch({ headless: false });
        console.log(`Processing location: ${task.Location}`);

        // Şehrin enlem ve boylamını alın
        const coordinates = cityCoordinates[task.Location.toLocaleUpperCase('tr')];
        if (!coordinates) {
            console.log(`Coordinates not found for: ${task.Location}`);
            continue;
        }

        console.log(`Coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);

        // Yeni tarayıcı bağlamı oluşturun
        const context = await newInjectedContext(browser, {
            fingerprintOptions: { devices: ['mobile'], operatingSystems: ['android'] },
            newContextOptions: { geolocation: { latitude: coordinates.latitude, longitude: coordinates.longitude, }, permissions: ['geolocation'] }
        });

        const randomLangs = getRandomLanguageSet();
        await context.addInitScript((langs) => {
            Object.defineProperty(navigator, 'languages', { get: () => langs.languages });
            Object.defineProperty(navigator, 'language', { get: () => langs.language });
        }, randomLangs);

        const page = await context.newPage();

        for (const keyword of task.Keywords) {
            console.log(`Searching for: ${keyword}`);
            await searchAndClickAd(page, keyword);
            await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 saniye bekle
            await context.close(); // Bağlamı kapatın
            await browser.close();
        }
    }
    //await browser.close();
})();
