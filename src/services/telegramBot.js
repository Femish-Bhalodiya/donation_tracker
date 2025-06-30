const TelegramBot = require('node-telegram-bot-api');
const ClanMember = require('../models/ClanMember');
const { CLAN_TAGS } = require('../config/clans');

// Configuration
const token = process.env.TEL_TOKEN;
const GROUP_ID = process.env.GROUP_ID;
const COMMAND_COOLDOWN = process.env.TIMELIMIT;

// Create a bot instance with webhook for production
const bot = new TelegramBot(token);

// Track last command usage for rate limiting
const lastCommandUsage = new Map();

// Set bot commands
const commands = [
    { command: 'clanlist', description: 'Show donations list by clans' },
    { command: 'donation', description: 'Show top donators this season' },
    { command: 'help', description: 'Show available commands' }
];

// Set the commands
bot.setMyCommands(commands)
    .then(() => console.log('Bot commands set successfully'))
    .catch(error => console.error('Error setting bot commands:', error));

function escapeMarkdown(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

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

function ensurePositiveInteger(value, defaultValue = 0) {
    const num = parseInt(value);
    return isNaN(num) || num < 0 ? defaultValue : num;
}

module.exports = function (app) {
    // Webhook route for Telegram bot
    app.post('/webhook', async (req, res) => {
        const update = req.body;
        try {
            await bot.processUpdate(update);
            res.sendStatus(200);
        } catch (error) {
            console.error('Error processing webhook update:', error);
            res.sendStatus(500);
        }
    });

    // Handle /donation command
    bot.onText(/\/donation/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (chatId !== +GROUP_ID) return;
        if (isRateLimited(userId)) {
            const timeLeft = Math.ceil((COMMAND_COOLDOWN - (Date.now() - lastCommandUsage.get(userId))) / 1000);
            bot.sendMessage(chatId, `Please wait ${timeLeft} seconds before using this command again.`);
            return;
        }

        try {
            await bot.sendChatAction(chatId, 'typing');

            const members = await ClanMember.find().lean();

            if (!members || members.length === 0) {
                bot.sendMessage(chatId, 'No donation data available yet.');
                return;
            }

            const membersWithTotal = members.map(member => {
                const totalDonations = Object.values(member.total_donations || {})
                    .reduce((sum, val) => sum + ensurePositiveInteger(val, 0), 0);
                return { ...member, totalDonations };
            }).filter(member => member.totalDonations > 0);

            if (membersWithTotal.length === 0) {
                bot.sendMessage(chatId, 'No donation data available yet.');
                return;
            }

            membersWithTotal.sort((a, b) => b.totalDonations - a.totalDonations);

            let message = '🏆 *Top Donators This Season* 🏆\n\n';
            membersWithTotal.forEach((member, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
                const escapedName = escapeMarkdown(member.name);
                message += `${medal} *${index + 1}.* ${escapedName} - ${formatNumber(member.totalDonations)}\n`;
            });
            message += `\n_Last updated: ${new Date().toLocaleString()}_`;

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            updateLastCommandUsage(userId);
        } catch (error) {
            console.error('Error in /donation command:', error);
            bot.sendMessage(chatId, 'Sorry, there was an error fetching the donation data. Please try again later.');
        }
    });

    // Handle /clanlist command
    bot.onText(/\/clanlist/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (chatId !== +GROUP_ID) return;
        if (isRateLimited(userId)) {
            const timeLeft = Math.ceil((COMMAND_COOLDOWN - (Date.now() - lastCommandUsage.get(userId))) / 1000);
            bot.sendMessage(chatId, `Please wait ${timeLeft} seconds before using this command again.`);
            return;
        }

        try {
            await bot.sendChatAction(chatId, 'typing');

            const members = await ClanMember.find().lean();
            if (!members || members.length === 0) {
                bot.sendMessage(chatId, 'No donation data available yet.');
                return;
            }

            // Group members by clan
            const clanDonations = {};
            CLAN_TAGS.forEach(clanTag => {
                clanDonations[clanTag] = [];
            });

            members.forEach(member => {
                if (member.total_donations && typeof member.total_donations === 'object') {
                    Object.entries(member.total_donations).forEach(([clanTag, donations]) => {
                        const safeDonations = ensurePositiveInteger(donations, 0);
                        if (safeDonations > 0) {
                            clanDonations[clanTag].push({
                                name: member.name,
                                donations: safeDonations
                            });
                        }
                    });
                }
            });

            let message = '📊 *Donations by Clan* 📊\n\n';
            let hasData = false;

            for (const [clanTag, members] of Object.entries(clanDonations)) {
                if (members.length > 0) {
                    hasData = true;
                    // Escape clan tag for Markdown
                    message += `*${escapeMarkdown(clanTag)}*\n`;
                    members
                        .sort((a, b) => b.donations - a.donations)
                        .forEach((member, index) => {
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
                            // Escape member name for Markdown
                            const escapedName = escapeMarkdown(member.name);
                            message += `${medal} ${escapedName} - ${formatNumber(member.donations)}\n`;
                        });
                    message += '\n';
                }
            }

            if (!hasData) {
                bot.sendMessage(chatId, 'No donation data available yet.');
                return;
            }

            message += `_Last updated: ${new Date().toLocaleString()}_`;

            // Try sending with Markdown first, if it fails, send as plain text
            try {
                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } catch (markdownError) {
                console.error('Markdown parsing error:', markdownError);
                // If Markdown fails, send as plain text
                const plainMessage = message
                    .replace(/\*/g, '')  // Remove asterisks
                    .replace(/_/g, '');   // Remove underscores
                await bot.sendMessage(chatId, plainMessage);
            }
            updateLastCommandUsage(userId);
        } catch (error) {
            console.error('Error in /clanlist command:', error);
            bot.sendMessage(chatId, 'Sorry, there was an error fetching the donation data. Please try again later.');
        }
    });

    // Handle /help command
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        if (chatId !== GROUP_ID) return;

        const helpMessage = `*Available Commands:*\n\n` +
            `/donation - Show top donators this season\n` +
            `/clanlist - Show donations list by clans\n` +
            `/help - Show this help message\n\n` +
            `_Note: Commands can only be used once every 30 seconds._`;

        bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Error handling for the bot
    bot.on('polling_error', (error) => {
        console.error('Polling error:', error);
    });

    // Set webhook for Telegram bot
    const webhookUrl = process.env.WEBHOOK_URL || "https://donation-tracker-eyp4.onrender.com/webhook"
    bot.setWebHook(webhookUrl).then(() => {
        console.log(`Webhook set to: ${webhookUrl}`);
    }).catch(error => {
        console.error('Error setting webhook:', error);
    });

    console.log('Telegram bot started in webhook mode!');
};