require('dotenv').config();
const express = require('express');
const app = express();
const sequelize = require('./config/database');
const ClanMember = require('./models/ClanMember');
const { processClanMembers } = require('./services/processMembers');
const { fetchAndProcess } = require('./services/scheduler');
const { bot } = require('./services/telegramBot');
require('./services/scheduler'); // Starts cron jobs

app.use(express.json());

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    await ClanMember.sync({ alter: true });
    console.log('✅ Database models synchronized.');
  } catch (err) {
    console.error('❌ DB error:', err);
  }
}

console.log('📡 Clash of Clans donation tracker started!');
testConnection();

require('./services/telegramBot')(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Express server running on port ${PORT}`);
});
