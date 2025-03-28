const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');

puppeteer.use(StealthPlugin());

const COOKIE_PATH = path.join(__dirname, './cookies/instagram_cookies.json');
const USER_DATA_DIR = path.join(__dirname, 'ig_user_data'); // Ensure this directory exists

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

module.exports = { loadCookies, login, USER_DATA_DIR };
