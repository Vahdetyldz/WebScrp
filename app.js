const { chromium } = require('playwright');
const { newInjectedContext } = require('fingerprint-injector');
const fs = require('fs');

const cityCoordinates = JSON.parse(fs.readFileSync('city_coordinates.json', 'utf-8'));
const devices = JSON.parse(fs.readFileSync('MobilDevices.json', 'utf-8'));
const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf-8'));


function getRandomDevice() {
    try {
        // "landscape" içermeyen anahtarları filtrele
        const filteredKeys = Object.keys(devices).filter(key => !key.includes("landscape") && !key.includes("Desktop"));

        // Rastgele bir key seç
        const randomKey = filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
        console.log(randomKey);
        return randomKey; // String olarak döndür
    } catch (error) {
        console.error("Hata:", error.message);
        return null;
    }
}

// Ana işlem
(async () => {
    const userDataDir = 'appData';
    fs.rmSync(userDataDir, { recursive: true, force: true })

    const coordinates = cityCoordinates["MERSİN"];

    const deviceName=getRandomDevice();

    const browser = await chromium.launchPersistentContext(userDataDir,{ 
        headless: false,  // Tarayıcı arayüzü açık olacak
        viewport: devices[deviceName].viewport,
        /*locale : ,*/
        userAgent: devices[deviceName].userAgent,
        isMobile: true,
        hasTouch: true,
        geolocation: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
        },
        permissions: ['geolocation'],
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', // Automation izlerini gizle
        ],
        //proxy: { server: 'http://proxyserver.com:8080', username: 'user', password: 'pass' } /* İlerde Kullanmak için */
    });

    await browser.addInitScript(() => {
    
        // Webdriver & Media Devices Spoofing
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'mediaDevices', {
            get: () => ({
                enumerateDevices: async () => [],
                getUserMedia: async () => { throw new Error("Permission denied"); }
            })
        });
    
        // WebGL Vendor & Renderer Spoofing
        const spoofedVendor = ["Google Inc.", "Apple Inc.", "NVIDIA Corporation", "Intel Inc."][Math.floor(Math.random() * 4)];
        const spoofedRenderer = ["Intel Iris Plus", "NVIDIA GeForce RTX 3060", "AMD Radeon RX 6700 XT"][Math.floor(Math.random() * 3)];
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
            if (parameter === 37445) return spoofedRenderer;
            if (parameter === 37446) return spoofedVendor;
            return getParameter.call(this, parameter);
        };
    
        // Canvas Fingerprint Spoofing
        HTMLCanvasElement.prototype.toDataURL = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.fillText(Math.random().toString(), 10, 10); // Her seferinde farklı
            return canvas.toDataURL();
        };

        window.chrome = window.chrome || {};
        window.chrome.runtime = window.chrome.runtime || {};
    });

    //Yeni sayfa oluştur-> google gir -> arama çubuğunu bul -> fingerprint yaz -> enter'e tıkla ve 3 saniye bekle
    const page = await browser.newPage();
    await page.goto('https://www.google.com', {
        waitUntil: 'networkidle',
        timeout: 30000,
    });
    const inputLocator = page.locator('[name=q]');
    await inputLocator.click();
    await page.keyboard.type('fingerprint');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50000);      

    await browser.close();
    console.log("✅ Tüm görevler tamamlandı. Program sonlanıyor.");
    process.exit(0);
})();