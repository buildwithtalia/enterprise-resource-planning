# Database Strategy for Microservices

## Overview

This document outlines the database strategy for the microservices architecture, including database separation, schema design, data ownership, and migration strategies.

## Core Principles

1. **Database per Service**: Each microservice owns its database
2. **No Shared Tables**: Services cannot directly access other services' databases
3. **Data Sovereignty**: Each service is the single source of truth for its data
4. **Eventual Consistency**: Accept eventual consistency between services
5. **API-Based Access**: Services access other services' data via APIs or events

---

## Database Architecture

### Current Monolithic Database

```
┌─────────────────────────────────────────┐
│         Monolithic Database             │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │employees │  │departments│           │
│  └──────────┘  └──────────┘           │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ payroll  │  │ invoices │           │
│  └──────────┘  └──────────┘           │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ vendors  │  │inventory │           │
│  └──────────┘  └──────────┘           │
│                                         │
│  ... (all tables in one database)      │
└─────────────────────────────────────────┘
```

### Target Microservices Databases

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ employee_db  │  │ payroll_db   │  │accounting_db │
│              │  │              │  │              │
│ • employees  │  │ • payroll    │  │ • journal    │
│ • departments│  │   _records   │  │   _entries   │
│              │  │              │  │ • transactions│
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  billing_db  │  │procurement_db│  │ inventory_db │
│              │  │              │  │              │
│ • customers  │  │ • vendors    │  │ • inventory  │
│ • invoices   │  │ • purchase   │  │   _items     │
│              │  │   _orders    │  │ • stock      │
└──────────────┘  └──────────────┘  │   _movements │
                                    └──────────────┘

┌──────────────┐  ┌──────────────┐
│supply_chain  │  │  finance_db  │
│     _db      │  │              │
│              │  │ • budgets    │
│ • shipments  │  │ • financial  │
│              │  │   _reports   │
└──────────────┘  └──────────────┘
```

---

## Service Database Schemas

### 1. Employee Service Database (employee_db)

```sql
-- Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    job_title VARCHAR(100) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    hire_date DATE NOT NULL,
    termination_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, on_leave, terminated
    department_id UUID REFERENCES departments(id),
    social_security_number VARCHAR(20),
    bank_account_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 -- for optimistic locking
);

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department_id);

-- Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    manager_id UUID REFERENCES employees(id),
    budget_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_code ON departments(code);

-- Employee History (for audit trail)
CREATE TABLE employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- created, updated, terminated
    changed_fields JSONB,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_history_employee ON employee_history(employee_id);
```

---

### 2. Payroll Service Database (payroll_db)

```sql
-- Payroll Records Table
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL, -- Reference to Employee Service
    employee_name VARCHAR(200) NOT NULL, -- Denormalized for performance
    department VARCHAR(100), -- Denormalized
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    gross_pay DECIMAL(10, 2) NOT NULL,
    federal_tax DECIMAL(10, 2) NOT NULL,
    state_tax DECIMAL(10, 2) NOT NULL,
    social_security_tax DECIMAL(10, 2) NOT NULL,
    medicare_tax DECIMAL(10, 2) NOT NULL,
    deductions DECIMAL(10, 2) DEFAULT 0,
    net_pay DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processed, paid
    accounting_transaction_id UUID, -- Reference to Accounting Service
    processed_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX idx_payroll_status ON payroll_records(status);
CREATE INDEX idx_payroll_period ON payroll_records(pay_period_start, pay_period_end);

