const { chromium, devices } = require("patchright"); 
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Site listesi
const sites = [
  { name: "Fingerprint Demo", url: "https://demo.fingerprint.com/playground" },
  { name: "Bot Sannysoft", url: "https://bot.sannysoft.com/" },
  { name: "Browser Leaks", url: "https://browserleaks.com/javascript" },
  { name: "Browser Scan", url: "https://www.browserscan.net/bot-detection" },
  
];

// Kullanıcıdan girdi almak için readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Site seçim fonksiyonu
function selectSite() {
  return new Promise((resolve) => {
    console.log("\nLütfen bir site seçin:");
    sites.forEach((site, index) => {
      console.log(`${index + 1}. ${site.name}`);
    });
    
    rl.question("\nSeçiminiz: ", (answer) => {
      const choice = parseInt(answer);
      if (choice >= 1 && choice <= sites.length) {
        rl.close();
        resolve(sites[choice - 1].url);
      } else {
        console.log("Geçersiz seçim! Lütfen tekrar deneyin.");
        selectSite().then(resolve);
      }
    });
  });
}

function deleteUserDataDirectory() {
  const directoryPath = path.join(__dirname);
  try {
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      if (fs.lstatSync(filePath).isDirectory() && file.startsWith('user-data')) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    });
  } catch (err) {
    console.error('Klasör silme hatası:', err);
  }
}

