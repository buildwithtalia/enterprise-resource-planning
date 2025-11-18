# Quick Start Guide

## ✅ Server is Running!

Your monolithic ERP application is now running at: **http://localhost:3001**

## 🎯 Try These Endpoints

### API Documentation
Visit this to see all modules and their relationships:
```
http://localhost:3001/api
```

### Health Check
```
http://localhost:3001/health
```

### Available Modules
- `http://localhost:3001/api/hr` - Human Resources
- `http://localhost:3001/api/payroll` - Payroll
- `http://localhost:3001/api/accounting` - Accounting
- `http://localhost:3001/api/finance` - Finance
- `http://localhost:3001/api/billing` - Billing
- `http://localhost:3001/api/procurement` - Procurement
- `http://localhost:3001/api/supply-chain` - Supply Chain
- `http://localhost:3001/api/inventory` - Inventory

## ⚠️ Current Mode: API-ONLY

The server is running in **API-ONLY mode** because PostgreSQL is not configured. The API structure is available, but database operations will fail.

## 🗄️ To Enable Full Functionality (Optional)

### Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### Configure Database

1. Create database and user:
```bash
psql postgres
CREATE DATABASE erp_monolith;
CREATE USER erp_user WITH PASSWORD 'erp_password';
GRANT ALL PRIVILEGES ON DATABASE erp_monolith TO erp_user;
\q
```

2. Update `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=erp_user
DB_PASSWORD=erp_password
DB_DATABASE=erp_monolith
```

3. Restart the server:
```bash
npm run dev
```

## 📚 Exploring the Monolith

### Cross-Module Dependencies

This application demonstrates tight coupling:

1. **Payroll → HR → Accounting**
   - Payroll calls HR to get employee data
   - Payroll calls Accounting to record expenses

2. **Inventory → Procurement**
   - Inventory automatically calls Procurement when stock is low

3. **Billing → Accounting**
   - Billing calls Accounting to record revenue

### Code Examples

**See cross-coupling in action:**
- `src/modules/payroll/payroll.service.ts:46` - Payroll calls HR
- `src/modules/payroll/payroll.service.ts:106` - Payroll calls Accounting
- `src/modules/inventory/inventory.service.ts:186` - Inventory calls Procurement

### Architecture Documentation

Read `ARCHITECTURE.md` for detailed explanation of the monolithic design.

## 🧪 Testing the API

Using curl:
```bash
# Health check
curl http://localhost:3001/health

# API documentation
curl http://localhost:3001/api
```

Using your browser:
- Open http://localhost:3001/api to see the full API structure

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## 💡 Next Steps

1. Explore the codebase structure in `src/modules/`
2. Review the shared database layer in `src/database/`
3. Check the shared middleware in `src/middleware/`
4. Read `ARCHITECTURE.md` for design patterns
5. (Optional) Set up PostgreSQL for full functionality