-- Employee Cache (denormalized data from Employee Service)
CREATE TABLE employee_cache (
    employee_id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    salary DECIMAL(10, 2),
    department VARCHAR(100),
    status VARCHAR(20),
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax Configuration
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    federal_rate DECIMAL(5, 4) NOT NULL,
    state_rate DECIMAL(5, 4) NOT NULL,
    social_security_rate DECIMAL(5, 4) NOT NULL,
    medicare_rate DECIMAL(5, 4) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. Accounting Service Database (accounting_db)

```sql
-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    parent_account_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX idx_accounts_type ON chart_of_accounts(account_type);

-- Journal Entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100), -- Reference to source (e.g., PAYROLL-2024-001)
    source_service VARCHAR(50), -- payroll, billing, procurement
    source_id UUID, -- ID from source service
    total_debit DECIMAL(15, 2) NOT NULL,
    total_credit DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'posted', -- draft, posted, reversed
    posted_by UUID,
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_number ON journal_entries(journal_number);
CREATE INDEX idx_journal_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_source ON journal_entries(source_service, source_id);

-- Journal Entry Lines
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_code VARCHAR(20) NOT NULL REFERENCES chart_of_accounts(account_code),
    description TEXT,
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_entry_lines(account_code);

-- General Ledger (materialized view for performance)
CREATE TABLE general_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) NOT NULL,
    transaction_date DATE NOT NULL,
    journal_entry_id UUID NOT NULL,
    description TEXT,
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    running_balance DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_account ON general_ledger(account_code, transaction_date);
CREATE INDEX idx_ledger_date ON general_ledger(transaction_date);

-- Event Processing Log (for idempotency)
CREATE TABLE processed_events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    source_service VARCHAR(50) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result JSONB
);

CREATE INDEX idx_processed_events_type ON processed_events(event_type);
```

---

### 4. Billing Service Database (billing_db)

```sql
-- Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

-- Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, paid, overdue, cancelled
    notes TEXT,
    accounting_transaction_id UUID, -- Reference to Accounting Service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_line_items(invoice_id);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50), -- bank_transfer, credit_card, check, cash
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

---

### 5. Procurement Service Database (procurement_db)

```sql
-- Vendors Table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    payment_terms VARCHAR(50), -- Net 30, Net 60, etc.
    tax_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    rating DECIMAL(3, 2), -- 0.00 to 5.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);

-- Purchase Orders Table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, ordered, received, cancelled
    approved_by UUID,
    approved_at TIMESTAMP,
    received_by UUID,
    received_at TIMESTAMP,
    accounting_transaction_id UUID, -- Reference to Accounting Service
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_number ON purchase_orders(po_number);
CREATE INDEX idx_po_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_order_date ON purchase_orders(order_date);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    sku VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_sku ON purchase_order_items(sku);

-- Vendor Performance Metrics
CREATE TABLE vendor_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    metric_date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    quality_issues INTEGER DEFAULT 0,
    average_delivery_days DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_perf_vendor ON vendor_performance(vendor_id);
CREATE INDEX idx_vendor_perf_date ON vendor_performance(metric_date);
```

---

### 6. Inventory Service Database (inventory_db)

```sql
-- Inventory Items Table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_on_order INTEGER DEFAULT 0,
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    warehouse_location VARCHAR(50),
    preferred_vendor_id UUID, -- Reference to Procurement Service
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, discontinued
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 -- for optimistic locking
);

CREATE INDEX idx_inventory_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_status ON inventory_items(status);

-- Stock Movements Table (audit trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    movement_type VARCHAR(50) NOT NULL, -- receipt, adjustment, reservation, fulfillment, damage, theft
    quantity INTEGER NOT NULL, -- positive or negative
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference VARCHAR(100), -- PO number, order number, etc.
    reason TEXT,
    moved_by UUID,
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_date ON stock_movements(moved_at);

-- Stock Reservations Table
CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL,
    order_id UUID NOT NULL, -- Reference to Order Service
    customer_id UUID, -- Reference to Billing Service
    status VARCHAR(20) DEFAULT 'active', -- active, fulfilled, cancelled
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_reservations_item ON stock_reservations(item_id);
CREATE INDEX idx_reservations_order ON stock_reservations(order_id);
CREATE INDEX idx_reservations_status ON stock_reservations(status);

-- Inventory Valuation Snapshots
CREATE TABLE inventory_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    total_items INTEGER NOT NULL,
    total_quantity INTEGER NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    by_category JSONB, -- Category breakdown
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_valuations_date ON inventory_valuations(snapshot_date);
```

---

### 7. Supply Chain Service Database (supply_chain_db)

```sql
-- Shipments Table
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL, -- Reference to Order Service
    shipment_type VARCHAR(20) NOT NULL, -- inbound, outbound
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100) UNIQUE,
    origin_address VARCHAR(255),
    origin_city VARCHAR(100),
    origin_state VARCHAR(50),
    origin_zip_code VARCHAR(20),
    destination_address VARCHAR(255),
    destination_city VARCHAR(100),
    destination_state VARCHAR(50),
    destination_zip_code VARCHAR(20),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_transit, delivered, cancelled
    delivered_to VARCHAR(200),
    dispatched_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_number ON shipments(shipment_number);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Shipment Items
CREATE TABLE shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    weight DECIMAL(10, 2), -- in pounds or kg
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_sku ON shipment_items(sku);

