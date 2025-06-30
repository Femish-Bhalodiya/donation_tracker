const cron = require('node-cron');
const { fetchAllClanMembers } = require('./cocApi');
const { processClanMembers } = require('./processMembers');

const FETCH_INTERVAL = '*/10 * * * * *'; // Every 10 seconds

async function fetchAndProcess() {
    try {
        console.log('Starting fetch and process cycle...');
        const members = await fetchAllClanMembers();
        if (members && members.length > 0) {
            await processClanMembers(members);
        }
        console.log('Fetch and process cycle completed');
    } catch (error) {
        console.error('Error in fetchAndProcess:', error);
    }
}

function startScheduler() {
    cron.schedule(FETCH_INTERVAL, async () => {
        await fetchAndProcess();
    });
    console.log('Scheduler started!');
}

module.exports = {
    fetchAndProcess,
    startScheduler
}; 