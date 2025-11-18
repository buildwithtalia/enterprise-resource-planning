# Enterprise Resource Planning - Monolithic Application

A comprehensive monolithic ERP system demonstrating tightly-coupled enterprise modules with shared dependencies. This application serves as an educational example of traditional monolithic architecture patterns, showcasing both the advantages and challenges of tightly-coupled systems.

## Architecture Overview

This is a **true monolithic application** - a single deployable unit where all business logic, data access, and shared infrastructure are bundled together. Unlike modern microservices architectures, this system demonstrates the classic enterprise application pattern where modules are tightly coupled through direct service calls and shared resources.

### Key Architectural Characteristics

#### 1. Single Deployable Unit
- All 8 business modules compiled into one application
- Single `node` process handles all business logic
- One codebase, one deployment pipeline, one runtime
- All modules start and stop together
- **File**: `src/server.ts` - single entry point for entire application

#### 2. Shared Database Layer
- **One PostgreSQL database** serves all modules
- **One connection pool** shared across all services
- **Shared entities** with cross-module foreign keys
- All modules access same tables directly
- **Implementation**: `src/database/connection.ts` - singleton database connection
- **Schema**: 11 shared entities (Employee, Department, PayrollRecord, AccountingTransaction, Budget, Invoice, Customer, PurchaseOrder, Vendor, InventoryItem, Shipment)

#### 3. Shared Middleware Stack
All HTTP requests flow through the same middleware pipeline:
- **Authentication**: `src/middleware/auth.ts` - JWT validation for all modules
- **Logging**: `src/middleware/logging.ts` - Winston logger for all requests
- **Error Handling**: `src/middleware/errorHandler.ts` - centralized error processing

#### 4. Direct Cross-Module Coupling
Modules directly import and instantiate each other's services:

```typescript
// src/modules/payroll/payroll.service.ts
import { HRService } from '../human-resources/hr.service';
import { AccountingService } from '../accounting/accounting.service';

export class PayrollService {
  private hrService = new HRService();           // Direct dependency
  private accountingService = new AccountingService(); // Direct dependency

  async approvePayroll(payrollId: string) {
    // Synchronous call to another module
    const transactions = await this.accountingService.recordPayrollExpense({...});
  }
}
```

This creates a **tight coupling** where changes to one service can break others.

## Business Modules

### 1. Human Resources (HR)
**Purpose**: Employee lifecycle management, organizational structure, benefits administration

**Entities**: `Employee`, `Department`

**Key Features**:
- Employee onboarding and offboarding
- Department management
- Benefits and leave tracking
- Performance reviews

**Relationships**:
- **Called by**: Payroll module (to fetch employee data)
- **Database**: Employees table shared with Payroll

**File**: `src/modules/human-resources/`

---

### 2. Payroll
**Purpose**: Salary processing, tax calculations, paycheck generation

**Entities**: `PayrollRecord`

**Key Features**:
- Payroll record creation and processing
- Tax deductions and net pay calculation
- Payroll approval workflow
- Integration with HR and Accounting

**Cross-Coupling Example**:
```typescript
// src/modules/payroll/payroll.service.ts:86
async approvePayroll(payrollId: string): Promise<PayrollRecord> {
  // 1. Fetch employee from HR module
  const employee = await this.hrService.getEmployeeById(payroll.employeeId);

  // 2. Record accounting transactions
  const transactions = await this.accountingService.recordPayrollExpense({
    payrollId: payroll.id,
    grossPay: Number(payroll.grossPay),
    netPay: Number(payroll.netPay),
    taxes: Number(payroll.taxDeductions)
  });
}
```

**Dependencies**:
- **Calls**: HR Service (synchronous) - `src/modules/human-resources/hr.service.ts`
- **Calls**: Accounting Service (synchronous) - `src/modules/accounting/accounting.service.ts`

**File**: `src/modules/payroll/`

---

### 3. Accounting
**Purpose**: General ledger, double-entry bookkeeping, journal entries

**Entities**: `AccountingTransaction`

**Key Features**:
- Chart of accounts management
- Journal entry creation with debit/credit validation
- Transaction recording from other modules
- Financial statement data aggregation

**Business Rule**:
```typescript
// src/modules/accounting/accounting.service.ts:102
// Validates double-entry bookkeeping
const totalDebits = transactions.reduce((sum, t) => sum + Number(t.debitAmount), 0);
const totalCredits = transactions.reduce((sum, t) => sum + Number(t.creditAmount), 0);

if (Math.abs(totalDebits - totalCredits) > 0.01) {
  throw new Error('Journal entry must balance (debits must equal credits)');
}
```

