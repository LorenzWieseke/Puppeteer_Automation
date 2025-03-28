const Airtable = require('airtable');
const config = require('./config.json');

// Set up Airtable with your access token and base ID
const airtableBase = new Airtable({ apiKey: config.airtable.accessToken }).base(config.airtable.baseId);

// Function to save records (followers) to Airtable in batches
async function saveRecordsToAirtable() {
  const followers = require('./followers.json');
  console.log(`Saving ${followers.length} followers to Airtable...`);

  const batchSize = 10; // Airtable limit: 10 records per batch
  const recordBatches = [];

  // Split followers into batches of 10
  for (let i = 0; i < followers.length; i += batchSize) {
    recordBatches.push(followers.slice(i, i + batchSize));
  }
  
  // Iterate over each batch and save to Airtable
  for (const batch of recordBatches) {
    try {
      await airtableBase(config.airtable.tableName).create(
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

  console.log('All followers have been successfully written to Airtable.');
}

// Function to fetch all records from Airtable
async function fetchRecordsFromAirtable() {
  const records = [];
  console.log('Fetching records from Airtable...');
  await airtableBase(config.airtable.tableName).select().eachPage((pageRecords, fetchNextPage) => {
    pageRecords.forEach(record => {
      records.push({
        id: record.id,
        fields: record.fields,
      });
    });
    fetchNextPage();
  });
  console.log(`Fetched ${records.length} records from Airtable.`);
  return records;
}

// Function to update a specific record in Airtable
async function updateRecordInAirtable(recordId, updatedFields) {
  try {
    console.log(`Updating record with ID: ${recordId}...`);
    await airtableBase(config.airtable.tableName).update(recordId, {
      fields: updatedFields,
    });
    console.log(`Record with ID: ${recordId} has been updated.`);
  } catch (error) {
    console.error('Error updating record:', error);
  }
}

module.exports = { saveRecordsToAirtable, fetchRecordsFromAirtable, updateRecordInAirtable };