-- Tracking History
CREATE TABLE tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id),
    status VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracking_shipment ON tracking_history(shipment_id);
CREATE INDEX idx_tracking_timestamp ON tracking_history(timestamp);

-- Carrier Performance
CREATE TABLE carrier_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier VARCHAR(100) NOT NULL,
    metric_date DATE NOT NULL,
    total_shipments INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    average_delivery_days DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carrier_perf_carrier ON carrier_performance(carrier);
CREATE INDEX idx_carrier_perf_date ON carrier_performance(metric_date);
```

---

### 8. Finance Service Database (finance_db)

```sql
-- Budgets Table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department VARCHAR(100) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER, -- 1, 2, 3, 4 or NULL for annual
    category VARCHAR(100) NOT NULL, -- Salaries, Operating, Capital, etc.
    allocated_amount DECIMAL(15, 2) NOT NULL,
    spent_amount DECIMAL(15, 2) DEFAULT 0,
    remaining_amount DECIMAL(15, 2) NOT NULL,
    utilization_percentage DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, closed, exceeded
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budgets_department ON budgets(department);
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_status ON budgets(status);

-- Budget Transactions (cache from Accounting Service)
CREATE TABLE budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id),
    transaction_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    source_service VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_txn_budget ON budget_transactions(budget_id);
CREATE INDEX idx_budget_txn_date ON budget_transactions(transaction_date);

-- Financial Reports (cached/materialized)
CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL, -- income_statement, balance_sheet, cash_flow
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_type ON financial_reports(report_type);
CREATE INDEX idx_reports_period ON financial_reports(period_start, period_end);

