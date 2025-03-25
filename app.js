const { chromium } = require('playwright');
const { newInjectedContext } = require('fingerprint-injector');
const fs = require('fs');

const cityCoordinates = JSON.parse(fs.readFileSync('city_coordinates.json', 'utf-8'));
const devices = JSON.parse(fs.readFileSync('MobilDevices.json', 'utf-8'));
const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf-8'));


function getRandomLanguageSet() {
    const languageSets = [
        { languages: ['tr-TR'], language: 'tr-TR' },
        { languages: ['tr', 'en', 'en-US'], language: 'tr' }
    ];
    return languageSets[Math.floor(Math.random() * languageSets.length)];
}
async function addTouchEffect(page, x, y) {
    await page.evaluate(({ x, y }) => {
        const touchEffect = document.createElement("div");
        touchEffect.style.position = "absolute";
        touchEffect.style.top = `${y}px`;
        touchEffect.style.left = `${x}px`;
        touchEffect.style.width = "30px";
        touchEffect.style.height = "30px";
        touchEffect.style.borderRadius = "50%";
        touchEffect.style.background = "rgba(255, 0, 0, 0.5)"; // Kırmızı yarı saydam dokunma efekti
        touchEffect.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.8)";
        touchEffect.style.pointerEvents = "none"; // Etkileşimi engelle
        touchEffect.style.transition = "opacity 0.5s ease-out";

        document.body.appendChild(touchEffect);

        setTimeout(() => {
            touchEffect.style.opacity = "0"; // Kaybolma efekti
            setTimeout(() => touchEffect.remove(), 500);
        }, 100);
    }, { x, y });
}

// Gerçek mobil swipe hareketi
async function swipeGesture(page, startX, startY, endX, endY, steps = 10) {
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY }],
    });
    await addTouchEffect(page, startX, startY);

    const deltaX = (endX - startX) / steps;
    const deltaY = (endY - startY) / steps;

    for (let i = 1; i <= steps; i++) {
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{
                x: Math.round(startX + deltaX * i),
                y: Math.round(startY + deltaY * i),
            }],
        });
        await page.waitForTimeout(16);
    }

    await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
    });
    await addTouchEffect(page, endX, endY);

}

// Reklama dokunma ve web sitesinde swipe ile gezinme
async function tapAdAndSwipeAround(page, adLink) {
    try {
        console.log("Reklama dokunmaya hazırlanıyor...");
        const box = await adLink.boundingBox();
        if (box) {
            await page.waitForTimeout(Math.random() * 2000); // 0-2 saniye içinde dokun
            await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

            console.log("Reklama başarıyla dokunuldu!");

            await page.waitForTimeout(2000); // Sayfa yüklenmesi için bekle

            console.log("Sayfa aşağıya doğru kaydırılıyor (swipe down)...");
            await swipeGesture(page, 200, 600, 200, 200);
            await page.waitForTimeout(1500);

            console.log("Sayfa yukarıya doğru kaydırılıyor (swipe up)...");
            await swipeGesture(page, 200, 200, 200, 600);
            await page.waitForTimeout(1500);

            console.log("Geri tuşuna basılıyor...");
            await page.goBack();
            await page.waitForTimeout(2000);
        } else {
            console.log("Reklamın koordinatları alınamadı.");
        }
    } catch (error) {
        console.log("Reklama dokunurken hata oluştu:", error.message);
    }
}

// Google bildirimlerini kapatma
async function dismissGoogleNotification(page) {
    try {
        const notificationSelector = 'button:has-text("İptal"), button:has-text("Hayır"), button:has-text("Kapat"), button:has-text("Tamam"), button:has-text("Hayır, teşekkürler")';
        for (let i = 0; i < 5; i++) {
            const notificationButton = page.locator(notificationSelector);
            if (await notificationButton.count() > 0) {
                await page.touchscreen.tap(200, 400);
                await notificationButton.first().click();
                console.log("Google bildirimi kapatıldı.");
                return;
            }
            await page.waitForTimeout(1000);
        }
        console.log("Google bildirimi bulunamadı, devam ediliyor.");
    } catch (error) {
        console.log("Google bildirimi kapatılırken hata oluştu, devam ediliyor.");
    }
}

// Arama yap ve reklama dokun
async function searchKeywordAndTapAd(page, keyword) {
    try {
        await page.goto('https://google.com/', { waitUntil: 'networkidle', timeout: 30000 });

        /*await page.locator('[name=q]').click();
        console.log(`Arama kutusuna "${keyword}" yazılıyor...`);
        await typeLikeHuman(page, keyword);
        await page.keyboard.press('Enter');
        console.log(`"${keyword}" kelimesi arandı. Sonuçlar yükleniyor...`);
        const ads = await page.locator('div[data-text-ad]');
        for (let i = 0; i < await ads.count(); i++) {
            const ad = ads.nth(i);
            const links = await ad.locator('a');
        
            let clicked = false;
            for (let j = 0; j < await links.count(); j++) {
                const link = links.nth(j);
                const href = await link.getAttribute('href');
        
                // Google yönlendirme linki değilse tıkla!
                if (href && !href.includes("google.com/aclk")) {
                    console.log(`Tıklanabilir link bulundu: ${href}`);
                    await tapAdAndSwipeAround(page, link.first());
                    clicked = true;
                    break; // İlk uygun linke tıklayıp çık
                }
            }
        
            if (!clicked) {
                console.log("Bu reklam atlandı (sadece Google yönlendirme linki var).");
            }
            
        }*/
    } catch (error) {
        console.log(`Hata oluştu (${keyword}):`, error.message);
    }
}

