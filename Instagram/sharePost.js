const path = require('path');
const config = require('./config.json');
const { fetchRecordsFromAirtable, updateRecordInAirtable } = require('./airtable'); // Updated import

// Define the message to send
const message = "Hey, I just released a new blender add-on to optimize your 3D model for the web. It makes the model smaller, faster, and keeps the quality intact. Could you leave a like? I would really appreciate it!";

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

    console.log('Fetching followers from Airtable...');
    const followersData = await fetchRecordsFromAirtable(); // Updated function call

    console.log('Waiting for search field...');
    const searchInputSelector = 'input[placeholder="Search..."]';
    await page.waitForSelector(searchInputSelector, { visible: true });

    // Process followers in batches of 10
    const batchSize = 10;
    for (let i = 0; i < followersData.length; i += batchSize) {
        const batch = followersData.slice(i, i + batchSize);

        for (const follower of batch) {
            let username = follower.fields.Name;

            console.log(`Searching for ${username}...`);
            await page.type(searchInputSelector, username, { delay: 100 });

            await page.waitForSelector('.x1i10hfl.x1qjc9v5.xjbqb8w.xjqpnuy.xa49m3k.xqeqjp1.x2hbi6w.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xdl72j9.x2lah0s.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x2lwn1j.xeuugli.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1q0g3np.x87ps6o.x1lku1pv.x1a2a7pz.x1dm5mii.x16mil14.xiojian.x1yutycm.x1lliihq.x193iq5w.xh8yej3', { visible: true });

            await page.keyboard.press('Tab');
            await new Promise(resolve => setTimeout(resolve, 200));
            await page.keyboard.press('Space');

            console.log(`Added ${username} to the list.`);
            // Update Airtable record
            await updateRecordInAirtable(follower.id, { "Send Message": true });
        }

        console.log('Waiting for message input field...');
        const messageInputSelector = 'input[placeholder="Write a message..."], input[placeholder="Gib eine Nachricht ein …"]';
        await page.waitForSelector(messageInputSelector, { visible: true });
        await page.type(messageInputSelector, message, { delay: 100 });

        console.log('Sending the batch...');
        const sendButtonClass = 'x1i10hfl xjqpnuy xa49m3k xqeqjp1 x2hbi6w x972fbf xcfux6l x1qhh985 xm0m39n xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x18d9i69 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1q0g3np x1lku1pv x1a2a7pz x6s0dn4 xjyslct x1lq5wgf xgqcy7u x30kzoy x9jhf4c x1ejq31n xd10rxx x1sy0etr x17r0tee x9f619 x9bdzbf x1ypdohk x1f6kntn xwhw2v2 x10w6t97 xl56j7k x17ydfre x1swvt13 x1pi30zi x1n2onr6 x2b8uid xlyipyv x87ps6o xcdnw81 x1i0vuye xh8yej3 x1tu34mt xzloghq x3nfvp2';
        await page.waitForSelector(`div[role="button"][tabindex="0"].${sendButtonClass.replace(/ /g, '.')}`, { visible: true });
        await page.click(`div[role="button"][tabindex="0"].${sendButtonClass.replace(/ /g, '.')}`);
        console.log('Batch sent.');

        console.log('Batch sent. Waiting before processing the next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('All batches processed.');
}

module.exports = { sharePost };
