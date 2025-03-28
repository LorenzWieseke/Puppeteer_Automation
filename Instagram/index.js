const puppeteer = require('puppeteer-extra');
const { loadCookies, login, USER_DATA_DIR } = require('./login');
const { getFollowers } = require('./getFollowers');
const { unfollowEveryone } = require('./unfollow');
const { sharePost } = require('./sharePost');
const { saveToAirtable } = require('./saveFollowers');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function runLogin() {
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

  return page;
}

async function runGetFollowers(page) {

  await loadCookies(page);
  await getFollowers(page);
  // await browser.close();

  return page;
}

async function runSaveToAirtable() {
  await saveToAirtable();
}

async function run() {
  // Uncomment each step below to test individually:

  // 1. LOGIN
  let page = await runLogin();
  
  
  // 2. GET FOLLOWERS
  // await runGetFollowers(page);
  
  // 3. SHARE POST
  // await sharePost(page);
  
  // 4. UNFOLLOW EVERYONE
  await unfollowEveryone(page);
  
  // 5. SAVE TO AIRTABLE
  // await runSaveToAirtable();
}

run();
