const config = require('./config.json');

// Helper function to return a random delay between min and max milliseconds.
function waitRandom(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function unfollowEveryone(page) {
  console.log('Navigating to profile...');
  await page.goto(`https://www.instagram.com/${config.instagram.username}/`, { waitUntil: 'networkidle2' });

  console.log('Opening following list...');
  await page.waitForSelector(`a[href$="/${config.instagram.username}/following/"]`);
  await page.click(`a[href$="/${config.instagram.username}/following/"]`);

  // Wait for the following modal dialog
  await page.waitForSelector('div[role="dialog"]');

  // Get the scroll container in the modal (the same element used for scrolling later)
  const scrollContainerSelector = 'div.xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6';
  let scrollContainer = await page.waitForSelector(scrollContainerSelector);

  console.log('Unfollowing everyone...');
  let prevHeight = 0;

  while (true) {
    // Get every button that is a child of the scroll container
    let unfollowButtons = await scrollContainer.$$('button');

    for (let button of unfollowButtons) {
      try {
        // Get the text content of the button (e.g., "Following" or "Follow")
        const buttonText = await button.evaluate(el => el.innerText);
        console.log('Button text:', buttonText);
        // Skip if the button text is "Following" (already unfollowed)
        if (buttonText != 'Following') {
          console.log('Skipping already unfollowed user');
          continue;
        }

        // Click the unfollow button
        await button.click();

        // Wait a random time between 1000ms and 2000ms before checking for the confirmation button
        await waitRandom(500, 2000);

        // Use a query selector approach within the page context to find the "Unfollow" confirmation button
        const confirmClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const confirmButton = buttons.find(btn => btn.innerText.includes('Unfollow'));
          if (confirmButton) {
            confirmButton.click();
            return true;
          }
          return false;
        });

        if (confirmClicked) {
          console.log('Unfollowed one person.');
        }

        // Wait a random time between 1500ms and 3000ms to avoid rapid actions
        await waitRandom(500, 2000);
      } catch (error) {
        console.log('Error unfollowing:', error.message);
      }
    }

    // Scroll down the container to load more buttons
    await page.evaluate((selector) => {
      const container = document.querySelector(selector);
      if (container) {
        container.scrollTo(0, container.scrollHeight);
      }
    }, scrollContainerSelector);

    // Wait a random time before checking the new scroll height
    await waitRandom(2500, 5000);

    // Check if we've reached the bottom of the scroll container
    const newHeight = await page.evaluate((selector) => {
      const container = document.querySelector(selector);
      return container ? container.scrollHeight : 0;
    }, scrollContainerSelector);

    if (newHeight === prevHeight) break;
    prevHeight = newHeight;
  }

  console.log('Unfollow process complete.');
}

module.exports = { unfollowEveryone };
