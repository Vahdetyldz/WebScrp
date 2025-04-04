const { chromium } = require('patchright');
const fs = require('fs');
const path = require('path');

const cityCoordinates = JSON.parse(fs.readFileSync('city_coordinates.json', 'utf-8'));

function getRandomCity() {
  const cities = Object.keys(cityCoordinates);
  const randomIndex = Math.floor(Math.random() * cities.length);
  console.log("Seçilen Şehir:", cities[randomIndex]);
  return cities[randomIndex];
}

async function setupAntiFingerprint(page) {
  try {
    await page.addInitScript(() => {
      // WebDriver Tespiti Engelleme
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'driver', { get: () => undefined });
      Object.defineProperty(navigator, 'automation', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', { get: () => ['tr-TR', 'tr', 'en-US', 'en'] });
      Object.defineProperty(navigator, 'language', { get: () => 'tr-TR' });
      Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
      Object.defineProperty(navigator, 'vendorSub', { get: () => '' });
      Object.defineProperty(navigator, 'productSub', { get: () => '20030107' });
      Object.defineProperty(navigator, 'product', { get: () => 'Gecko' });
      Object.defineProperty(navigator, 'appVersion', { get: () => '5.0 (Linux; Android 11; Redmi Note 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.127 Mobile Safari/537.36' });
      Object.defineProperty(navigator, 'platform', { get: () => 'Linux armv81' });
      Object.defineProperty(navigator, 'oscpu', { get: () => 'Linux armv81' });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => ({
          brands: [
            { brand: "Google Chrome", version: "122" },
            { brand: "Chromium", version: "122" }
          ],
          mobile: true,
          platform: "Android",
          platformVersion: "11",
          architecture: "arm64",
          bitness: "64",
          model: "Redmi Note 11",
          wow64: false,
          uaFullVersion: "122.0.6261.127"
        })
      });

      // WebRTC (IP sızıntısını engelleme)
      navigator.mediaDevices.enumerateDevices = async () => {
        return [{ kind: "audioinput", label: "", deviceId: "default" }];
      };

      // WebGL (GPU Parmak İzini Değiştirme)
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 37446) return "Mali-G78";
        if (param === 37445) return "ARM";
        if (param === 7937) return "WebGL GLSL ES 1.0";
        if (param === 35724) return "WebGL GLSL ES 2.0";
        if (param === 36349) return "WebGL GLSL ES 3.0";
        return getParameter.call(this, param);
      };

      // Canvas Fingerprint Spoofing
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, attributes) {
        const context = originalGetContext.call(this, type, attributes);
        if (type === '2d') {
          const originalGetImageData = context.getImageData;
          context.getImageData = function() {
            const imageData = originalGetImageData.apply(this, arguments);
            for (let i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] += Math.floor(Math.random() * 2);
              imageData.data[i + 1] += Math.floor(Math.random() * 2);
              imageData.data[i + 2] += Math.floor(Math.random() * 2);
            }
            return imageData;
          };
        }
        return context;
      };

      // Mobil Dokunmatik Ekran Simülasyonu
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
      Object.defineProperty(navigator, 'hasTouch', { get: () => true });

      // Sensörler (Hareket, Jiroskop)
      window.DeviceMotionEvent = class DeviceMotionEvent extends Event {
        constructor(type, eventInitDict) {
          super(type, eventInitDict);
          this.acceleration = { x: 0, y: 0, z: 0 };
          this.accelerationIncludingGravity = { x: 0, y: 9.81, z: 0 };
          this.rotationRate = { alpha: 0, beta: 0, gamma: 0 };
          this.interval = 16;
        }
      };

      window.DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
        constructor(type, eventInitDict) {
          super(type, eventInitDict);
          this.alpha = 0;
          this.beta = 0;
          this.gamma = 0;
          this.absolute = true;
        }
      };

      // Ağ Bilgileri
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          downlink: 10,
          effectiveType: "4g",
          rtt: 50,
          saveData: false,
          type: "cellular"
        })
      });

      // Mobil Yazı Tipleri
      Object.defineProperty(navigator, 'fonts', {
        get: () => ["Arial", "Verdana", "Times New Roman", "Courier New", "Georgia", "Roboto", "San Francisco"]
      });

      // Tarayıcı İzinleri
      const fakePermission = {
        state: 'granted',
        onchange: null
      };
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === 'geolocation' || parameters.name === 'notifications') {
          return Promise.resolve(fakePermission);
        }
        return originalQuery(parameters);
      };

      // Plugin ve MIME Tipleri
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
          { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" }
        ]
      });

      Object.defineProperty(navigator, "mimeTypes", {
        get: () => [
          { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" }
        ]
      });

      // Battery API
      Object.defineProperty(navigator, "getBattery", {
        get: () => () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: 0.85
        })
      });

      // Clipboard API
      navigator.clipboard = {
        readText: () => Promise.reject(new Error('Permission denied')),
        writeText: () => Promise.reject(new Error('Permission denied')),
        read: () => Promise.reject(new Error('Permission denied')),
        write: () => Promise.reject(new Error('Permission denied'))
      };

      // Gamepad API
      navigator.getGamepads = () => [];
      navigator.webkitGetGamepads = () => [];
      navigator.webkitGamepads = [];

      // Vibration API
      navigator.vibrate = () => true;

      // Notification API
      window.Notification = class Notification extends Event {
        constructor(title, options) {
          super('notification');
          this.title = title;
          this.options = options;
        }
        static requestPermission() {
          return Promise.resolve('granted');
        }
      };

      // Storage API
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key.includes('fingerprint') || key.includes('tracking')) {
          return;
        }
        return originalSetItem.call(this, key, value);
      };

      // IndexedDB
      const originalOpen = indexedDB.open;
      indexedDB.open = function(name, version) {
        if (name.includes('fingerprint') || name.includes('tracking')) {
          return {
            onerror: () => {},
            onsuccess: () => {},
            onupgradeneeded: () => {}
          };
        }
        return originalOpen.call(this, name, version);
      };

      // JavaScript Agent için gerekli özellikler
      Object.defineProperty(window, 'chrome', {
        get: () => ({
          runtime: {},
          loadTimes: () => {},
          csi: () => {},
          app: {}
        })
      });

      // Origin kontrolü için gerekli özellikler
      Object.defineProperty(document, 'domain', {
        get: () => 'demo.fingerprint.com'
      });

      // Security Policy
      Object.defineProperty(document, 'referrer', {
        get: () => 'https://demo.fingerprint.com/'
      });

      // JavaScript Agent için ek özellikler
      Object.defineProperty(window, 'FingerprintJS', {
        get: () => ({
          load: () => Promise.resolve({
            get: () => Promise.resolve({
              visitorId: 'test123',
              confidence: { score: 0.9 },
              components: {}
            })
          })
        })
      });

      // Origin kontrolü için ek özellikler
      Object.defineProperty(window, 'location', {
        get: () => ({
          href: 'https://demo.fingerprint.com/playground',
          origin: 'https://demo.fingerprint.com',
          protocol: 'https:',
          host: 'demo.fingerprint.com',
          hostname: 'demo.fingerprint.com',
          port: '',
          pathname: '/playground',
          search: '',
          hash: ''
        })
      });

      // Security Policy için ek özellikler
      Object.defineProperty(window, 'top', {
        get: () => window
      });

      Object.defineProperty(window, 'parent', {
        get: () => window
      });

      Object.defineProperty(window, 'frameElement', {
        get: () => null
      });
    });
  } catch (error) {
    console.error('Anti-fingerprint kurulum hatası:', error);
  }
}

