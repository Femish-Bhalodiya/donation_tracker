const cron = require('node-cron');
const { fetchAllClanMembers } = require('./cocApi');
const { processClanMembers } = require('./processMembers');

const FETCH_INTERVAL = '*/20 * * * * *'; // Every 20 seconds

let isRunning = false; // Lock flag

async function fetchAndProcess() {
    if (isRunning) {
        return;
    }

    isRunning = true;
    console.log('Starting fetch and process cycle...');

    try {
        const members = await fetchAllClanMembers();
        if (members && members.length > 0) {
            await processClanMembers(members);
        }
        console.log('Fetch and process cycle completed');
    } catch (error) {
        console.error('Error in fetchAndProcess:', error);
    } finally {
        isRunning = false;
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
