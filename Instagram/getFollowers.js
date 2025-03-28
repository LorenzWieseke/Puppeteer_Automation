const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');

const FOLLOWERS_FILE = path.join(__dirname, 'followers.json');

async function getFollowers(page) {
  console.log('Navigating to profile...');
  await page.goto(`https://www.instagram.com/${config.instagram.username}/`, { waitUntil: 'networkidle2' });

  console.log('Opening followers list...');
  await page.waitForSelector(`a[href$="/${config.instagram.username}/followers/"]`);
  await page.click(`a[href$="/${config.instagram.username}/followers/"]`);

  await page.waitForSelector('div[role="dialog"]'); // Wait for the followers modal to appear

  console.log('Extracting follower details...');
  const followers = new Map();
  let prevHeight = 0;

  while (true) {
    let newFollowers = await page.evaluate(() => {
      const profileLinks = Array.from(document.querySelectorAll('div[role="dialog"] a[href^="/"]:not([href*="stories"]):not([href*="following"])'));
      const usernames = Array.from(document.querySelectorAll('div[role="dialog"] span.x1lliihq.x193iq5w.x6ikm8r.x10wlt62.xlyipyv.xuxw1ft'));
      
      return profileLinks.map((link, index) => ({
        profileUrl: 'https://www.instagram.com' + link.getAttribute('href'),
        username: usernames[index] ? usernames[index].innerText : 'Unknown'
      }));
    });

    newFollowers.forEach(({ username, profileUrl }) => followers.set(profileUrl, username));
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
    
    const newHeight = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"]');
      const scrollContainer = modal.querySelector('div.xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6');
      return scrollContainer ? scrollContainer.scrollHeight : 0;
    });

    if (newHeight === prevHeight) break;
    prevHeight = newHeight;
  }

  console.log(`Total followers collected: ${followers.size}`);
  await fs.writeFile(FOLLOWERS_FILE, JSON.stringify([...followers.entries()].map(([profileUrl, username]) => ({ username, profileUrl })), null, 2));
  console.log(`Follower details saved to ${FOLLOWERS_FILE}`);
}

module.exports = { getFollowers };