function deleteUserDataDirectory() {
  const directoryPath = path.join(__dirname);
  try {
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      if (fs.lstatSync(filePath).isDirectory() && file.startsWith('UserData')) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`Silindi: ${filePath}`);
      }
    });
  } catch (err) {
    console.error('Klasör silme hatası:', err);
  }
}

(async () => {
  deleteUserDataDirectory();

  let browser;
  try {
    const coordinates = cityCoordinates[getRandomCity()];
    const userDataDir = path.join(__dirname, "UserData" + Math.floor(Math.random() * 1000));

    browser = await chromium.launchPersistentContext(userDataDir, {
      channel: "chrome",
      headless: false,
      viewport: { width: 393, height: 851 },
      deviceScaleFactor: 2.75,
      isMobile: true,
      hasTouch: true,
      defaultBrowserType: "chromium",
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-webgl',
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        '--disable-in-process-stack-traces',
        '--disable-histogram-customizer',
        '--disable-gl-extensions',
        '--disable-composited-antialiasing',
        '--disable-canvas-aa',
        '--disable-3d-apis',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--disable-accelerated-mjpeg-decode',
        '--disable-accelerated-video-decode',
        '--disable-gpu-sandbox',
        '--disable-gpu',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-zygote',
        '--use-gl=swiftshader',
        '--window-size=393,851',
        '--origin-trial-disabled-features=AutomationControlled',
        '--disable-features=AutomationControlled',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process,AutomationControlled',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,AutomationControlled',
        '--disable-site-isolation-trials',
        '--disable-features=IsolateOrigins,site-per-process,AutomationControlled,BlockInsecurePrivateNetworkRequests',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,AutomationControlled,BlockInsecurePrivateNetworkRequests',
        '--disable-site-isolation-trials',
        '--disable-features=IsolateOrigins,site-per-process,AutomationControlled,BlockInsecurePrivateNetworkRequests,CrossSiteDocumentBlockingAlways,CrossSiteDocumentBlockingIfIsolating',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,AutomationControlled,BlockInsecurePrivateNetworkRequests,CrossSiteDocumentBlockingAlways,CrossSiteDocumentBlockingIfIsolating'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      timezoneId: 'Europe/Istanbul',
      locale: 'tr-TR',
      geolocation: coordinates,
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Redmi Note 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.127 Mobile Safari/537.36',
        'Origin': 'https://demo.fingerprint.com',
        'Referer': 'https://demo.fingerprint.com/'
      }
    });

    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    await setupAntiFingerprint(page);
    
    // Sayfayı yükle ve yüklenmesini bekle
    console.log("Sayfa yükleniyor...");
    await page.goto('https://demo.fingerprint.com/playground', { waitUntil: 'networkidle', timeout: 60000 });

    // Sayfanın yüklenmesini bekle
    console.log("Sayfa yüklendi, anomaly skor bekleniyor...");
    await page.waitForTimeout(30000);

    // Anomaly score'u kontrol et
    const anomalyScore = await page.evaluate(() => {
      try {
        const elements = document.querySelectorAll(".json-view--pair");
        for (let element of elements) {
          let key = element.querySelector(".json-view--property")?.innerText.trim();
          if (key === "anomalyScore") {
            const score = element.querySelector(".json-view--number")?.innerText.trim();
            console.log("Anomaly score bulundu:", score);
            return score;
          }
        }
        console.log("Anomaly score elementi bulunamadı");
        return "Bulunamadı";
      } catch (error) {
        console.log("Anomaly score kontrolünde hata:", error);
        return "Hata";
      }
    });

    console.log("Anomaly Score:", anomalyScore);

    // Eğer anomaly score bulunamadıysa veya hata varsa, sayfayı yeniden yükle
    if (anomalyScore === "Bulunamadı" || anomalyScore === "Hata") {
      console.log("Anomaly score alınamadı, sayfa yeniden yükleniyor...");
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);
      
      const newAnomalyScore = await page.evaluate(() => {
        try {
          const elements = document.querySelectorAll(".json-view--pair");
          for (let element of elements) {
            let key = element.querySelector(".json-view--property")?.innerText.trim();
            if (key === "anomalyScore") {
              const score = element.querySelector(".json-view--number")?.innerText.trim();
              console.log("Yeni anomaly score bulundu:", score);
              return score;
            }
          }
          console.log("Yeni anomaly score elementi bulunamadı");
          return "Bulunamadı";
        } catch (error) {
          console.log("Yeni anomaly score kontrolünde hata:", error);
          return "Hata";
        }
      });
      
      console.log("Yeni Anomaly Score:", newAnomalyScore);
    }

    // Sayfayı açık tut
    console.log("Sayfa 30 saniye açık tutulacak...");
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error("Ana hata:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();