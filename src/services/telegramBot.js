const TelegramBot = require('node-telegram-bot-api');
const { processClanMembers } = require('../services/processMembers');
const ClanMember = require('../models/ClanMember');

// Configuration
const token = process.env.TEL_TOKEN;
const GROUP_ID = process.env.GROUP_ID;
const COMMAND_COOLDOWN = process.env.TIMELIMIT; // 30 seconds cooldown between commands

// Create a bot instance
const bot = new TelegramBot(token);

// List of allowed Telegram user IDs
const ALLOWED_USERS = new Set([]);

// Track last command usage for rate limiting
const lastCommandUsage = new Map();

// Set bot commands
const commands = [
    { command: 'donation', description: 'Show top donators this season' },
    { command: 'help', description: 'Show available commands' }
];

// Set the commands
bot.setMyCommands(commands)
    .then(() => console.log('Bot commands set successfully'))
    .catch(error => console.error('Error setting bot commands:', error));

// Webhook route for Telegram bot
module.exports = function (app) {
    // /webhook route to handle incoming updates
    app.post('/webhook', async (req, res) => {
        const update = req.body;
        try {
            // Pass the update to the bot's processUpdate method
            await bot.processUpdate(update);
            res.sendStatus(200); // Acknowledge Telegram's request
        } catch (error) {
            console.error('Error processing webhook update:', error);
            res.sendStatus(500);
        }
    });

    // Helper function to format numbers with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Check if a user is rate-limited
    function isRateLimited(userId) {
        const lastUsage = lastCommandUsage.get(userId);
        if (!lastUsage) return false;
        const timeSinceLastUse = Date.now() - lastUsage;
        return timeSinceLastUse < COMMAND_COOLDOWN;
    }

    // Update the last command usage time for a user
    function updateLastCommandUsage(userId) {
        lastCommandUsage.set(userId, Date.now());
    }

    // Handle /donation command
    bot.onText(/\/donation/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // Check if message is from the correct group
        if (chatId !== +GROUP_ID) return;

        // Check rate limiting
        if (isRateLimited(userId)) {
            const timeLeft = Math.ceil((COMMAND_COOLDOWN - (Date.now() - lastCommandUsage.get(userId))) / 1000);
            bot.sendMessage(chatId, `Please wait ${timeLeft} seconds before using this command again.`);
            return;
        }

        try {
            // Show typing indicator
            await bot.sendChatAction(chatId, 'typing');

            // Fetch and sort clan members by donations
            const members = await ClanMember.findAll({
                order: [['total_donations', 'DESC']],
                limit: 20
            });

            if (members.length === 0) {
                bot.sendMessage(chatId, 'No donation data available yet.');
                return;
            }

            // Format the message with emojis and better spacing
            let message = '🏆 *Top Donators This Season* 🏆\n\n';
            members.forEach((member, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
                message += `${medal} *${index + 1}.* ${member.name} - ${formatNumber(member.total_donations)} donations\n`;
            });

            // Add timestamp
            message += `\n_Last updated: ${new Date().toLocaleString()}_`;

            // Send the formatted message with markdown
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

            // Update last command usage
            updateLastCommandUsage(userId);
        } catch (error) {
            console.error('Error in /donation command:', error);
            bot.sendMessage(chatId, 'Sorry, there was an error fetching the donation data. Please try again later.');
        }
    });

    // Handle /help command
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        if (chatId !== GROUP_ID) return;

        const helpMessage = `*Available Commands:*\n\n/donation - Show top donators this season\n/help - Show this help message\n\n_Note: Commands can only be used once every 30 seconds._`;
        bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Error handling for the bot
    bot.on('polling_error', (error) => {
        console.error('Polling error:', error);
    });

    console.log('Telegram bot started!');

    // Set webhook for Telegram bot
    const webhookUrl = process.env.WEBHOOK_URL || 'https://yourapp.onrender.com/webhook'; // Make sure this matches your Render deployment URL
    bot.setWebHook(webhookUrl).then(() => {
        console.log(`Webhook set to: ${webhookUrl}`);
    }).catch(error => {
        console.error('Error setting webhook:', error);
    });
};