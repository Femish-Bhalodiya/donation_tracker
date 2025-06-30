// Get clan tags from environment variable
const CLAN_TAGS = process.env.CLAN_TAGS ?
    process.env.CLAN_TAGS.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) :
    [];

// Validate clan tags
if (CLAN_TAGS.length === 0) {
    console.warn('⚠️ No clan tags found in environment variables. Please set CLAN_TAGS in .env file');
}

// Validate each clan tag format
const validClanTags = [];
CLAN_TAGS.forEach(tag => {
    if (!tag.startsWith('#')) {
        console.warn(`⚠️ Clan tag ${tag} should start with #`);
    } else if (tag.length < 2) {
        console.warn(`⚠️ Clan tag ${tag} is too short`);
    } else {
        validClanTags.push(tag);
    }
});

// Export only valid clan tags
module.exports = {
    CLAN_TAGS: validClanTags
}; 