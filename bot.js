const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

// Initialize bot with token from environment variable
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Add command handler
bot.command('add', async (ctx) => {
  try {
    // Parse command arguments
    const [object, ...locationParts] = ctx.message.text.split(' ').slice(1);
    const location = locationParts.join(' ');

    if (!object || !location) {
      return ctx.reply('Usage: /add <object> <location>');
    }

    // Send request to API
    const response = await axios.get(`http://localhost:3000/add?object=${encodeURIComponent(object)}&location=${encodeURIComponent(location)}`);
    ctx.reply(`Added ${object} to ${location}`);
  } catch (error) {
    console.error('Error in /add command:', error);
    ctx.reply('Error adding object. Please try again.');
  }
});

// Search command handler
bot.command('search', async (ctx) => {
  try {
    // Parse object name
    const object = ctx.message.text.split(' ').slice(1).join(' ');

    if (!object) {
      return ctx.reply('Usage: /search <object>');
    }

    // Query API
    const response = await axios.get(`http://localhost:3000/search?object=${encodeURIComponent(object)}`);
    const location = response.data;

    if (location === 'Not found') {
      ctx.reply(`Could not find location for ${object}`);
    } else {
      ctx.reply(`Location of ${object}: ${location}`);
    }
  } catch (error) {
    console.error('Error in /search command:', error);
    ctx.reply('Error searching for object. Please try again.');
  }
});

// Error handling
bot.catch((err) => {
  console.error('Telegram bot error:', err);
});

// Start bot
bot.launch();
console.log('Telegram bot running...');