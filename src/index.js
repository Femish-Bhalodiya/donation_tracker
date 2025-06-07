require('dotenv').config();
const express = require('express');
const app = express();
const sequelize = require('./config/database');
const ClanMember = require('./models/ClanMember');
const { processClanMembers } = require('./services/processMembers');
const { fetchAndProcess } = require('./services/scheduler');
const { bot } = require('./services/telegramBot');
require('./services/scheduler'); // Starts cron jobs

// Middleware to parse JSON request bodies
app.use(express.json());

// Keep-alive endpoint (for Render or similar services)
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Test DB connection
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

// Start the application
console.log('📡 Clash of Clans donation tracker started!');
testConnection();

// Setup route for Telegram bot (use the same app instance)
require('./services/telegramBot')(app);  // This will add the /webhook route

// Listen on the port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Express server running on port ${PORT}`);
});
