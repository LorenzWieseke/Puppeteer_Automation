const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

const config = require('./config.json'); // Load credentials

puppeteer.use(StealthPlugin());

const COOKIE_PATH = path.join(__dirname, 'instagram_cookies.json');
const USER_DATA_DIR = path.join(__dirname, 'ig_user_data');
const FOLLOWERS_FILE = path.join(__dirname, 'followers.txt');

async function loadCookies(page) {
  try {
    const data = await fs.readFile(COOKIE_PATH, 'utf8');
    const cookies = JSON.parse(data);
    const now = Math.floor(Date.now() / 1000);
    const validCookies = cookies.filter(cookie => !cookie.expires || cookie.expires > now);
    if (validCookies.length > 0) {
      await page.setCookie(...validCookies);
      console.log('Loaded valid Instagram cookies.');
      return true;
    }
  } catch (e) {
    console.log('No valid Instagram cookies found.');
  }
  return false;
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  await fs.writeFile(COOKIE_PATH, JSON.stringify(cookies, null, 2));
  console.log('Instagram cookies saved.');
}

async function login(page) {
  console.log('Logging into Instagram...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', config.instagram.username, { delay: 100 });
  await page.type('input[name="password"]', config.instagram.password, { delay: 100 });

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('Instagram login successful.');
  await saveCookies(page);
}

async function getFollowers(page) {
  console.log('Navigating to profile...');
  await page.goto(`https://www.instagram.com/${config.instagram.username}/`, { waitUntil: 'networkidle2' });

  console.log('Opening followers list...');
  await page.waitForSelector(`a[href$="/${config.instagram.username}/followers/"]`);
  await page.click(`a[href$="/${config.instagram.username}/followers/"]`);

  await page.waitForSelector('div[role="dialog"]'); // Wait for the followers modal to appear

  console.log('Extracting follower URLs...');
  const followers = new Set();
  let prevHeight = 0;

  while (true) {
    let newFollowers = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div[role="dialog"] a[href^="/"]'))
        .map(el => 'https://www.instagram.com' + el.getAttribute('href')) // Ensure full URLs
        .filter(href => !href.includes('/stories/') && !href.includes('/following/')); // Exclude irrelevant links
    });

    newFollowers.forEach(url => followers.add(url));

    console.log(`Collected ${followers.size} followers...`);

    await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"]'); 
      if (modal) {
        const scrollContainer = modal.querySelector('div.xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6');
        if (scrollContainer) {
          scrollContainer.scrollTo(0, scrollContainer.scrollHeight);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    
    // Check if we reached the bottom
    const newHeight = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"]'); 
      const scrollContainer = modal.querySelector('div.xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6');
      return scrollContainer ? scrollContainer.scrollHeight : 0;
    });

    if (newHeight === prevHeight) break;
    prevHeight = newHeight;
  }

  console.log(`Total followers collected: ${followers.size}`);
  await fs.writeFile(FOLLOWERS_FILE, Array.from(followers).join('\n'));
  console.log(`Follower URLs saved to ${FOLLOWERS_FILE}`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: USER_DATA_DIR,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const cookiesLoaded = await loadCookies(page);
  if (!cookiesLoaded) {
    await login(page);
  } else {
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    console.log('Using stored Instagram session.');
  }

  await getFollowers(page);

  // await browser.close();
})();
