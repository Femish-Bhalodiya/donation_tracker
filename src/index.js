require('dotenv').config();
const express = require('express');
const app = express();
const { connectDB } = require('./config/database');
const { startScheduler } = require('./services/scheduler');

app.use(express.json());

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

async function initializeApp() {
  try {
    console.log('📡 Clash of Clans donation tracker starting...');

    // Connect to database first
    await connectDB();
    console.log('✅ Database connection established.');
    startScheduler();

    // Setup Telegram bot
    require('./services/telegramBot')(app);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Express server running on port ${PORT}`);
    });

    console.log('✅ Application initialization completed!');
  } catch (err) {
    console.error('❌ Application initialization failed:', err);
    process.exit(1);
  }
}

initializeApp();