**Relationships**:
- **Called by**: Payroll (to record payroll expenses)
- **Called by**: Billing (to record invoice payments)
- **Called by**: Procurement (to record purchase expenses)
- **Called by**: Finance (to query transaction data for reports)

**File**: `src/modules/accounting/`

---

### 4. Finance
**Purpose**: Financial planning, budgeting, forecasting, and reporting

**Entities**: `Budget`

**Key Features**:
- Budget creation by department and fiscal year
- Budget utilization tracking
- Financial statement generation
- Integration with Accounting for actual vs. budget analysis

**Dependencies**:
- **Calls**: Accounting Service (to fetch transaction data) - `src/modules/accounting/accounting.service.ts`

**File**: `src/modules/finance/`

---

### 5. Billing
**Purpose**: Customer invoicing, payment processing, accounts receivable

**Entities**: `Customer`, `Invoice`

**Key Features**:
- Customer management
- Invoice generation with automatic tax calculation
- Payment tracking (partial and full)
- Overdue invoice detection

**Dependencies**:
- **Calls**: Accounting Service (to record revenue) - `src/modules/accounting/accounting.service.ts`

**File**: `src/modules/billing/`

---

### 6. Procurement
**Purpose**: Purchase order management, vendor relationships, purchasing workflow

**Entities**: `Vendor`, `PurchaseOrder`

**Key Features**:
- Vendor management with payment terms
- Purchase order creation and approval
- Automatic reorder support (called by Inventory)
- PO receiving and closure

**Cross-Coupling Example**:
```typescript
// src/modules/procurement/procurement.service.ts:96
async createReorderPurchaseOrder(data: ReorderPurchaseOrderInput): Promise<PurchaseOrder> {
  // Called automatically by Inventory module when stock is low
  const purchaseOrder = repository.create({
    vendor: { id: data.vendorId },
    orderDate: new Date(),
    status: 'draft',
    totalAmount: data.estimatedCost
  });
}
```

**Relationships**:
- **Called by**: Inventory (automatic reorder trigger) - `src/modules/inventory/inventory.service.ts:186`
- **Calls**: Accounting Service (to record expenses)

**File**: `src/modules/procurement/`

---

### 7. Inventory
**Purpose**: Stock management, warehouse operations, automatic reordering

**Entities**: `InventoryItem`

**Key Features**:
- Stock level tracking (on hand, reserved, on order)
- Reorder point and quantity management
- **Automatic reordering** when stock is low
- Stock adjustments with audit trail
- Inventory valuation

**Automatic Reordering Flow** (Demonstrates Tight Coupling):
```typescript
// src/modules/inventory/inventory.service.ts:148
private async checkAndReorder(item: InventoryItem): Promise<void> {
  const availableQuantity = item.quantityOnHand - item.quantityReserved;

  // When stock drops to reorder point, automatically call Procurement
  if (availableQuantity <= item.reorderPoint && item.quantityOnOrder === 0) {
    const purchaseOrder = await this.procurementService.createReorderPurchaseOrder({
      sku: item.sku,
      name: item.name,
      quantity: item.reorderQuantity,
      estimatedCost: item.unitCost * item.reorderQuantity,
      vendorId: item.preferredVendorId
    });

    item.quantityOnOrder = item.reorderQuantity;
    await this.repository.save(item);
  }
}
```

**Dependencies**:
- **Calls**: Procurement Service (automatic, synchronous) - `src/modules/procurement/procurement.service.ts`

**File**: `src/modules/inventory/`

---

### 8. Supply Chain
**Purpose**: Logistics, shipment tracking, carrier management, distribution

**Entities**: `Shipment`

**Key Features**:
- Inbound and outbound shipment tracking
- Carrier performance monitoring
- Delivery date estimation
- Shipping cost tracking

**File**: `src/modules/supply-chain/`

---

## Dependency Graph

```
┌─────────────┐
│     HR      │
└──────┬──────┘
       │ (called by)
       ▼
┌─────────────┐        ┌──────────────┐
│   Payroll   │───────>│  Accounting  │
└─────────────┘        └──────┬───────┘
                              │ (called by)
                              │
        ┌─────────────────────┼─────────────────┐
        │                     │                 │
        ▼                     ▼                 ▼
┌─────────────┐        ┌──────────┐      ┌─────────┐
│   Billing   │        │ Finance  │      │Procure- │
└─────────────┘        └──────────┘      │ ment    │
                                          └────▲────┘
                                               │ (called by)
┌─────────────┐                                │
│Supply Chain │                         ┌──────┴─────┐
└─────────────┘                         │ Inventory  │
                                        └────────────┘

Legend:
  A ────> B  :  A directly calls B's service methods
  Accounting :  Central hub - called by most modules
```

## Quick Start

### Backend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server:
   ```bash
   npm run dev
   ```

   The backend API will run on **http://localhost:3001**

