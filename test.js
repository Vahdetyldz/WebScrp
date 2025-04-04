const { chromium, devices } = require("patchright"); 

(async () => {
  console.log("Tarayıcı başlatılıyor...");
  let browser;

  const randomNumber = Math.floor(Math.random() * 100000000) + 1;
  const formattedNumber = String(randomNumber).padStart(8, "0");
  const userDataDir = `user-data-dir-${formattedNumber}`;
  console.log(userDataDir);

  // iPhone 14 Pro Max cihazı seçildi
  const singleDevice = devices["Iphone 14 Pro Max"];
  console.log("Seçilen cihaz:", singleDevice);

  try {
    browser = await chromium.launchPersistentContext(userDataDir, {
      channel: "chrome",
      ...singleDevice,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--touch-events=enabled",
        "--disable-client-side-phishing-detection",
        "--disable-component-extensions-with-background-pages",
        "--allow-pre-commit-input",
        "--disable-ipc-flooding-protection",
        "--metrics-recording-only",
        "--unsafely-disable-devtools-self-xss-warnings",
        "--disable-back-forward-cache",
        "--disable-features=ImprovedCookieControls,LazyFrameLoading,GlobalMediaControls,DestroyProfileOnBrowserClose,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater,AvoidUnnecessaryBeforeUnloadCheckSync,Translate,HttpsUpgrades,PaintHolding,ThirdPartyStoragePartitioning,LensOverlay,PlzDedicatedWorker",
      ],
      headless: false,
      viewport: { width: 430, height: 873 }, // iPhone 14 Pro Max viewport
      screen: { width: 430, height: 932 }, // iPhone 14 Pro Max ekran boyutu
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/133.0.6943.120 Mobile/15E148 Safari/604.1",
      isMobile: true,
      deviceScaleFactor: 3, // iPhone 14 Pro Max için devicePixelRatio
    });
    console.log("Tarayıcı başarıyla başlatıldı.");

    const pages = browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    console.log("Kullanılan sayfa:", page.url());

    // Sahteleme scriptlerini ekliyoruz
    await page.addInitScript(() => {
      // **Screen Özellikleri için sahteleme**
      const screenProxy = new Proxy(screen, {
        get(target, prop) {
          if (prop === "width") return 430;
          if (prop === "height") return 932;
          if (prop === "availWidth") return 430;
          if (prop === "availHeight") return 932;
          if (prop === "colorDepth") return 24;
          if (prop === "pixelDepth") return 24;
          if (prop === "availTop") return 0;
          if (prop === "availLeft") return 0;
          if (prop === "orientation") {
            return {
              type: "portrait-primary",
              angle: 0,
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => {},
            };
          }
          return Reflect.get(target, prop);
        },
      });

      Object.defineProperty(window, "screen", {
        value: screenProxy,
        writable: false,
        configurable: true,
        enumerable: true,
      });

      // **Window Özellikleri**
      Object.defineProperty(window, "innerWidth", {
        get: () => 430,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        get: () => 873,
        configurable: true,
      });
      Object.defineProperty(window, "outerWidth", {
        get: () => 430,
        configurable: true,
      });
      Object.defineProperty(window, "outerHeight", {
        get: () => 932,
        configurable: true,
      });
      Object.defineProperty(window, "devicePixelRatio", {
        get: () => 3,
        configurable: true,
      });

      // **div.clientHeight için sahteleme**
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        get: function () {
          if (this.tagName === "DIV" && this.id === "test-div") {
            return 873; // browserleaks'in test div'i için
          }
          const style = window.getComputedStyle(this);
          return (
            parseInt(style.height) || this.getBoundingClientRect().height || 873
          );
        },
        configurable: true,
      });

      // **Navigator için Proxy ile tam kontrol**
      const desiredNavigator = {
        // Temel özellikler (Navigator Object için)
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/133.0.6943.120 Mobile/15E148 Safari/604.1",
        appVersion:
          "5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/133.0.6943.120 Mobile/15E148 Safari/604.1",
        appName: "Netscape",
        appCodeName: "Mozilla",
        product: "Gecko",
        productSub: "20030107",
        vendor: "Apple Computer, Inc.",
        vendorSub: "empty",
        buildID: undefined,
        platform: "iPhone",
        oscpu: undefined,
        hardwareConcurrency: 4,
        language: "tr-TR",
        //languages: ["tr-TR", "en-US", "en"], /* Bu kısmı eklediğimiz zaman bot hatası veriyor */
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
    await page.goto("https://demo.fingerprint.com/playground", {
      waitUntil: "networkidle",
    });

    // Bilgileri kontrol et
    const navigatorInfo = await page.evaluate(() => {
      const props = {};
      for (const key in navigator) {
        props[key] = navigator[key];
      }
      return {
        ...props,
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        availTop: screen.availTop,
        availLeft: screen.availLeft,
        orientationType: screen.orientation?.type,
        orientationAngle: screen.orientation?.angle,
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        dateFormat: new Intl.DateTimeFormat("tr-TR").format(new Date()),
      };
    });

    console.log("Navigator Bilgileri:", navigatorInfo);

    // 5 dakika bekle
    await page.waitForTimeout(300000);

    console.log("Tarayıcı kapatılıyor...");
    await browser.close();
    console.log("Tarayıcı başarıyla kapatıldı.");
  } catch (error) {
    console.error("Hata oluştu:", error);
    if (browser) {
      console.log("Hata sonrası tarayıcı kapatılıyor...");
      await browser.close();
    }
  }
})();
