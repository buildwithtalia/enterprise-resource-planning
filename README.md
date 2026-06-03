# Enterprise Resource Planning - Monolithic Application

A comprehensive monolithic ERP system demonstrating tightly-coupled enterprise modules with shared dependencies. This application serves as an educational example of traditional monolithic architecture patterns, showcasing both the advantages and challenges of tightly-coupled systems.

## Architecture Overview

This is a **true monolithic application** — a single deployable unit where all business logic, shared middleware, and route definitions live in one Flask application (`src/app.py`). Unlike microservices architectures, all modules are tightly coupled through direct service calls and a shared codebase.

### Key Architectural Characteristics

#### 1. Single Deployable Unit
- All 8 business modules registered in one Flask app
- Single `python src/app.py` command runs the entire system
- One codebase, one deployment pipeline, one runtime
- All modules start and stop together

#### 2. Shared Middleware Stack
All HTTP requests flow through the same middleware pipeline defined in `src/app.py`:
- **Request Logging**: `before_request` hook logs every incoming request
- **Error Handling**: Global `@app.errorhandler` for 404s and unhandled exceptions

#### 3. Direct Cross-Module Coupling
Modules directly import and call each other's route handlers within the same application context, with no network boundary between them.

## Business Modules

| Module | Path | Purpose |
|--------|------|---------|
| **Human Resources** | `/api/hr` | Employee lifecycle, department management |
| **Payroll** | `/api/payroll` | Salary processing, tax calculations |
| **Accounting** | `/api/accounting` | General ledger, journal entries |
| **Finance** | `/api/finance` | Budgeting, financial planning, reporting |
| **Billing** | `/api/billing` | Customer invoicing, payment tracking |
| **Procurement** | `/api/procurement` | Purchase orders, vendor management |
| **Inventory** | `/api/inventory` | Stock management, automatic reordering |
| **Supply Chain** | `/api/supply-chain` | Shipments, logistics, carrier management |

### Module Dependency Graph

```
┌─────────────┐
│ Human       │
│ Resources   │◄─────────────────────┐
└──────┬──────┘                      │
       │ getEmployeeById()            │
       ▼                              │
┌─────────────┐                      │
│   Payroll   │                      │
└──────┬──────┘                      │
       │ recordPayrollExpense()       │
       ▼                              │
┌─────────────┐                      │
│ Accounting  │◄──────┬──────────────┘
└──────▲──────┘       │
       │              │ recordRevenue()
       │              │
┌──────┴──────┐  ┌────┴─────┐  ┌──────────────┐
│   Finance   │  │ Billing  │  │ Procurement  │◄───┐
└─────────────┘  └──────────┘  └──────────────┘    │
                                                    │ createReorderPO()
                                             ┌──────┴─────┐
                                             │ Inventory  │
                                             └────────────┘

┌─────────────┐
│ Supply Chain│  (independent)
└─────────────┘
```

## API Versions

The application exposes two API versions simultaneously.

### v1 — `GET /api/...`
- Returns data directly (arrays or plain objects)
- snake_case property names
- No pagination on list endpoints
- Includes demo/mock data endpoints (`/api/demo/*`)

### v2 — `GET /api/v2/...`
- Standardized response envelope: `{ success, data, timestamp }`
- camelCase property names
- Pagination on all list endpoints (`?page=1&limit=10`)
- Consistent error responses: `{ success, error: { code, message, details }, timestamp }`
- New status codes: `204` for DELETE, `202` for batch operations
- Demo endpoints removed

See [`postman/specifications/V1_TO_V2_MIGRATION_GUIDE.md`](postman/specifications/V1_TO_V2_MIGRATION_GUIDE.md) for a full breakdown of breaking changes and migration steps.

## API Endpoints

All modules are served from a single application on **http://localhost:3001**.

