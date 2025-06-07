const axios = require('axios');
const { CLAN_TAGS } = require('../config/clans');
require('dotenv').config();

const COC_API_BASE_URL = 'https://api.clashofclans.com/v1';
const COC_API_KEY = process.env.COC_API_KEY;

const cocApi = axios.create({
  baseURL: COC_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${COC_API_KEY}`,
    'Accept': 'application/json'
  }
});

async function fetchClanMembers(clanTag) {
  try {
    const encodedClanTag = clanTag.replace('#', '%23');
    const response = await cocApi.get(`/clans/${encodedClanTag}/members`);
    
    if (response.status === 200) {
      return response.data.items;
    } else {
      throw new Error(`Failed to fetch clan members. Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching clan members:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    return null;
  }
}

async function fetchAllClanMembers() {
  const allMembers = new Map();
  
  // Fetch all clans in parallel
  const clanPromises = CLAN_TAGS.map(async (clanTag) => {
    try {
      const members = await fetchClanMembers(clanTag);
      if (members) {
        // Each member is definitely in this clan at this moment
        members.forEach(member => {
          allMembers.set(member.tag, {
            tag: member.tag,
            name: member.name,
            currentClan: clanTag,
            currentDonation: member.donations
          });
        });
      }
    } catch (error) {
      console.error(`Error fetching clan ${clanTag}:`, error);
    }
  });

  await Promise.all(clanPromises);
  return Array.from(allMembers.values());
}

module.exports = {
  fetchClanMembers,
  fetchAllClanMembers
}; 