// Doğal yazma simülasyonu
async function typeLikeHuman(page, text) {
    for (let char of text) {
        await page.keyboard.type(char, { delay: Math.floor(Math.random() * 100) + 200 });

        // %15 ihtimalle yanlış yazıp geri silsin
        if (Math.random() < 0.05) {
            const wrongChar = getSimilarWrongChar(char); // Yanlış harfi al
            await page.keyboard.type(wrongChar, { delay: Math.floor(Math.random() * 100) + 200 });
            await page.waitForTimeout(Math.floor(Math.random() * 500) + 300); // Yanlış yazdıktan sonra bekleme (300-800ms)
            await page.keyboard.press("Backspace");
            await page.waitForTimeout(Math.floor(Math.random() * 200) + 300); // Tekrar yazmadan önce bekleme (300-500ms)
           
        }

        // %10 ihtimalle kısa bir duraksama yapsın (düşünüyormuş gibi)
        if (Math.random() < 0.10) {
            await page.waitForTimeout(Math.floor(Math.random() * 1000) + 300);
        }
    }
}

// Yanlış harfi seçen fonksiyon
function getSimilarWrongChar(char) {
    const turkishAlphabet = "abcçdefgğhıijklmnoöprsştuüvyz"; // Türkçe harfler
    const index = turkishAlphabet.indexOf(char.toLowerCase()); // Harfin indeksini bul

    if (index === -1) return char; // Eğer harf değilse aynısını döndür

    const randomOffset = Math.random() < 0.5 ? -1 : 1; // Yanlış harf için +1 veya -1 kaydır
    const wrongIndex = (index + randomOffset + turkishAlphabet.length) % turkishAlphabet.length;
    
    return turkishAlphabet[wrongIndex];
}

function getRandomDevice() {
    try {
        // "landscape" içermeyen anahtarları filtrele
        const filteredKeys = Object.keys(devices).filter(key => !key.toLowerCase().includes("landscape"));

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
    // Kendi özel Playwright kullanıcı profili dizinini kullan
    const userDataDir = 'Usrdata';

    for (const task of tasks) {
        console.log(`İşlem yapılıyor: ${task.Location}`);

        const coordinates = cityCoordinates[task.Location.toLocaleUpperCase('tr')];
        if (!coordinates) {
            console.log(`Koordinatlar bulunamadı: ${task.Location}`);
            continue;
        }

        deviceName=getRandomDevice();

        const browser = await chromium.launchPersistentContext(userDataDir,{ 
            headless: false,  // Tarayıcı arayüzü açık olacak
            viewport: devices[deviceName].viewport,  // Ekran boyutunu iPhone 12’ye ayarla
            /*locale : */ //dil ayarı ekle
            userAgent: devices[deviceName].userAgent,  // iPhone 12'nin userAgent bilgisini kullan
            isMobile: true,  // Mobil modu aç
            hasTouch: true,  // Dokunmatik ekranı etkinleştir
            geolocation: {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude
            },
            permissions: ['geolocation'],
            args: ['--disable-webrtc'],
            //proxy: { server: 'http://proxyserver.com:8080', username: 'user', password: 'pass' } /* İlerde Kullanmak için */

        });

        const page = await browser.newPage();

        await browser.addInitScript(() => {
            const getShaderPrecisionFormat = WebGLRenderingContext.prototype.getShaderPrecisionFormat;
            
            WebGLRenderingContext.prototype.getShaderPrecisionFormat = function (shadertype, precisiontype) {
                if (precisiontype === 35632) { // FLOAT
                    return { rangeMin: -127, rangeMax: 127, precision: 23 };
                }
                if (precisiontype === 35633) { // MEDIUM FLOAT
                    return { rangeMin: -14, rangeMax: 14, precision: 10 };
                }
                if (precisiontype === 35634) { // LOW FLOAT
                    return { rangeMin: -8, rangeMax: 8, precision: 5 };
                }
                return getShaderPrecisionFormat.call(this, shadertype, precisiontype);
            };
        });

        const fakeMemory = [4, 8, 16][Math.floor(Math.random() * 3)];
        const fakeCores = [2, 4, 8, 16][Math.floor(Math.random() * 4)];

        await browser.addInitScript((memory, cores) => {
            Object.defineProperty(navigator, 'deviceMemory', { get: () => memory });
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores });
        }, fakeMemory, fakeCores);

        await browser.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false }); // Bot tespiti engelle
            Object.defineProperty(navigator, 'mediaDevices', {
                get: () => ({
                    enumerateDevices: async () => [],
                    getUserMedia: async () => { throw new Error("Permission denied"); }
                })
            });

            // WebGL sahtekarlığı
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function (parameter) {
                if (parameter === 37445) return "AMD Radeon RX 6700 XT"; 
                if (parameter === 37446) return "Advanced Micro Devices, Inc."; 
                return getParameter.call(this, parameter);
            };

            // Canvas sahtekarlığı
            HTMLCanvasElement.prototype.toDataURL = function () {
                return "data:image/png;base64," + btoa("fake-image");
            };
        });
        for (const keyword of task.Keywords) {
            console.log(`🔍 Arama yapılıyor: ${keyword}`);
            await searchKeywordAndTapAd(page, keyword);
            await page.waitForTimeout(50000);
        }        
    }
    await browser.close();
    console.log("✅ Tüm görevler tamamlandı. Program sonlanıyor.");
    process.exit(0);
})();