### Frontend Setup

3. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

4. Install frontend dependencies:
   ```bash
   npm install
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will run on **http://localhost:5173**

6. Open your browser to **http://localhost:5173** to see the application!

### Optional: Database Configuration

The app runs without a database in API-only mode. To enable full functionality:

```bash
# Install PostgreSQL
brew install postgresql@14  # macOS
# or
sudo apt-get install postgresql  # Ubuntu

# Create database
createdb erp_monolith

# Configure .env
cp .env.example .env
# Edit DB_* variables in .env

# Restart backend
npm run dev
```

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with TypeORM
- **Logging**: Winston
- **Authentication**: JWT

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

## Application Structure

```
enterprise-resource-planning/
├── src/                    # Backend source code
│   ├── database/          # Shared database layer
│   ├── middleware/        # Shared middleware
│   ├── modules/           # Business modules
│   │   ├── human-resources/
│   │   ├── payroll/
│   │   ├── accounting/
│   │   ├── finance/
│   │   ├── billing/
│   │   ├── procurement/
│   │   ├── supply-chain/
│   │   └── inventory/
│   ├── app.ts
│   └── server.ts
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── package.json           # Backend dependencies
└── README.md
```

## Monolithic Design Deep Dive

### What Makes This a True Monolith?

This application demonstrates **classic monolithic architecture patterns** at every level:

#### Shared Resources

**1. Single Database Connection Pool**
```typescript
// src/database/connection.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  // ... single shared connection for ALL modules
});
```
- All 8 modules use the same `AppDataSource` instance
- One connection pool means connection exhaustion affects entire application
- Database schema changes require careful coordination across all modules
- No module isolation at the data layer

**2. Synchronous Inter-Module Communication**
```typescript
// Direct service instantiation creates tight coupling
export class PayrollService {
  private hrService = new HRService();  // Creates dependency at instantiation
  private accountingService = new AccountingService();

  async approvePayroll(id: string) {
    // Synchronous call - if Accounting is slow, Payroll is slow
    await this.accountingService.recordPayrollExpense({...});
  }
}
```
- No message queues or event buses
- No service discovery or load balancing
- If one service throws an error, the caller must handle it immediately
- Performance of one module directly impacts others

**3. Shared Application State**
```typescript
// src/server.ts - single Express app serves all modules
const app = express();

// All modules use same middleware
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);
app.use('/api/hr', hrRoutes);          // All routes in same app
app.use('/api/payroll', payrollRoutes);
app.use('/api/accounting', accountingRoutes);
// ... etc
```
- One HTTP server, one port, one process
- Memory leak in one module affects entire application
- CPU-intensive operation in any module blocks all requests
- Crash in one module brings down everything

**4. Shared Dependencies**
```typescript
// package.json - single dependency tree
{
  "dependencies": {
    "express": "^4.18.2",      // Used by all modules
    "typeorm": "^0.3.17",       // Used by all modules
    "winston": "^3.10.0",       // Used by all modules
    "jsonwebtoken": "^9.0.2"    // Used by all modules
  }
}
```
- All modules must use the same version of shared libraries
- Updating a dependency requires testing all modules
- Incompatible dependencies between modules create conflicts

### Advantages of This Monolithic Design

#### 1. **Simplicity**
- Single codebase to understand
- One deployment process
- One server to monitor
- Easier for small teams or prototyping

#### 2. **Development Speed (Initially)**
- No network overhead between modules
- Direct function calls are faster than HTTP/gRPC
- Shared code can be easily reused
- Cross-module refactoring is straightforward

#### 3. **ACID Transactions Across Modules**
```typescript
// src/modules/payroll/payroll.service.ts
async approvePayroll(id: string) {
  // Single database transaction spans multiple modules
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Update in Payroll module
    payroll.status = 'approved';
    await queryRunner.manager.save(payroll);

    // Update in Accounting module - same transaction!
    const transactions = await this.accountingService.recordPayrollExpense({...});

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  }
}
```
- Easy to maintain data consistency
- No distributed transaction complexity
- Rollbacks are straightforward

#### 4. **Easier Debugging**
- Single stack trace across all modules
- One log file to search
- Debugger can step through entire request flow
- No distributed tracing required

### Disadvantages and Challenges

#### 1. **Tight Coupling**
```typescript
// Changing HRService interface breaks PayrollService
class HRService {
  async getEmployeeById(id: string) { /* ... */ }
}

