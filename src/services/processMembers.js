const ClanMember = require('../models/ClanMember');

async function processClanMembers(members) {
    if (!members || members.length === 0) {
        console.log('No members to process');
        return;
    }

    for (const member of members) {
        try {
            let clanMember = await ClanMember.findByPk(member.tag);
            const { currentClan, currentDonation } = member;

            if (!clanMember) {
                // New member - initialize with current clan's donation
                await ClanMember.create({
                    tag: member.tag,
                    name: member.name,
                    total_donations: { [currentClan]: currentDonation },
                    last_fetched_donations: { [currentClan]: currentDonation }
                });
                console.log(`Created new member: ${member.name} in clan ${currentClan}`);
            } else {
                // Update existing member
                const lastFetched = clanMember.last_fetched_donations[currentClan] || 0;
                const newTotalDonations = { ...clanMember.total_donations };

                if (lastFetched > currentDonation) {
                    // Member left and rejoined
                    newTotalDonations[currentClan] = (newTotalDonations[currentClan] || 0) + currentDonation;
                    console.log(`Member ${member.name} rejoined clan ${currentClan}`);
                } else if (lastFetched < currentDonation) {
                    // Member donated more
                    const difference = currentDonation - lastFetched;
                    newTotalDonations[currentClan] = (newTotalDonations[currentClan] || 0) + difference;
                    console.log(`Member ${member.name} donated ${difference} more in clan ${currentClan}`);
                }

                // Update last_fetched_donations with current clan's donation
                const updatedLastFetched = { ...clanMember.last_fetched_donations };
                updatedLastFetched[currentClan] = currentDonation;

                await clanMember.update({
                    total_donations: newTotalDonations,
                    last_fetched_donations: updatedLastFetched
                });
            }
        } catch (error) {
            console.error(`Error processing member ${member.name}:`, error);
        }
    }
}

module.exports = {
    processClanMembers
}; 