(async () => {
  const selectedUrl = await selectSite();
  deleteUserDataDirectory();
  let browser;

  const randomNumber = Math.floor(Math.random() * 100000000) + 1;
  const formattedNumber = String(randomNumber).padStart(8, "0");
  const userDataDir = `user-data-dir-${formattedNumber}`;
  const singleDevice = devices["iPhone 14 Pro Max"];

  try {
    browser = await chromium.launchPersistentContext(userDataDir, {
      channel: "chrome",
      headless: false,
      viewport: singleDevice.viewport, // iPhone 14 Pro Max viewport
      screen: singleDevice.screen, // iPhone 14 Pro Max ekran boyutu
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.0.0 Mobile/15E148 Safari/604.1",
      isMobile: true,
      deviceScaleFactor: 3, // iPhone 14 Pro Max için devicePixelRatio
    });

    const pages = browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Sahteleme scriptlerini ekliyoruz
    await page.addInitScript(() => {
      /*Bu kodu eklediğimiz zaman:
      -finger print browser tampering hatası veriyor
      -Bot Sannysoft
      -Browser Scan testlerinden geçiyor
      */
      Object.defineProperty(window, 'chrome', {
        get: () => ({
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        })
      }); 

      // **Navigator için Proxy ile tam kontrol**
      const desiredNavigator = {
        // Temel özellikler (Navigator Object için)
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.0.0 Mobile/15E148 Safari/604.1",
        appVersion:
          "5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.0.0 Mobile/15E148 Safari/604.1",
        product: "Gecko",
        productSub: "20030107",
        vendor: "Apple Computer, Inc.",
        vendorSub: "empty",
        buildID: undefined,
        platform: 'iPhone',
        oscpu: undefined,
        hardwareConcurrency: 4,
        language: "tr-TR",
        //languages: ["tr-TR","tr", "en-US", "en"], /* Bu kısmı eklediğimiz zaman bot hatası veriyor */
        deviceMemory: undefined,
        onLine: true,
        doNotTrack: undefined,
        cookieEnabled: true,
        maxTouchPoints: 5,
        webdriver: false,
        pdfViewerEnabled: true,
        globalPrivacyControl: undefined,

        connection: undefined,
        bluetooth: undefined,

        // Ekran görüntüsünde görünen "Rest of window.navigator" özellikleri
        standalone: false,
        clipboard: { toString: () => "[object Clipboard]" },
        audioSession: { toString: () => "[object AudioSession]" },
        credentials: { toString: () => "[object CredentialsContainer]" },
        geolocation: { toString: () => "[object Geolocation]" },
        mediaCapabilities: { toString: () => "[object MediaCapabilities]" },
        mediaSession: { toString: () => "[object MediaSession]" },
        mediaDevices: { toString: () => "[object MediaDevices]" },
        wakeLock: { toString: () => "[object WakeLock]" },
        locks: { toString: () => "[object LockManager]" },
        userActivation: { toString: () => "[object UserActivation]" },
        serviceWorker: { toString: () => "[object ServiceWorkerContainer]" },
        storage: { toString: () => "[object StorageManager]" },
        sendBeacon: function sendBeacon() {
          throw new Error("sendBeacon is not implemented");
        },
        requestMediaKeySystemAccess: function requestMediaKeySystemAccess() {
          throw new Error("requestMediaKeySystemAccess is not implemented");
        },
        getGamepads: function getGamepads() {
          throw new Error("getGamepads is not implemented");
        },
        javaEnabled: function javaEnabled() {
          throw new Error("javaEnabled is not implemented");
        },
        canShare: function canShare() {
          throw new Error("canShare is not implemented");
        },
        share: function share() {
          throw new Error("share is not implemented");
        },
      };

      // Fonksiyonların toString değerlerini native code gibi göster
      const spoofFunction = (fn, name) => {
        Object.defineProperty(fn, "toString", {
          value: () => `function ${name}() { [native code] }`,
          configurable: true,
        });
        return fn;
      };

      desiredNavigator.sendBeacon = spoofFunction(
        desiredNavigator.sendBeacon,
        "sendBeacon"
      );
      desiredNavigator.requestMediaKeySystemAccess = spoofFunction(
        desiredNavigator.requestMediaKeySystemAccess,
        "requestMediaKeySystemAccess"
      );
      desiredNavigator.getGamepads = spoofFunction(
        desiredNavigator.getGamepads,
        "getGamepads"
      );
      desiredNavigator.javaEnabled = spoofFunction(
        desiredNavigator.javaEnabled,
        "javaEnabled"
      );
      desiredNavigator.canShare = spoofFunction(
        desiredNavigator.canShare,
        "canShare"
      );
      desiredNavigator.share = spoofFunction(desiredNavigator.share, "share");

      // Navigator nesnesini Proxy ile sar
      const navigatorProxy = new Proxy(desiredNavigator, {
        get(target, prop) {
          if (prop in target) {
            return target[prop];
          }
          return undefined; // İstenmeyen özellikler undefined döner
        },
        ownKeys() {
          return Object.keys(desiredNavigator); // Yalnızca istenen özellikleri listele
        },
        has(target, prop) {
          return prop in target; // İstenmeyen özellikler için false döner
        },
        getOwnPropertyDescriptor(target, prop) {
          if (prop in target) {
            return {
              value: target[prop],
              writable: false,
              enumerable: true,
              configurable: true,
            };
          }
          return undefined; // İstenmeyen özellikler için descriptor yok
        },
      });

      // Navigator nesnesini global olarak değiştir
      Object.defineProperty(window, "navigator", {
        value: navigatorProxy,
        writable: false,
        configurable: true,
      });

      // **DateTimeFormat sahtelemesi**
      Object.defineProperty(Intl.DateTimeFormat.prototype, "resolvedOptions", {
        value: function () {
          return {
            hourcycle: "h23",
            locale: "tr-TR",
            calendar: "gregory",
            numberingSystem: "latn",
            timeZone: "Europe/Istanbul",
            year: "numeric",
            month: "2-digit",
            day: "numeric",
          };
        },
      });

      // **Eklentiler ve mimeType sahtelemesi**
      (() => {
        const makePluginArray = () => {
          const plugins = [
            {
              name: "PDF Viewer",
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              __proto__: Plugin.prototype,
            },
            {
              name: "Chrome PDF Viewer",
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              __proto__: Plugin.prototype,
            },
            {
              name: "Chromium PDF Viewer",
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              __proto__: Plugin.prototype,
            },
            {
              name: "Microsoft Edge PDF Viewer",
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              __proto__: Plugin.prototype,
            },
            {
              name: "WebKit built-in PDF",
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              __proto__: Plugin.prototype,
            },
          ];

          const pluginArray = {
            length: plugins.length,
            item(index) {
              return this[index];
            },
            namedItem(name) {
              return plugins.find((p) => p.name === name) || null;
            },
            refresh: () => {},
            [Symbol.iterator]: function* () {
              for (let i = 0; i < plugins.length; i++) yield this[i];
            },
            __proto__: PluginArray.prototype,
          };
          plugins.forEach((p, i) => (pluginArray[i] = p));
          return pluginArray;
        };

        const makeMimeTypeArray = (plugin) => {
          const mimeTypes = [
            {
              type: "application/pdf",
              suffixes: "pdf",
              description: "PDF (Taşınabilir Belge Biçimi)",
              enabledPlugin: plugin,
              __proto__: MimeType.prototype,
            },
            {
              type: "text/pdf",
              suffixes: "pdf",
              description: "PDF (Taşınabilir Belge Biçimi)",
              enabledPlugin: plugin,
              __proto__: MimeType.prototype,
            },
          ];

          const mimeTypeArray = {
            length: mimeTypes.length,
            item(index) {
              return this[index];
            },
            namedItem(name) {
              return mimeTypes.find((m) => m.type === name) || null;
            },
            [Symbol.iterator]: function* () {
              for (let i = 0; i < mimeTypes.length; i++) yield this[i];
            },
            __proto__: MimeTypeArray.prototype,
          };
          mimeTypes.forEach((m, i) => (mimeTypeArray[i] = m));
          return mimeTypeArray;
        };

        const pluginArray = makePluginArray();
        const mimeTypeArray = makeMimeTypeArray(pluginArray[0]);

        // Proxy navigator'a plugins ve mimeTypes ekle
        desiredNavigator.plugins = pluginArray;
        desiredNavigator.mimeTypes = mimeTypeArray;
      })();

      // **WebGL Sahtelemesi**
      const spoofWebGL = (context) => {
        const originalGetParameter = context.prototype.getParameter;
        context.prototype.getParameter = function (param) {
          if (param === 37445) return "Apple Inc."; // VENDOR
          if (param === 37446) return "Apple GPU"; // RENDERER
          return originalGetParameter.call(this, param);
        };
      };
      if (window.WebGLRenderingContext) spoofWebGL(WebGLRenderingContext);
      if (window.WebGL2RenderingContext) spoofWebGL(WebGL2RenderingContext);
    });

    // Sayfaya git
    await page.goto(selectedUrl);
    //await page.goto("https://bot.sannysoft.com/");

    // 5 dakika bekle
    await page.waitForTimeout(300000);
    await browser.close();
  } catch (error) {
    console.error("Hata oluştu:", error);
    if (browser) {
      console.log("Hata sonrası tarayıcı kapatılıyor...");
      await browser.close();
    }
  }
})();
