const { chromium, devices } = require('patchright');
const fs = require('fs');

const cityCoordinates = JSON.parse(fs.readFileSync('city_coordinates.json', 'utf-8'));

function getRandomCity(){
  const cities = Object.keys(cityCoordinates);
  const randomIndex = Math.floor(Math.random() * cities.length);
  console.log("Seçilen Şehir:",cities[randomIndex]);
  return cities[randomIndex];
}

function getRandomDevice() {
  mobile_devices = ['Galaxy S8', 'Galaxy S9+', 'Galaxy Tab S4', 'iPad (gen 5)', 'iPad (gen 6)', 'iPad (gen 7)', 'iPad Mini', 
    'iPad Pro 11', 'iPhone 6', 'iPhone 6 Plus', 'iPhone 7', 'iPhone 7 Plus', 'iPhone 8', 'iPhone 8 Plus', 
    'iPhone SE', 'iPhone X', 'iPhone XR', 'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone 12', 
    'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 12 Mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 
    'iPhone 13 Mini', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 
    'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max','LG Optimus L70', 
    'Microsoft Lumia 550', 'Microsoft Lumia 950', 'Nexus 10', 'Nexus 4', 'Nexus 5', 'Nexus 5X', 'Nexus 6', 
    'Nexus 6P', 'Nexus 7', 'Nokia Lumia 520', 'Nokia N9', 'Pixel 2', 'Pixel 2 XL', 'Pixel 3', 'Pixel 4', 
    'Pixel 4a (5G)', 'Pixel 5', 'Pixel 7'];
  const randomIndex = Math.floor(Math.random() * mobile_devices.length);
  const device= devices[mobile_devices[randomIndex]];
  console.log("Seçilen Cihaz:",mobile_devices[randomIndex]);
  return device;
}

async function setupAntiFingerprint(page) {
  await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      Object.defineProperty(navigator, 'mediaDevices', {
          get: () => ({
              enumerateDevices: async () => [],
              getUserMedia: async () => { throw new Error("Permission denied"); }
          })
      });
      Object.defineProperty(navigator, 'userAgentData', { //vm
          get: () => ({
              brands: [
                  { brand: "Chromium", version: "120" },
                  { brand: "Google Chrome", version: "120" }
              ],
              mobile: true,
              //platform: "Android"
          })
      });
      Object.defineProperties(navigator, 'platform', {
          get: () => 'Linux armv8l'
      });

      console.debug = () => {};
  });
}

(async () => {
    const coordinates = cityCoordinates[getRandomCity()];
    for (let i = 0; i < 1; i++) {
      const userDataDir = "UserData"+Math.floor(Math.random() * 1000);
      const device = getRandomDevice();
      const browser = await chromium.launchPersistentContext(userDataDir, {
          channel: "chrome",
          headless: false,
          viewport: device.viewport,
          userAgent: device.userAgent,
          isMobile: true,
          hasTouch: true,
          geolocation: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
          },
          permissions: ['geolocation'],
          //do NOT add custom browser headers or userAgent
      });
        const page = await browser.newPage();
        await setupAntiFingerprint(page);
        
        await page.goto('https://demo.fingerprint.com/playground');
        /*
        const inputLocator = page.locator('[name=q]');
        await inputLocator.click();
        await page.keyboard.type('Hava durumu');
        await page.keyboard.press('Enter');
        */
        await page.waitForTimeout(40000);
        await browser.close();
        try {
          fs.unlinkSync(userDataDir);
          console.log(userDataDir,' Dosyası başarıyla silindi.');
        } catch (err) {
          console.error('Dosya silinirken hata oluştu:', err);
        }        
    }    
})();
