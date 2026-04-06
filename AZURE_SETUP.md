# Azure SQL Setup Instructions

## 1. Create Azure SQL Database
1. In Azure Portal, create a new SQL Database
   - Choose appropriate resource group and server
   - Set database name to `object-tracking-db` (or update .env accordingly)
   - Select 'Basic' pricing tier for testing

## 2. Configure Firewall Rules
1. In Azure Portal, open your SQL server's firewall settings
2. Add a new rule with these settings:
   - Rule name: `dev-machine`
   - Start IP: Your local machine's public IP
   - End IP: Same as start IP
3. Enable Azure services access:
   - Add another rule for 0.0.0.0 - 0.0.0.0

## 3. Update .env File
Update your .env file with Azure SQL credentials:
```env
DB_SERVER=your-server-name.database.windows.net
DB_NAME=object-tracking-db
DB_USER=your-db-admin
DB_PASSWORD=your-db-password
DB_PORT=1433
TELEGRAM_BOT_TOKEN=your-telegram-token
```

## 4. Create Database Schema
1. Connect to Azure SQL using Azure Data Studio/SSMS
2. Run this schema creation script:
```sql
CREATE TABLE objects (
    object NVARCHAR(255) PRIMARY KEY,
    location NVARCHAR(255) NOT NULL
);
```

## 5. Testing Checklist
- [ ] Database server allows connections
- [ ] Database user has proper permissions
- [ ] Network rules allow inbound/outbound connections
- [ ] Telegram token is valid

## 6. Deployment Options
### Docker (Recommended for Testing)
```bash
# Start application with environment variables
docker-compose up -d
```

### Direct Node.js Execution
```bash
# Install dependencies
npm install

# Start API
npm start

# In another terminal, start bot
node bot.js
```