### System
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api` | API info and module listing |

### Human Resources (`/api/hr` · `/api/v2/hr`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | List all employees |
| `POST` | `/employees` | Create an employee |
| `GET` | `/employees/:id` | Get employee by ID |
| `PUT` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Delete employee *(v2 only, 204)* |
| `PATCH` | `/employees/:id/promote` | Promote employee |
| `POST` | `/employees/:id/terminate` | Terminate employee |
| `GET` | `/departments` | List all departments |
| `POST` | `/departments` | Create a department |
| `GET` | `/departments/:id` | Get department by ID |
| `GET` | `/statistics` | HR statistics |

### Payroll (`/api/payroll` · `/api/v2/payroll`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/process` | Process payroll for one employee |
| `POST` | `/process-batch` | Batch payroll processing *(v2: 202)* |
| `GET` | `/` | List payroll records |
| `GET` | `/:id` | Get payroll record by ID |
| `POST` | `/:id/approve` | Approve a payroll record |
| `GET` | `/employee/:id` | Get payroll history for an employee |

### Accounting (`/api/accounting` · `/api/v2/accounting`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/journal-entries` | Create a journal entry |
| `GET` | `/transactions` | List transactions |
| `GET` | `/transactions/:id` | Get transaction by ID |
| `GET` | `/general-ledger` | Get general ledger |
| `GET` | `/trial-balance` | Get trial balance |

### Finance (`/api/finance` · `/api/v2/finance`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/budgets` | Create a budget |
| `GET` | `/budgets` | List budgets |
| `GET` | `/budgets/:id` | Get budget by ID |
| `POST` | `/budgets/:id/close` | Close a budget |
| `GET` | `/budgets/:id/utilization` | Get budget utilization |
| `GET` | `/departments/:id/budget-summary` | Department budget summary |
| `GET` | `/reports` | Generate financial report |

### Billing (`/api/billing` · `/api/v2/billing`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/customers` | Create a customer |
| `GET` | `/customers` | List customers |
| `GET` | `/customers/:id` | Get customer by ID |
| `GET` | `/customers/:id/balance` | Get customer balance |
| `POST` | `/invoices` | Create an invoice |
| `GET` | `/invoices` | List invoices |
| `GET` | `/invoices/:id` | Get invoice by ID |
| `POST` | `/invoices/:id/send` | Send invoice to customer |
| `POST` | `/invoices/:id/payments` | Record a payment |
| `POST` | `/invoices/:id/cancel` | Cancel an invoice |
| `GET` | `/invoices/overdue` | List overdue invoices |

### Procurement (`/api/procurement` · `/api/v2/procurement`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/vendors` | Create a vendor |
| `GET` | `/vendors` | List vendors |
| `GET` | `/vendors/:id` | Get vendor by ID |
| `GET` | `/vendors/:id/performance` | Vendor performance metrics |
| `POST` | `/purchase-orders` | Create a purchase order |
| `GET` | `/purchase-orders` | List purchase orders |
| `GET` | `/purchase-orders/:id` | Get purchase order by ID |
| `POST` | `/purchase-orders/:id/approve` | Approve a PO |
| `POST` | `/purchase-orders/:id/place` | Place a PO with vendor |
| `POST` | `/purchase-orders/:id/receive` | Mark PO as received |
| `POST` | `/purchase-orders/:id/cancel` | Cancel a PO |

### Supply Chain (`/api/supply-chain` · `/api/v2/supply-chain`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/shipments` | Create a shipment |
| `GET` | `/shipments` | List shipments |
| `GET` | `/shipments/:id` | Get shipment by ID |
| `PUT` | `/shipments/:id` | Update a shipment *(v2 only)* |
| `PATCH` | `/shipments/:id` | Partially update a shipment *(v2 only)* |
| `GET` | `/shipments/tracking/:number` | Track by tracking number |
| `GET` | `/shipments/order/:id` | Get shipments for an order |
| `POST` | `/shipments/:id/dispatch` | Dispatch a shipment |
| `PUT` | `/shipments/:id/status` | Update shipment status |
| `POST` | `/shipments/:id/deliver` | Mark as delivered |
| `POST` | `/shipments/:id/cancel` | Cancel a shipment |
| `GET` | `/carriers/performance` | Carrier performance metrics |
| `GET` | `/inbound/summary` | Inbound shipment summary |
| `GET` | `/outbound/summary` | Outbound shipment summary |

