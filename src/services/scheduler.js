const cron = require('node-cron');
const { fetchAllClanMembers } = require('./cocApi');
const { processClanMembers } = require('./processMembers');

// Configuration
const FETCH_INTERVAL = '*/10 * * * * *'; // Every 10 seconds

// Function to fetch and process clan members
async function fetchAndProcess() {
    try {
        console.log('Starting fetch and process cycle...');
        const members = await fetchAllClanMembers();
        if (members && members.length > 0) {
            console.log(`Processing ${members.length} members from all clans...`);
            await processClanMembers(members);
        }
        console.log('Fetch and process cycle completed');
    } catch (error) {
        console.error('Error in fetchAndProcess:', error);
    }
}

// Schedule data fetching (every 10 seconds)
cron.schedule(FETCH_INTERVAL, async () => {
    await fetchAndProcess();
});

// Initial fetch
console.log('Starting initial fetch...');
fetchAndProcess().catch(error => {
    console.error('Error in initial fetch:', error);
});

console.log('Scheduler started!');

module.exports = {
    fetchAndProcess
}; 