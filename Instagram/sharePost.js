const path = require('path');
const config = require('./config.json');
// Use local JSON directly without extra parsing/async read:
const followersData = require('./followers.json');

async function sharePost(page) {
    console.log('Navigating to profile...');
    await page.goto(`https://www.instagram.com/${config.instagram.username}/`, { waitUntil: 'networkidle2' });

    console.log('Clicking on reel...');
    const reel = `a[href$="/${config.instagram.username}/reel/DHqycLpCWTB/"]`;
    await page.waitForSelector(reel, { visible: true });
    await page.click(reel);

    console.log('Waiting for share button...');
    const sendBtnSelector = 'button:has(svg[aria-label="Share Post"]), button:has(svg[aria-label="Beitrag teilen"])';
    await page.waitForSelector(sendBtnSelector, { visible: true });
    const shareButton = await page.$(sendBtnSelector);
    if (shareButton) {
        console.log('Share button found, clicking...');
        await shareButton.click();
    } else {
        console.log('Share button NOT found!');
        return;
    }

    console.log('Waiting for search field...');
    // Using the placeholder to identify the search input
    const searchInputSelector = 'input[placeholder="Search..."]';
    await page.waitForSelector(searchInputSelector, { visible: true });

    // Loop through each follower from the local JSON
    for (const follower of followersData) {
        let username = follower.username;

        console.log(`Searching for ${username}...`);

        // Type the username into the search field
        await page.type(searchInputSelector, username, { delay: 100 });
        
        await page.waitForSelector('.x1i10hfl.x1qjc9v5.xjbqb8w.xjqpnuy.xa49m3k.xqeqjp1.x2hbi6w.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xdl72j9.x2lah0s.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x2lwn1j.xeuugli.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1q0g3np.x87ps6o.x1lku1pv.x1a2a7pz.x1dm5mii.x16mil14.xiojian.x1yutycm.x1lliihq.x193iq5w.xh8yej3', { visible: true });

        // Press Tab key to focus on the search result dropdown
        await page.keyboard.press('Tab');
        
        // Wait for the dropdown to update
        await new Promise(resolve => setTimeout(resolve, 200));

        // Press Space key to select the user
        await page.keyboard.press('Space');

        console.log(`List element for ${username} clicked ...`);

    }

    console.log('All users added to the list.');
}

module.exports = { sharePost };
