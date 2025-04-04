const { chromium, devices } = require('patchright');
const fs = require('fs');
const path = require('path');

const cityCoordinates = JSON.parse(fs.readFileSync('city_coordinates.json', 'utf-8'));

function getRandomCity() {
  const cities = Object.keys(cityCoordinates);
  const randomIndex = Math.floor(Math.random() * cities.length);
  console.log("Seçilen Şehir:", cities[randomIndex]);
  return cities[randomIndex];
}

function getRandomDevice() {
  const mobile_devices = ['Galaxy S8', 'Galaxy S9+', 'Galaxy Tab S4', 'iPad (gen 5)', 'iPad (gen 6)', 'iPad (gen 7)', 'iPad Mini',
    'iPad Pro 11', 'iPhone 6', 'iPhone 6 Plus', 'iPhone 7', 'iPhone 7 Plus', 'iPhone 8', 'iPhone 8 Plus',
    'iPhone SE', 'iPhone X', 'iPhone XR', 'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone 12',
    'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 12 Mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone 13 Mini', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15',
    'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'LG Optimus L70',
    'Microsoft Lumia 550', 'Microsoft Lumia 950', 'Nexus 10', 'Nexus 4', 'Nexus 5', 'Nexus 5X', 'Nexus 6',
    'Nexus 6P', 'Nexus 7', 'Nokia Lumia 520', 'Nokia N9', 'Pixel 2', 'Pixel 2 XL', 'Pixel 3', 'Pixel 4',
    'Pixel 4a (5G)', 'Pixel 5', 'Pixel 7'];
  const randomIndex = Math.floor(Math.random() * mobile_devices.length);
  const device = devices[mobile_devices[randomIndex]];
  console.log("Seçilen Cihaz:", mobile_devices[randomIndex]);
  return device;
}

async function setupAntiFingerprint(page) {
  await page.addInitScript(() => {
    // WebDriver Tespiti Engelleme
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

    // Mobil Tarayıcı Bilgileri
    Object.defineProperty(navigator, 'platform', { get: () => "Linux armv81" }); // Android cihazlar için geçerli
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => ({
        brands: [
          { brand: "Google Chrome", version: "122" }, 
          { brand: "Chromium", version: "122" }
        ],
        mobile: true,
        platform: "Android",
        platformVersion: "14",
        architecture: "arm64",
        bitness: "64",
        model: "Pixel 7",
        wow64: false,
        uaFullVersion: "122.0.6261.127"
      })
    });

    // WebRTC (IP sızıntısını engelleme)
    navigator.mediaDevices.enumerateDevices = async () => {
      return [{ kind: "audioinput", label: "", deviceId: "default" }];
    };

    // AudioContext (Ses parmak izi koruma)
    /*
    const oldGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {
      const randomFactor = 0.0001 * Math.random();
      for (let i = 0; i < array.length; i++) {
        array[i] += randomFactor;
      }
      return oldGetFloatFrequencyData.apply(this, arguments);
    };
    */
    // WebGL (GPU Parmak İzini Değiştirme)
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37446) return "Adreno (TM) " + (630 + Math.floor(Math.random() * 20));
      return getParameter.call(this, param);
    };

    //Canvas Fingerprint Spoofing
    HTMLCanvasElement.prototype.getContext = function(type, attributes) {
      const ctx = getContext.apply(this, arguments);
      if (type === '2d') {
        const originalFillText = ctx.fillText;
        ctx.fillText = function(text, x, y, maxWidth) {
          ctx.globalAlpha = 0.99 + Math.random() * 0.02; 
          return originalFillText.apply(this, arguments);
        };
      }
      return ctx;
    };

    // Mobil Dokunmatik Ekran Simülasyonu
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
    Object.defineProperty(navigator, 'hasTouch', { get: () => true });

    //Sensörler (Hareket, Jiroskop)
    window.DeviceMotionEvent = class DeviceMotionEvent extends Event {};
    window.DeviceOrientationEvent = class DeviceOrientationEvent extends Event {};

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

    // Tarayıcı İzinleri (Mobil tarayıcıda bazı izinleri açılmış gibi gösterme)
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

  });
}

function deleteUserDataDirectory() {
  const directoryPath = path.join(__dirname); // Mevcut dizini al
  try {
    // Proje dizinindeki tüm dosya ve klasörleri oku
    const files = fs.readdirSync(directoryPath);

    // 'UserData' ile başlayan tüm klasörleri sil
    files.forEach(file => {
      const filePath = path.join(directoryPath, file); // Dosya yolu
      if (fs.lstatSync(filePath).isDirectory() && file.startsWith('UserData')) { // Eğer klasörse ve 'UserData' ile başlıyorsa
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`Silindi: ${filePath}`);
      }
    });
  } catch (err) {
    console.error('Klasör silme hatası:', err);
  }
}

(async () => {
  deleteUserDataDirectory(); // Kullanıcı verilerini sil

  const coordinates = cityCoordinates[getRandomCity()];
  const userDataDir = "UserData" + Math.floor(Math.random() * 1000);
  const device = devices["Pixel 7"];//getRandomDevice();

  const browser = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless: false,
    viewport: device.viewport,
    userAgent: device.userAgent,
    isMobile: true,
    hasTouch: true,
    maxTouchPoints: "5",
    deviceScaleFactor: device.deviceScaleFactor,
    timezoneId: 'Europe/Istanbul',
    locale: 'tr-TR',
    geolocationEnabled: true,
    geolocation: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuaracy: (Math.floor(Math.random() * 5)+5)
    },
    defaultbrowserType: device.defaultBrowserType,
    permissions: ['geolocation'],
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
    chromiumSandbox: false,
    acceptDownloads: true,
    extraHTTPHeaders: { "DNT": "1", "Upgrade-Insecure-Requests": "1" }
  });

  const [page] = browser.pages();
  await setupAntiFingerprint(page);
  await page.goto('https://demo.fingerprint.com/playground');
  await page.waitForTimeout(10000);
  try {
    const anomalyScore = await page.evaluate(() => {
      const elements = document.querySelectorAll(".json-view--pair"); // Tüm öğeleri al
      for (let element of elements) {
          let key = element.querySelector(".json-view--property")?.innerText.trim();
          if (key === "anomalyScore") { // Doğru div'i bulduk
              return element.querySelector(".json-view--number")?.innerText.trim();
          }
      }
      return "Bulunamadı";
    });
    console.log("Anomaly Score:", anomalyScore);
  } catch (error) {
    console.error("Hata:", error);
  }
  //await page.goto('https://browserleaks.com/javascript');
  await page.waitForTimeout(60000 * 60);

  await browser.close();
})();