// PayrollService directly depends on HRService method signature
class PayrollService {
  async approvePayroll(id: string) {
    const employee = await this.hrService.getEmployeeById(id);
    // If getEmployeeById changes, this breaks!
  }
}
```
- Changes ripple across modules
- Difficult to work on modules independently
- Module boundaries become blurred over time

#### 2. **Scaling Limitations**
- Cannot scale individual modules independently
- Must scale entire application even if only one module is under load
- Example: High billing activity requires scaling entire ERP, including unused HR module
- Resource-intensive modules (e.g., reporting) consume resources needed by transactional modules

#### 3. **Deployment Risk**
- Small change in one module requires redeploying entire application
- All modules go down during deployment
- Bug in one module can crash entire system
- Rollback affects all modules, not just the problematic one

#### 4. **Technology Lock-In**
- All modules must use same language (TypeScript)
- All modules must use same framework (Express)
- All modules must use same database (PostgreSQL)
- Cannot choose optimal technology per module

#### 5. **Team Coordination**
- Multiple teams editing same codebase creates conflicts
- Shared database schema requires coordination
- Deployment schedule must accommodate all teams
- Difficult to establish module ownership

#### 6. **Testing Complexity**
- Must test entire application for any change
- Cannot test modules in isolation
- Integration tests require all modules
- Long CI/CD pipeline as application grows

### Monolith vs. Microservices Comparison

| Aspect | Monolith (This App) | Microservices |
|--------|---------------------|---------------|
| **Deployment** | Single unit | Independent services |
| **Scaling** | Scale entire app | Scale services individually |
| **Database** | Shared database | Database per service |
| **Communication** | Direct function calls | HTTP/gRPC/Message queues |
| **Transactions** | ACID across modules | Eventual consistency |
| **Technology** | Single stack | Polyglot (multiple languages) |
| **Development** | Simple initially | Complex from start |
| **Team Structure** | One team or feature teams | Team per service |
| **Failure Isolation** | ❌ Crash affects all | ✅ Isolated failures |
| **Code Reuse** | ✅ Direct imports | ⚠️ Shared libraries/duplication |

### Example: What Happens When Inventory is Low?

This example shows the tight coupling in action:

```
1. User creates a sales order for 100 units of Product X
   └─> POST /api/inventory/reserve
       └─> InventoryService.reserveStock()

2. Inventory module checks available quantity
   └─> quantityOnHand = 150
   └─> quantityReserved = 60
   └─> availableQuantity = 90 (not enough!)

3. Inventory module updates reservation anyway
   └─> quantityReserved = 160

4. Inventory module checks if reorder needed
   └─> availableQuantity (90) <= reorderPoint (100)
   └─> Triggers automatic reorder

5. Inventory DIRECTLY CALLS Procurement (synchronous)
   └─> this.procurementService.createReorderPurchaseOrder({
         sku: 'PROD-X',
         quantity: 200,  // reorderQuantity
         vendorId: 'preferred-vendor-id'
       })

6. Procurement creates purchase order
   └─> PurchaseOrder entity created
   └─> Status: 'draft'

7. Procurement DIRECTLY CALLS Accounting (synchronous)
   └─> this.accountingService.recordPurchaseCommitment({...})

8. Accounting creates journal entry
   └─> Debit: Inventory Asset
   └─> Credit: Accounts Payable

9. Response bubbles back up the call stack
   └─> Accounting → Procurement → Inventory → API Response

10. User receives response with updated inventory
    └─> "Stock reserved, reorder triggered"
```

**Key Points:**
- **Synchronous chain**: Single HTTP request triggers chain of direct service calls
- **Single transaction**: All changes in one database transaction (or none)
- **Tight coupling**: Inventory knows about Procurement; Procurement knows about Accounting
- **Failure propagation**: Error in Accounting fails entire operation back to user
- **Performance**: User waits for all operations to complete

**In Microservices:**
- Inventory would emit "StockLow" event to message queue
- Procurement would consume event asynchronously
- User gets immediate response, reordering happens in background
- Services remain decoupled but consistency is eventual, not immediate

### When to Use a Monolith

✅ **Good Use Cases:**
- Small to medium applications
- Single team or small organization
- Rapid prototyping and MVP development
- Applications with simple scaling needs
- High consistency requirements (ACID transactions)
- Limited infrastructure/DevOps expertise

❌ **Bad Use Cases:**
- Large teams (>50 developers)
- Different modules have vastly different scaling needs
- Need to use different technologies per module
- Frequent deployments by different teams
- High availability requirements (monolith SPOF)

### Evolution Path

Many successful companies started with monoliths:

1. **Start**: Monolith (like this ERP)
2. **Growth**: Identify bottlenecks and boundaries
3. **Extract**: Gradually extract services (e.g., start with Inventory → Procurement)
4. **Migrate**: Move to event-driven communication
5. **Mature**: Full microservices architecture with proper observability

This application represents **Stage 1** - the classic monolith that many systems start with.
