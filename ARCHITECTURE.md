# Monolithic ERP Architecture

## Overview

This is a **monolithic enterprise resource planning (ERP) system** demonstrating classic monolithic architecture patterns with tight coupling, shared dependencies, and a single deployable unit.

## Architecture Characteristics

### Single Deployable Unit
- All modules bundled into one application
- Single `npm start` command deploys entire system
- One codebase, one build, one deployment
- All code runs in a single Node.js process

### Shared Database
- All modules use the same **Neon** serverless PostgreSQL database
- Single connection pool shared across modules (with `pool_pre_ping` and `pool_recycle` for Neon's idle-connection behaviour)
- All entities defined in `src/models.py`
- No data isolation between modules
- Connection configured via the `DATABASE_URL` environment variable (Neon connection string)

### Shared Middleware
- Common authentication (`/src/middleware/auth.ts`)
- Common logging (`/src/middleware/logger.ts`)
- Common error handling (`/src/middleware/errorHandler.ts`)
- All HTTP requests flow through same middleware stack

### Cross-Module Coupling
Modules directly import and instantiate services from other modules:

```typescript
// Example from PayrollService
import { HRService } from '../human-resources/hr.service';
import { AccountingService } from '../accounting/accounting.service';

export class PayrollService {
  private hrService = new HRService();
  private accountingService = new AccountingService();
  // Direct dependencies on other modules
}
```

## Module Dependencies

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     Monolithic ERP System                   │
│                  (Single Deployable Unit)                   │
└─────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │ Human       │
    │ Resources   │◄───────────────────────┐
    └──────┬──────┘                        │
           │                               │
           │ getEmployeeById()             │
           ▼                               │
    ┌─────────────┐                        │
    │  Payroll    │                        │
    └──────┬──────┘                        │
           │                               │
           │ recordPayrollExpense()        │
           ▼                               │
    ┌─────────────┐                        │
    │ Accounting  │◄───────┬───────┬───────┘
    └──────▲──────┘        │       │
           │               │       │
           │               │       │ recordPurchase()
           │               │       │
    ┌──────┴──────┐  ┌─────┴────┐  ┌──────────────┐
    │   Finance   │  │ Billing  │  │ Procurement  │◄────┐
    └─────────────┘  └──────────┘  └──────────────┘     │
                                                         │
                                                         │ createReorderPO()
                                                         │
                                                   ┌─────┴────────┐
                                                   │  Inventory   │
                                                   └──────────────┘

    ┌─────────────┐
    │ Supply Chain│ (Independent)
    └─────────────┘
```

### Module Relationships

| Module | Calls | Called By | Purpose |
|--------|-------|-----------|---------|
| **Human Resources** | - | Payroll | Employee management, department structure |
| **Payroll** | HR, Accounting | - | Salary processing, tax calculations |
| **Accounting** | - | Payroll, Billing, Procurement, Finance | General ledger, journal entries |
| **Finance** | Accounting | - | Budgeting, financial planning, reporting |
| **Billing** | Accounting | - | Customer invoicing, payment tracking |
| **Procurement** | Accounting | Inventory | Purchase orders, vendor management |
| **Supply Chain** | - | - | Shipments, logistics, warehousing |
| **Inventory** | Procurement | - | Stock management, automatic reordering |

## Cross-Coupling Examples

### Example 1: Payroll → HR → Accounting
```typescript
// In PayrollService.processPayroll()
1. Call HRService.getEmployeeById() to get employee data
2. Calculate payroll based on employee salary
3. Call AccountingService.recordPayrollExpense() to create journal entries
```

**File References:**
- `src/modules/payroll/payroll.service.ts:46` - HR service call
- `src/modules/payroll/payroll.service.ts:106` - Accounting service call

### Example 2: Inventory → Procurement
```typescript
// In InventoryService.checkAndReorder()
1. Detect stock level below reorder point
2. Call ProcurementService.createReorderPurchaseOrder()
3. Automatically create purchase order without human intervention
```

**File References:**
- `src/modules/inventory/inventory.service.ts:186` - Procurement service call

### Example 3: Billing → Accounting
```typescript
// In BillingService.sendInvoice()
1. Mark invoice as sent
2. Call AccountingService.recordRevenue() to create journal entries
3. Link accounting transaction back to invoice
```

**File References:**
- `src/modules/billing/billing.service.ts:161` - Accounting service call

## Shared Dependencies

### Database Layer
All modules share:
- A single **Neon** serverless PostgreSQL connection (`DATABASE_URL`)
- All entity definitions in `src/models.py`
- SQLAlchemy + Flask-Migrate for ORM and schema migrations

```python
# Every model uses the same db instance
from db import db

class Employee(db.Model):
    __tablename__ = "employees"
    ...
```

### Middleware Layer
All HTTP requests pass through:
1. `express.json()` - Body parsing
2. `requestLogger` - Request logging
3. `authenticate` - JWT authentication
4. Route-specific authorization
5. `errorHandler` - Global error handling

**File Reference:** `src/app.ts:25-28`

## Advantages of This Monolithic Design

1. **Simple Deployment** - Single build, single deploy
2. **Easy Development** - Can run entire system locally
3. **Direct Function Calls** - No network overhead between modules
4. **Shared Code** - Reuse utilities, middleware, types
5. **ACID Transactions** - Database transactions span modules
6. **Simplified Debugging** - Single stack trace across modules

## Disadvantages of This Monolithic Design

1. **Tight Coupling** - Changes in one module affect others
2. **Scaling Limitations** - Can't scale individual modules
3. **Technology Lock-in** - All modules use same tech stack
4. **Large Codebase** - Difficult to navigate as system grows
5. **Deploy All or Nothing** - Small change requires full deployment
6. **Team Coordination** - Multiple teams work in same codebase
7. **Single Point of Failure** - One module crash brings down everything

## Project Structure

```
enterprise-resource-planning/
├── src/
│   ├── database/
│   │   ├── connection.ts          # Shared database connection
│   │   └── entities/              # Shared data models
│   ├── middleware/                 # Shared middleware
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   └── errorHandler.ts
│   ├── modules/                    # All business modules
│   │   ├── human-resources/
│   │   ├── payroll/
│   │   ├── accounting/
│   │   ├── finance/
│   │   ├── billing/
│   │   ├── procurement/
│   │   ├── supply-chain/
│   │   └── inventory/
│   ├── app.ts                      # Application setup
│   └── server.ts                   # Server bootstrap
├── package.json                    # Single dependency file
└── tsconfig.json                   # Single TypeScript config
```

## Running the Monolith

```bash
# Install all dependencies
npm install

# Set up environment
cp .env.example .env

# Run in development (entire system)
npm run dev

# Build entire application
npm run build

# Run in production (entire system)
npm start
```

## API Endpoints

All modules exposed through single API:

- `http://localhost:3001/api/hr` - Human Resources
- `http://localhost:3001/api/payroll` - Payroll
- `http://localhost:3001/api/accounting` - Accounting
- `http://localhost:3001/api/finance` - Finance
- `http://localhost:3001/api/billing` - Billing
- `http://localhost:3001/api/procurement` - Procurement
- `http://localhost:3001/api/supply-chain` - Supply Chain
- `http://localhost:3001/api/inventory` - Inventory

**API Documentation:** `http://localhost:3001/api`

## Database Schema

All modules share single database with tables:

- `employees` - HR module
- `departments` - HR module
- `payroll_records` - Payroll module
- `accounting_transactions` - Accounting module (used by many modules)
- `budgets` - Finance module
- `invoices` - Billing module
- `customers` - Billing module
- `purchase_orders` - Procurement module
- `vendors` - Procurement module
- `shipments` - Supply Chain module
- `inventory_items` - Inventory module

## Conclusion

This monolithic ERP demonstrates classic enterprise architecture with:
- ✅ Single deployable unit
- ✅ Shared database and middleware
- ✅ Direct cross-module coupling
- ✅ Tight integration between modules

Perfect for understanding monolithic patterns before moving to microservices!
