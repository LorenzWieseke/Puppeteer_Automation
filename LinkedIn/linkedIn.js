const puppeteer = require('puppeteer');
const fs = require('fs');

// Read login credentials from config.json
const loginData = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Go to LinkedIn login page
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

    // Enter email
    await page.type('#username', loginData.email, { delay: 100 });

    // Enter password
    await page.type('#password', loginData.password, { delay: 100 });

    // Click login button
    await page.click('[type="submit"]');

    // Wait for successful login indication
    await page.waitForSelector('.global-nav__me-photo', { timeout: 10000 });

    console.log("Logged in successfully!");

    // Wait for the Messaging button to appear
    try {
        await page.waitForSelector('a.global-nav__primary-link', { timeout: 5000 });

        // Click the Messaging button using JavaScript execution (more reliable than .click())
        await page.evaluate(() => {
            const messagingButton = [...document.querySelectorAll('a.global-nav__primary-link')]
                .find(el => el.innerText.includes('Nachrichten') || el.href.includes('/messaging/'));

            if (messagingButton) {
                messagingButton.click();
            }
        });

        console.log("Clicked on the Messaging button.");
    } catch (error) {
        console.log("Messaging button not found or click failed.");
    }

    // Wait for the message input box
    try {
        await page.waitForSelector('div.msg-form__contenteditable', { timeout: 5000 });

        // Click inside the message input box
        await page.click('div.msg-form__contenteditable');

        // Type the message
        const messageText = "Hey, freut mich, dich kennenzulernen! Was machst du so?";
        await page.type('div.msg-form__contenteditable', messageText, { delay: 100 });

        // Press Enter to send the message
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');


        console.log("Message sent successfully.");
    } catch (error) {
        console.log("Failed to find or click message input box.", error);
    }

    // Take a screenshot (optional)
    await page.screenshot({ path: 'linkedin-message.png' });

    // Keep the browser open for debugging
    // await browser.close();
})();
