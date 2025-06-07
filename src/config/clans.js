// Get clan tags from environment variable
const CLAN_TAGS = process.env.CLAN_TAGS ? 
    process.env.CLAN_TAGS.split(',').map(tag => tag.trim()) : 
    [];

// Validate clan tags
if (CLAN_TAGS.length === 0) {
    console.warn('⚠️ No clan tags found in environment variables. Please set CLAN_TAGS in .env file');
}

// Validate each clan tag format
CLAN_TAGS.forEach(tag => {
    if (!tag.startsWith('#')) {
        console.warn(`⚠️ Clan tag ${tag} should start with #`);
    }
});

module.exports = {
    CLAN_TAGS
}; 