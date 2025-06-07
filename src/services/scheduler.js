const cron = require('node-cron');
const { fetchAllClanMembers } = require('./cocApi');
const { processClanMembers } = require('./processMembers');
const ClanMember = require('../models/ClanMember');

// Configuration
const FETCH_INTERVAL = '*/10 * * * * *'; // Every 10 seconds
const RESET_INTERVAL = '0 0 1 * *'; // First day of every month at midnight
const PAUSE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

let isFetchingPaused = false;

// Function to reset all donations
async function resetDonations() {
    try {
        console.log('Starting monthly donation reset...');
        const result = await ClanMember.update(
            { 
                total_donations: {},
                last_fetched_donations: {}
            },
            { where: {} }
        );
        console.log(`Reset completed. Updated ${result[0]} records.`);
    } catch (error) {
        console.error('Error resetting donations:', error);
    }
}

// Function to pause fetching for 1 hour
function pauseFetching() {
    isFetchingPaused = true;
    console.log('Fetching paused for 1 hour');
    
    setTimeout(() => {
        isFetchingPaused = false;
        console.log('Fetching resumed');
    }, PAUSE_DURATION);
}

// Function to fetch and process clan members
async function fetchAndProcess() {
    if (isFetchingPaused) {
        console.log('Processing is paused');
        return;
    }

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

// Schedule donation reset (first day of every month at midnight)
cron.schedule(RESET_INTERVAL, async () => {
    console.log('Running monthly reset...');
    await resetDonations();
    pauseFetching();
});

// Schedule data fetching (every 10 seconds when not paused)
cron.schedule(FETCH_INTERVAL, async () => {
    if (!isFetchingPaused) {
        await fetchAndProcess();
    }
});

// Initial fetch
console.log('Starting initial fetch...');
fetchAndProcess().catch(error => {
    console.error('Error in initial fetch:', error);
});

console.log('Scheduler started!');

module.exports = {
    fetchAndProcess,
    resetDonations,
    pauseFetching
}; 