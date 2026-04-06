# Object Location Storage System

## Overview
This application provides a REST API for storing and retrieving object locations, with a Telegram bot interface for convenient access. The system is designed to scale with Azure SQL Database, offering reliable data persistence and cloud-based operations.

**Tech Stack:**
- Node.js with Express.js for the REST API
- Telegraf for Telegram bot integration
- Azure SQL Database for data storage
- MSSQL driver for database connectivity

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [API Reference](#api-reference)
6. [Telegram Bot Commands](#telegram-bot-commands)
7. [Database Schema](#database-schema)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Azure SQL Database** (or SQL Server instance)
- **Telegram Bot Token** (from BotFather on Telegram)

### Optional
- **Docker** and **Docker Compose** (for containerized execution)
- **Azure CLI** (for cloud resource management)

---

## Installation & Setup

### Step 1: Clone/Download the Repository
```bash
cd object-location-tracking
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web framework for the REST API
- `mssql` - Microsoft SQL Server driver
- `telegraf` - Telegram bot framework
- `axios` - HTTP client for API requests
- `dotenv` - Environment variable loader

---

## Configuration

### Step 1: Create `.env` File
Create a `.env` file in the project root with the following variables:

```env
# Azure SQL Database Credentials
DB_SERVER=your-server-name.database.windows.net
DB_NAME=object-tracking-db
DB_USER=your-db-admin-username
DB_PASSWORD=your-db-admin-password
DB_PORT=1433

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
```

### Step 2: Azure SQL Setup
If you don't have an Azure SQL database yet:

1. **Create Database** (via Azure Portal)
   - Create a new SQL Database in Azure
   - Note the server name and database name

2. **Configure Firewall Rules**
   - Allow your machine's public IP address
   - Enable Azure services access (for Docker/cloud deployments)

3. **Create Database Schema**
   - Connect using SSMS, Azure Data Studio, or SQL Server Management tools
   - Run the schema creation script:
   ```sql
   CREATE TABLE objects (
       object NVARCHAR(255) PRIMARY KEY,
       location NVARCHAR(255) NOT NULL
   );
   ```

4. **Get Telegram Bot Token**
   - Chat with @BotFather on Telegram
   - Create a new bot and copy the token

### Step 3: Verify Configuration
Test your database connection:
```bash
npm start
# Check if you see: "Connected to Azure SQL"
```

---

## Running the Application

### Option 1: Local Execution (Recommended for Development)

#### Terminal 1 - Start the API Server
```bash
npm start
```
Expected output:
```
Connected to Azure SQL
Server running on http://0.0.0.0:3000
```

#### Terminal 2 - Start the Telegram Bot
```bash
node bot.js
```
Expected output:
```
Telegram bot running...
```

Both services will run simultaneously. The bot makes HTTP requests to the API on localhost:3000.

### Option 2: Docker Execution (Recommended for Deployment)

#### Build and Run with Docker Compose
```bash
docker-compose up -d
```

This will:
1. Build the Docker image
2. Start the application container
3. Expose the API on port 3000

#### View Logs
```bash
docker-compose logs -f
```

#### Stop Services
```bash
docker-compose down
```

### Option 3: Sequential Execution
If you want to run both components in one terminal:
```bash
npm start & node bot.js
```
Press Ctrl+C to stop both services.

---

## API Reference

### 1. Add/Update Object Location
**Endpoint:** `GET /add`

**Parameters:**
- `object` (required): Name/identifier of the object
- `location` (required): Location details

**Example Request:**
```bash
curl "http://localhost:3000/add?object=keys&location=kitchen drawer"
```

**Response:**
```
Stored successfully
```

**Status Codes:**
- `200`: Successfully stored
- `400`: Missing parameters
- `500`: Database error

---

### 2. Search Object Location
**Endpoint:** `GET /search`

**Parameters:**
- `object` (required): Name/identifier of the object to search
- `format` (optional): Set to `json` to get all fuzzy matches with scores, otherwise returns plain text

**Fuzzy Matching Features:**
- **Typo Tolerance**: Search "kes" to find "keys"
- **Plural Handling**: Search "key" to find "keys" and vice versa
- **Partial Matches**: Search "key" to find "keychain" and "key chain"
- **Similarity Score**: Results are sorted by match quality (0-100%)
- **Threshold**: Only matches with ≥75% similarity are returned

**Example Request (Plain Text - Backward Compatible):**
```bash
curl "http://localhost:3000/search?object=keys"
```

**Response (Single Best Match):**
```
kitchen drawer
```

**Example Request (JSON - Fuzzy Matches):**
```bash
curl "http://localhost:3000/search?object=key&format=json"
```

**Response (JSON with Multiple Matches):**
```json
{
  "matches": [
    {
      "object": "keys",
      "location": "kitchen drawer",
      "similarity": 100
    },
    {
      "object": "key chain",
      "location": "bag pocket",
      "similarity": 85
    }
  ]
}
```

**Fuzzy Matching Examples:**
- Search `"key"` finds: `"keys"` (100%, plural match), `"key chain"` (85%, partial match)
- Search `"kes"` finds: `"keys"` (93%, typo tolerance)
- Search `"wallet"` finds: `"wallet"` (100%, exact match)
- Search `"wallets"` finds: `"wallet"` (100%, plural variant)

**Status Codes:**
- `200`: Found matches or not found message
- `400`: Missing object parameter
- `500`: Database error

---

### 3. Health Check
**Endpoint:** `GET /health`

**Purpose:** Verify database connectivity and application health

**Example Request:**
```bash
curl "http://localhost:3000/health"
```

**Response (Healthy):**
```
Database connection is healthy
```

**Response (Unhealthy):**
```
Database connection failed
```

**Status Codes:**
- `200`: Database is healthy
- `503`: Database connection failed

---

### 4. Clean Database
**Endpoint:** `GET /clean`

**Parameters:**
- `type` (required): `"all"` or `"location"`
- `location` (required if type=location): Location to clean

**Delete All Objects:**
```bash
curl "http://localhost:3000/clean?type=all"
```

**Response:**
```json
{
  "success": true,
  "message": "Database cleaned! 5 objects deleted.",
  "deletedCount": 5
}
```

**Delete by Location:**
```bash
curl "http://localhost:3000/clean?type=location&location=kitchen drawer"
```

**Response:**
```json
{
  "success": true,
  "message": "Location cleaned! 2 objects from \"kitchen drawer\" deleted.",
  "deletedCount": 2
}
```

**Response (No objects found):**
```json
{
  "success": false,
  "message": "No objects found at location: \"bedroom\"",
  "deletedCount": 0
}
```

**Status Codes:**
- `200`: Successfully deleted
- `400`: Invalid parameters
- `500`: Database error

⚠️ **Note:** The Telegram bot requires two-step confirmation before calling this endpoint. Direct API calls do NOT require confirmation.

---

## Telegram Bot Commands

Once the bot is running, you can interact with it via Telegram:

### /add Command
**Usage:** `/add <object> ; <location>` (recommended for multi-word items)

**Alternative:** `/add <object> <location>` (space-separated, simple items)

The semicolon separator (`;`) is recommended when your object or location contains multiple words.

**Examples:**
```
/add fones de ouvido ; mesa do escritório
/add chaves ; gaveta da cozinha
/add laptop desk
/add wallet bedroom nightstand
```

**Response:**
```
✅ Added "fones de ouvido" to "mesa do escritório"
```

**Usage Tips:**
- Use semicolon (`;`) for **multi-word objects or locations**
  - `/add fones de ouvido ; mesa do escritório`
  - `/add remote control ; living room couch`
- Use **space-separated** for **single-word items** (backward compatible)
  - `/add keys drawer`
  - `/add phone desk`

---

### /search Command
**Usage:** `/search <object>`

The search command uses fuzzy matching to find similar objects even with typos or plurals.

**Examples:**
```
/search laptop
/search key
/search kes
/search wallets
/search fone
```

**Response Examples:**

Exact match:
```
Found 1 match:

📍 keys (✓ Exact)
   Location: kitchen drawer
```

Multiple matches with similarity scores:
```
Found 2 matches:

📍 keys (✓ Exact)
   Location: kitchen drawer

📍 key chain (85%)
   Location: bag pocket
```

No matches:
```
Could not find location for "xyz"
```

---

### /clean Command
**Usage:** `/clean <parameter>`

Deletes objects from the database with **two-step confirmation** to prevent accidental data loss.

**Parameters:**
- `/clean all` - Delete ALL objects from database
- `/clean <location>` - Delete all objects at a specific location

**Two-Step Confirmation Process:**

Step 1 - Initiate clean:
```
/clean all
🚨 WARNING: This will DELETE ALL objects from the database!

Type: /confirm-clean-all
To cancel: /cancel
```

Step 2 - Confirm deletion:
```
/confirm-clean-all
✅ Database cleaned successfully!
```

**Example: Delete by Location**

Step 1 - Initiate:
```
/clean mesa do escritório
🚨 WARNING: This will DELETE ALL objects at location: "mesa do escritório"

Type: /confirm-clean-location mesa do escritório
To cancel: /cancel
```

Step 2 - Confirm:
```
/confirm-clean-location mesa do escritório
✅ Location cleaned successfully!
2 objects from "mesa do escritório" have been deleted.
```

**Related Commands:**
- `/cancel` - Cancel pending clean operation
- Confirmation expires after **5 minutes**

**Safety Features:**
✅ Requires explicit confirmation
✅ User-specific (only the user who initiated can confirm)
✅ 5-minute timeout to prevent accidental confirms
✅ Clear warnings before deletion
✅ Cancel option available

---

## Fuzzy Search Technology

The application uses **Levenshtein distance algorithm** to find similar object names with these features:

- **Typo Tolerance**: "kes" → "keys" (93% match)
- **Plural/Singular Matching**: "key" ↔ "keys" (100% match)
- **Partial Matches**: "key" → "key chain", "keychain" (85%+ match)
- **Case Insensitive**: "KEYS" = "keys"
- **Similarity Threshold**: Only shows matches ≥75% similar
- **Smart Sorting**: Results sorted by similarity score (highest first)

## Database Schema

### Table: objects

| Column | Type | Constraints |
|--------|------|-------------|
| `object` | NVARCHAR(255) | PRIMARY KEY |
| `location` | NVARCHAR(255) | NOT NULL |

**Notes:**
- Object names are unique (primary key)
- Adding the same object twice updates its location
- Supports Unicode characters in both object and location names

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          Telegram Bot (bot.js)                  │
│    - Listens for /add and /search commands      │
└────────────┬──────────────────────────────────┘
             │ HTTP Requests (localhost:3000)
             ▼
┌─────────────────────────────────────────────────┐
│          Express API Server (api.js)            │
│    - GET /add - Store/update locations          │
│    - GET /search - Retrieve locations           │
│    - GET /health - Check database health        │
└────────────┬──────────────────────────────────┘
             │ MSSQL Driver
             ▼
┌─────────────────────────────────────────────────┐
│      Azure SQL Database (Cloud)                 │
│    - Table: objects(object, location)           │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Connected to Azure SQL" doesn't appear
**Solution:**
- Verify `.env` file has correct DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD
- Check firewall rules in Azure SQL server settings
- Ensure your machine's public IP is whitelisted
- Verify database credentials are correct

### Issue: API returns "Error storing data" or "Error retrieving data"
**Solution:**
- Check that the `objects` table exists in the database
- Run the schema creation script (see Configuration Step 3)
- Verify database user has proper permissions (SELECT, INSERT, UPDATE)

### Issue: Telegram bot doesn't respond
**Solution:**
- Verify TELEGRAM_BOT_TOKEN is correct in `.env`
- Ensure API server is running (check `/health` endpoint)
- Check bot.js logs for error messages
- Restart the bot: `node bot.js`

### Issue: "Cannot find module" error
**Solution:**
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`
- Verify Node.js version: `node --version` (should be v14+)

### Issue: Connection timeout when accessing database
**Solution:**
- Check internet connection and VPN (if applicable)
- Verify firewall rules allow Azure SQL port 1433
- Test with Azure Data Studio to confirm connectivity
- Check if Azure SQL server is still running in Azure Portal

### Issue: Docker build fails
**Solution:**
- Ensure Docker Desktop is running
- Check `.env` file exists and is properly configured
- Run `docker-compose build --no-cache` to rebuild
- Check Docker logs: `docker-compose logs`

---

## Advanced Usage

### Custom Database
To use your own SQL Server instead of Azure SQL:
1. Update `DB_SERVER` in `.env` (e.g., `localhost` for local SQL Server)
2. Ensure the database exists and the schema is created
3. The code will work with any MSSQL-compatible database

### Environment Variables Summary
| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_SERVER` | SQL Server hostname | `myserver.database.windows.net` |
| `DB_NAME` | Database name | `object-tracking-db` |
| `DB_USER` | Database username | `admin@server` |
| `DB_PASSWORD` | Database password | `SecurePass123!` |
| `DB_PORT` | SQL Server port | `1433` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot API token | `123456:ABC-DEF...` |

---

## Project Files

| File | Purpose |
|------|---------|
| `api.js` | Express REST API server with endpoints |
| `bot.js` | Telegram bot command handlers |
| `database.js` | SQL connection pool configuration |
| `config.js` | Centralized configuration (currently unused) |
| `docker-compose.yml` | Docker container orchestration |
| `package.json` | Project dependencies and scripts |
| `.env` | Environment variables (create this file) |
| `AZURE_SETUP.md` | Detailed Azure SQL setup instructions |

---

## Support & Next Steps

- For detailed Azure setup, see [AZURE_SETUP.md](AZURE_SETUP.md)
- For production deployment, consider using Azure Container Instances or App Service
- Enable HTTPS for Telegram webhook integration if deployed to cloud
- Consider adding authentication for the API endpoints in production

**Happy tracking! 🎯**