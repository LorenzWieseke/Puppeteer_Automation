const Airtable = require('airtable');
const config = require('./config.json');

// Set up Airtable with your access token and base ID
const base = new Airtable({ apiKey: config.airtable.accessToken }).base(config.airtable.baseId);

// Function to save followers to Airtable in batches
async function saveToAirtable() {
  const followers = require('./followers.json');
  console.log(`Saving ${followers.length} followers to Airtable...`);

  const batchSize = 10; // Airtable limit: 10 records per batch
  const batches = [];

  // Split followers into batches of 10
  for (let i = 0; i < followers.length; i += batchSize) {
    batches.push(followers.slice(i, i + batchSize));
  }
  
  // Iterate over each batch and save to Airtable
  for (const batch of batches) {
    try {
      // Create a batch request for Airtable
      await base(config.airtable.tableName).create(
        batch.map(follower => ({
          fields: {
            Name: follower.username,
            URL: follower.profileUrl,
          },
        }))
      );
      console.log(`Saved ${batch.length} followers in this batch.`);
    } catch (error) {
      console.error('Error saving followers:', error);
    }
  }

  console.log('Followers have been successfully written to Airtable.');
}

module.exports = { saveToAirtable };
