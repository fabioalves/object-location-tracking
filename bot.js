// bot.js
const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

bot.command('add', async (ctx) => {
  try {
    const input = ctx.message.text.slice(4).trim(); // Remove '/add' and trim
    let object, location;

    // Check if semicolon separator is used: /add object ; location
    if (input.includes(';')) {
      const parts = input.split(';').map(p => p.trim());
      if (parts.length < 2) {
        return ctx.reply('Usage:\n/add <object> ; <location>\n\nExample:\n/add fones de ouvido ; mesa do escritório');
      }
      object = parts[0];
      location = parts.slice(1).join(';').trim(); // Handle multiple semicolons
    } else {
      // Fallback to original space-separated syntax: /add object location
      const parts = input.split(' ');
      object = parts[0];
      location = parts.slice(1).join(' ');
    }

    if (!object || !location) {
      return ctx.reply('Usage:\n/add <object> ; <location>\n\nExample:\n/add fones de ouvido ; mesa do escritório\n\nOr:\n/add object location');
    }

    await axios.get(`${API_BASE}/add?object=${encodeURIComponent(object)}&location=${encodeURIComponent(location)}`);
    ctx.reply(`✅ Added "${object}" to "${location}"`);
  } catch (error) {
    console.error('Error in /add command:', error);
    ctx.reply('❌ Error adding object. Please try again.');
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

bot.command('clean', async (ctx) => {
  try {
    const parameter = ctx.message.text.split(' ').slice(1).join(' ').trim().toLowerCase();

    if (!parameter) {
      return ctx.reply(
        '⚠️ Please specify what to clean:\n\n' +
        '/clean all — Delete ALL objects from database\n' +
        '/clean <location> — Delete all objects at a specific location\n\n' +
        'Example:\n' +
        '/clean all\n' +
        '/clean mesa do escritório'
      );
    }

    // Store pending clean action with user ID for confirmation
    const userId = ctx.from.id;
    const cleanType = parameter === 'all' ? 'all' : 'location';
    const cleanParam = parameter;

    if (cleanType === 'all') {
      // Ask for confirmation before deleting all
      ctx.reply(
        '🚨 WARNING: This will DELETE ALL objects from the database!\n\n' +
        'Type: /confirm-clean-all\n' +
        'To cancel: /cancel',
        {
          extra: {
            pending_action: { type: 'clean_all', userId, timestamp: Date.now() }
          }
        }
      );
      // Store in memory (you could use Redis for persistence)
      global.pendingClean = { userId, type: 'all', timestamp: Date.now() };
    } else {
      // Ask for confirmation before deleting location
      ctx.reply(
        `🚨 WARNING: This will DELETE ALL objects at location: "${cleanParam}"\n\n` +
        `Type: /confirm-clean-location ${cleanParam}\n` +
        'To cancel: /cancel',
        {
          extra: {
            pending_action: { type: 'clean_location', userId, location: cleanParam, timestamp: Date.now() }
          }
        }
      );
      // Store in memory
      global.pendingClean = { userId, type: 'location', location: cleanParam, timestamp: Date.now() };
    }
  } catch (error) {
    console.error('Error in /clean command:', error);
    ctx.reply('❌ Error processing clean command. Please try again.');
  }
});

bot.command('confirm-clean-all', async (ctx) => {
  try {
    const userId = ctx.from.id;

    // Verify there's a pending clean action for this user
    if (!global.pendingClean || global.pendingClean.userId !== userId || global.pendingClean.type !== 'all') {
      return ctx.reply('⚠️ No pending clean operation. Use /clean all first.');
    }

    // Check timeout (5 minutes)
    if (Date.now() - global.pendingClean.timestamp > 5 * 60 * 1000) {
      delete global.pendingClean;
      return ctx.reply('⏰ Clean operation expired. Please use /clean all again.');
    }

    // Execute delete all
    const response = await axios.get(`${API_BASE}/clean?type=all`);
    delete global.pendingClean;

    ctx.reply(
      `✅ Database cleaned successfully!\n\n` +
      `${response.data.message || 'All objects have been deleted.'}`
    );
  } catch (error) {
    console.error('Error in /confirm-clean-all command:', error);
    ctx.reply('❌ Error deleting objects. Please try again.');
  }
});

bot.command('confirm-clean-location', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const location = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (!location) {
      return ctx.reply('⚠️ Please specify the location to clean: /confirm-clean-location <location>');
    }

    // Verify there's a pending clean action for this user and location
    if (!global.pendingClean || global.pendingClean.userId !== userId || global.pendingClean.type !== 'location') {
      return ctx.reply('⚠️ No pending clean operation. Use /clean <location> first.');
    }

    if (global.pendingClean.location.toLowerCase() !== location.toLowerCase()) {
      return ctx.reply(`⚠️ Location mismatch. Pending: "${global.pendingClean.location}", Provided: "${location}"`);
    }

    // Check timeout (5 minutes)
    if (Date.now() - global.pendingClean.timestamp > 5 * 60 * 1000) {
      delete global.pendingClean;
      return ctx.reply('⏰ Clean operation expired. Please use /clean <location> again.');
    }

    // Execute delete location
    const response = await axios.get(`${API_BASE}/clean?type=location&location=${encodeURIComponent(location)}`);
    delete global.pendingClean;

    ctx.reply(
      `✅ Location cleaned successfully!\n\n` +
      `${response.data.message || `All objects at "${location}" have been deleted.`}`
    );
  } catch (error) {
    console.error('Error in /confirm-clean-location command:', error);
    ctx.reply('❌ Error deleting objects. Please try again.');
  }
});

bot.command('cancel', (ctx) => {
  const userId = ctx.from.id;

  if (global.pendingClean && global.pendingClean.userId === userId) {
    delete global.pendingClean;
    ctx.reply('✅ Clean operation cancelled.');
  } else {
    ctx.reply('⚠️ No pending operation to cancel.');
  }
});

bot.command('help', (ctx) => {
  ctx.reply(
    'Olá! Eu posso te ajudar a localizar objetos 📦\n\n' +
    'Comandos disponíveis:\n' +
    '/add <objeto> ; <local> — Guarda o objeto em um local\n' +
    '/search <objeto> — Encontra em que local o objeto está\n' +
    '/clean <local> — Remove objetos de uma localização\n' +
    '/clean all — Remove TUDO do banco de dados\n\n' +
    'Exemplo:\n' +
    '/add fones de ouvido ; mesa do escritório\n' +
    '/search fones de ouvido\n' +
    '/clean mesa do escritório\n' +
    '/clean all'
  );
});

// Register commands with Telegram (shows in "/" menu)
bot.telegram.setMyCommands([
  {
    command: 'add',
    description: 'Adicionar objeto: /add <objeto> ; <local>'
  },
  {
    command: 'search',
    description: 'Procurar objeto'
  },
  {
    command: 'clean',
    description: 'Limpar banco de dados (requer confirmação)'
  },
  {
    command: 'help',
    description: 'Mostrar ajuda e comandos disponíveis'
  }
]);

bot.catch((err) => {
  console.error('Telegram bot error:', err);
});

bot.launch();
console.log('Telegram bot running...');
module.exports = bot;