-- Accounting Data Cache (from Accounting Service)
CREATE TABLE accounting_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    as_of_date DATE NOT NULL,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounting_cache_code ON accounting_data_cache(account_code);
CREATE INDEX idx_accounting_cache_date ON accounting_data_cache(as_of_date);
```

---

## Data Denormalization Strategy

### When to Denormalize

1. **Frequently Accessed Data**: Data that is read often but changes rarely
2. **Performance Critical**: Queries that need to be fast
3. **Reduce API Calls**: Avoid excessive inter-service communication

### Example: Payroll Service Caching Employee Data

```sql
-- In Payroll Service Database
CREATE TABLE employee_cache (
    employee_id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    salary DECIMAL(10, 2),
    department VARCHAR(100),
    status VARCHAR(20),
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update cache when EmployeeUpdated event is received
-- This avoids calling Employee Service API for every payroll calculation
```

### Cache Invalidation Strategy

```typescript
// Event handler in Payroll Service
async handleEmployeeUpdated(event: EmployeeUpdatedEvent) {
  await this.employeeCacheRepo.update(
    { employee_id: event.data.employeeId },
    {
      first_name: event.data.firstName,
      last_name: event.data.lastName,
      salary: event.data.salary,
      department: event.data.department,
      status: event.data.status,
      last_synced_at: new Date()
    }
  );
}
```

---

## Data Consistency Patterns

### 1. Saga Pattern for Distributed Transactions

**Example: Processing Payroll**

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Payroll  │────▶│ Employee │────▶│Accounting│
│ Service  │     │ Service  │     │ Service  │
└──────────┘     └──────────┘     └──────────┘
     │                │                 │
     │ 1. Process     │                 │
     │    Payroll     │                 │
     │                │                 │
     │ 2. Get Employee│                 │
     │    Data        │                 │
     │◀───────────────│                 │
     │                │                 │
     │ 3. Publish PayrollProcessed      │
     │──────────────────────────────────▶│
     │                │                 │
     │                │ 4. Create Journal│
     │                │    Entry        │
     │                │◀────────────────│
     │                │                 │
     │ 5. Update Payroll Status         │
     │◀─────────────────────────────────│
```

### 2. Event Sourcing for Audit Trail

```sql
-- Event Store Table (in each service)
CREATE TABLE event_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    event_version INTEGER NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID,
    correlation_id UUID
);

CREATE INDEX idx_event_store_aggregate ON event_store(aggregate_id);
CREATE INDEX idx_event_store_type ON event_store(event_type);
```

### 3. CQRS (Command Query Responsibility Segregation)

**Write Model (Command)**:
```sql
-- Normalized tables for writes
CREATE TABLE invoices (...);
CREATE TABLE invoice_line_items (...);
```

**Read Model (Query)**:
```sql
-- Denormalized view for reads
CREATE MATERIALIZED VIEW invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.customer_id,
    c.name as customer_name,
    i.total_amount,
    i.paid_amount,
    i.status,
    COUNT(ili.id) as line_item_count
FROM invoices i
JOIN customers c ON i.customer_id = c.id
LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
GROUP BY i.id, c.name;

-- Refresh materialized view periodically or on events
REFRESH MATERIALIZED VIEW CONCURRENTLY invoice_summary;
```

---

## Migration Strategy

### Phase 1: Prepare for Separation

1. **Identify Foreign Key Dependencies**
```sql
-- Find all foreign keys in monolithic database
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

2. **Replace Foreign Keys with Logical References**
```sql
-- Before (with FK)
ALTER TABLE payroll_records 
ADD CONSTRAINT fk_employee 
FOREIGN KEY (employee_id) REFERENCES employees(id);

-- After (without FK, just logical reference)
ALTER TABLE payroll_records 
DROP CONSTRAINT fk_employee;

-- Add comment to document the relationship
COMMENT ON COLUMN payroll_records.employee_id IS 
'Logical reference to Employee Service - employee.id';
```

### Phase 2: Extract Databases

1. **Create New Database for Each Service**
```bash
# Create databases
createdb employee_db
createdb payroll_db
createdb accounting_db
createdb billing_db
createdb procurement_db
createdb inventory_db
createdb supply_chain_db
createdb finance_db
```

2. **Copy Tables to New Databases**
```bash
# Example: Extract employee tables
pg_dump -t employees -t departments monolithic_db | psql employee_db
pg_dump -t payroll_records monolithic_db | psql payroll_db
# ... repeat for all services
```

3. **Add Denormalized Fields**
```sql
-- In payroll_db
ALTER TABLE payroll_records 
ADD COLUMN employee_name VARCHAR(200),
ADD COLUMN department VARCHAR(100);

-- Backfill data
UPDATE payroll_records pr
SET 
    employee_name = e.first_name || ' ' || e.last_name,
    department = d.name
FROM monolithic_db.employees e
JOIN monolithic_db.departments d ON e.department_id = d.id
WHERE pr.employee_id = e.id;
```

### Phase 3: Implement Data Sync

1. **Set Up Event Publishing**
```typescript
// In Employee Service
async updateEmployee(id: string, data: UpdateEmployeeDto) {
  const employee = await this.employeeRepo.update(id, data);
  
  // Publish event
  await this.eventPublisher.publish('employee.events', 'employee.updated', {
    eventType: 'EmployeeUpdated',
    data: {
      employeeId: employee.id,
      changes: data
    }
  });
  
  return employee;
}
```

2. **Set Up Event Consumers**
```typescript
// In Payroll Service
async handleEmployeeUpdated(event: EmployeeUpdatedEvent) {
  // Update denormalized data
  await this.employeeCacheRepo.update(
    { employee_id: event.data.employeeId },
    event.data.changes
  );
}
```

### Phase 4: Cutover

1. **Run Services in Parallel**
   - Keep monolithic database as read-only
   - Route writes to new microservices
   - Compare results for consistency

2. **Gradual Migration**
   - Migrate one service at a time
   - Start with least dependent services (Supply Chain, Inventory)
   - End with most dependent services (Accounting)

3. **Decommission Monolith**
   - Once all services are stable
   - Archive monolithic database
   - Remove old code

---

## Database Connection Management

### Connection Pooling Configuration

```typescript
// database.config.ts
export const databaseConfig = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Connection pool settings
  poolSize: 20,
  maxQueryExecutionTime: 5000,
  
  // SSL for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Logging
  logging: process.env.NODE_ENV === 'development',
  
  // Migrations
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
  
  // Entities
  entities: ['dist/entities/*.js'],
  synchronize: false // Never use in production
};
```

---

## Backup and Disaster Recovery

### Backup Strategy

```bash
# Automated daily backups
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup each service database
for db in employee_db payroll_db accounting_db billing_db procurement_db inventory_db supply_chain_db finance_db
do
  pg_dump -Fc $db > $BACKUP_DIR/${db}_${TIMESTAMP}.dump
done

# Upload to S3
aws s3 sync $BACKUP_DIR s3://erp-backups/$(date +%Y/%m/%d)/
```

### Point-in-Time Recovery

```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://erp-wal-archive/%f'

# Restore to specific point in time
pg_restore -d employee_db /backups/employee_db_20240115.dump
```

---

*Continue to [Authentication & Authorization](./AUTH_STRATEGY.md)*