### Inventory (`/api/inventory` · `/api/v2/inventory`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/items` | Create an inventory item |
| `GET` | `/items` | List inventory items |
| `GET` | `/items/:id` | Get item by ID |
| `GET` | `/items/sku/:sku` | Get item by SKU |
| `PUT` | `/items/:id` | Update an item |
| `POST` | `/stock/adjust` | Adjust stock quantity |
| `POST` | `/stock/reserve` | Reserve stock for an order |
| `POST` | `/stock/release` | Release a reservation |
| `POST` | `/stock/fulfill` | Fulfill a reservation |
| `POST` | `/stock/receive` | Receive stock from a PO |
| `GET` | `/low-stock` | List low-stock items |
| `GET` | `/valuation` | Total inventory valuation |
| `GET` | `/categories` | Inventory breakdown by category |

## Quick Start

### Prerequisites
- Python 3.8+

### Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Start the server:
   ```bash
   python src/app.py
   ```

   The API will run on **http://localhost:3001**

4. Verify it's running:
   ```bash
   curl http://localhost:3001/health
   ```

### Optional: Database Configuration

The app runs in API-only mode without a database. To enable full database functionality:

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
psql postgres <<SQL
CREATE DATABASE erp_monolith;
CREATE USER erp_user WITH PASSWORD 'erp_password';
GRANT ALL PRIVILEGES ON DATABASE erp_monolith TO erp_user;
SQL

# Update .env with DB credentials and restart
python src/app.py
```

### Docker

```bash
docker build -t erp-monolith .
docker run -p 3001:3001 erp-monolith
```

A `kubernetes-deployment.yaml` is also provided for Kubernetes deployments.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Python 3.8+ |
| **Framework** | Flask 3.0 |
| **Database** | PostgreSQL (optional) |
| **Auth** | JWT |

## Project Structure

```
enterprise-resource-planning/
├── src/
│   ├── app.py                  # Single Flask application — all routes & modules
│   ├── modules/                # Optional modular route files
│   │   ├── human_resources.py
│   │   ├── payroll.py
│   │   ├── accounting.py
│   │   ├── finance.py
│   │   ├── billing.py
│   │   ├── procurement.py
│   │   ├── supply_chain.py
│   │   └── inventory.py
│   └── services/
│       └── mock_data.py        # In-memory demo data
├── postman/
│   ├── collections/            # Postman collection files (v1 & v2)
│   ├── environments/           # Postman environment (ERP_Development)
│   ├── globals/                # Postman workspace globals
│   └── specifications/         # OpenAPI specs (v1 & v2) + migration guide
├── frontend/                   # React frontend (optional)
├── Dockerfile
├── kubernetes-deployment.yaml
├── requirements.txt            # Python dependencies
└── .env.example
```

## Postman Collections

Two Postman collections are included under `postman/collections/`:

- **Enterprise Resource Planning API** — covers the v1 API
- **Enterprise Resource Planning API v2** — covers the v2 API

Import either collection along with `postman/environments/ERP_Development.postman_environment.json` to get started quickly. The OpenAPI specifications in `postman/specifications/` can be used to generate or validate client code.

## Monolithic Design Highlights

### Advantages
- **Simple deployment** — one process, one `python src/app.py`
- **No network overhead** — modules call each other in-process
- **ACID transactions** — a single database transaction can span multiple modules
- **Easy debugging** — one log stream, one stack trace across the whole request

### Disadvantages
- **Tight coupling** — an interface change in one module can break others
- **All-or-nothing scaling** — cannot scale a single module independently
- **Single point of failure** — an unhandled error can bring down the entire system
- **Deployment risk** — any change requires a full redeploy of every module

### Monolith vs. Microservices

| Aspect | Monolith (This App) | Microservices |
|--------|---------------------|---------------|
| Deployment | Single unit | Independent services |
| Scaling | Scale entire app | Scale per service |
| Database | Shared | Database per service |
| Communication | Direct function calls | HTTP / message queues |
| Transactions | ACID | Eventual consistency |
| Technology | Single stack | Polyglot |
| Team structure | One codebase | Team per service |
| Failure isolation | ❌ Crash affects all | ✅ Isolated |

This application represents **Stage 1** — the classic monolith that many production systems start from before gradually extracting services.
