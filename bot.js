// bot.js
const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

bot.command('add', async (ctx) => {
  try {
    const [object, ...locationParts] = ctx.message.text.split(' ').slice(1);
    const location = locationParts.join(' ');

    if (!object || !location) {
      return ctx.reply('Usage: /add <object> <location>');
    }

    await axios.get(`${API_BASE}/add?object=${encodeURIComponent(object)}&location=${encodeURIComponent(location)}`);
    ctx.reply(`Added ${object} to ${location}`);
  } catch (error) {
    console.error('Error in /add command:', error);
    ctx.reply('Error adding object. Please try again.');
  }
});

bot.command('search', async (ctx) => {
  try {
    const object = ctx.message.text.split(' ').slice(1).join(' ');

    if (!object) {
      return ctx.reply('Usage: /search <object>');
    }

    const response = await axios.get(`${API_BASE}/search?object=${encodeURIComponent(object)}&format=json`);
    
    // Handle JSON response with fuzzy matches
    if (response.data.matches && Array.isArray(response.data.matches)) {
      if (response.data.matches.length === 0) {
        return ctx.reply(`Could not find location for "${object}"`);
      }

      // Format matches with similarity scores
      let message = `Found ${response.data.matches.length} match${response.data.matches.length > 1 ? 'es' : ''}:\n\n`;
      
      for (const match of response.data.matches) {
        const similarity = match.similarity === 100 ? '✓ Exact' : `${match.similarity}%`;
        message += `📍 <b>${match.object}</b> (${similarity})\n   Location: ${match.location}\n\n`;
      }

      return ctx.replyWithHTML(message);
    }

    // Fallback: handle plain text response
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

bot.catch((err) => {
  console.error('Telegram bot error:', err);
});

bot.launch();
console.log('Telegram bot running...');
module.exports = bot;