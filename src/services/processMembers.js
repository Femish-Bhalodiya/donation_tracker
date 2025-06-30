const ClanMember = require('../models/ClanMember');

// Helper function to ensure positive integer
function ensurePositiveInteger(value, defaultValue = 0) {
    const num = parseInt(value);
    return isNaN(num) || num < 0 ? defaultValue : num;
}

async function processClanMembers(members) {
    if (!members || members.length === 0) {
        console.log('No members to process');
        return;
    }

    for (const member of members) {
        try {
            const currentDonation = ensurePositiveInteger(member.currentDonation, 0);
            let clanMember = await ClanMember.findOne({ tag: member.tag });

            if (!clanMember) {
                const newMember = new ClanMember({
                    tag: member.tag,
                    name: member.name,
                    total_donations: new Map([[member.currentClan, currentDonation]]),
                    last_fetched_donations: new Map([[member.currentClan, currentDonation]])
                });
                await newMember.save();
                console.log(`Created new member: ${member.name} in clan ${member.currentClan} with ${currentDonation} donations`);
            } else {
                const lastFetched = ensurePositiveInteger(clanMember.last_fetched_donations.get(member.currentClan), 0);
                const currentTotal = ensurePositiveInteger(clanMember.total_donations.get(member.currentClan), 0);

                let newTotalDonations = currentTotal;
                let hasChanges = false;

                if (lastFetched > currentDonation) {
                    // Member left and rejoined - add current donation to total
                    newTotalDonations = currentTotal + currentDonation;
                    hasChanges = true;
                } else if (lastFetched < currentDonation) {
                    // Member donated more - add only the difference
                    const difference = currentDonation - lastFetched;
                    newTotalDonations = currentTotal + difference;
                    hasChanges = true;
                }

                if (hasChanges) {
                    clanMember.total_donations.set(member.currentClan, newTotalDonations);
                    clanMember.last_fetched_donations.set(member.currentClan, currentDonation);

                    await clanMember.save();

                    console.log(`Updated donations for ${member.name} in clan ${member.currentClan}: ${newTotalDonations}`);
                }
            }
        } catch (error) {
            console.error(`Error processing member ${member.name}:`, error);
        }
    }
}

module.exports = {
    processClanMembers
}; 