# Visual Architecture Diagrams

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Service Communication Patterns](#service-communication-patterns)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Authentication Flow](#authentication-flow)
5. [Event Flow Examples](#event-flow-examples)
6. [Database Architecture](#database-architecture)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Web    │  │  Mobile  │  │  Desktop │  │   CLI    │       │
│  │   App    │  │   App    │  │   App    │  │   Tool   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      API Gateway          │
        │      (Port 3000)          │
        │  • Authentication         │
        │  • Rate Limiting          │
        │  • Request Routing        │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│  Auth Service  │         │  Service Mesh   │
│  (Port 3009)   │         │  (Optional)     │
└────────────────┘         └─────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐        ┌────────▼────────┐      ┌────────▼────────┐
│   Employee     │        │    Payroll      │      │   Accounting    │
│   Service      │        │    Service      │      │    Service      │
│   (3001)       │        │    (3002)       │      │    (3003)       │
└───────┬────────┘        └────────┬────────┘      └────────┬────────┘
        │                          │                         │
┌───────▼────────┐        ┌────────▼────────┐      ┌────────▼────────┐
│  employee_db   │        │   payroll_db    │      │  accounting_db  │
└────────────────┘        └─────────────────┘      └─────────────────┘
        │                          │                         │
        └──────────────────────────┼─────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   Event Bus     │
                          │  (RabbitMQ/     │
                          │   Kafka)        │
                          └─────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐        ┌────────▼────────┐      ┌────────▼────────┐
│    Billing     │        │  Procurement    │      │   Inventory     │
│    Service     │        │    Service      │      │    Service      │
│    (3004)      │        │    (3005)       │      │    (3006)       │
└───────┬────────┘        └────────┬────────┘      └────────┬────────┘
        │                          │                         │
┌───────▼────────┐        ┌────────▼────────┐      ┌────────▼────────┐
│   billing_db   │        │ procurement_db  │      │  inventory_db   │
└────────────────┘        └─────────────────┘      └─────────────────┘
        │                          │                         │
        └──────────────────────────┼─────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐        ┌────────▼────────┐                │
│ Supply Chain   │        │    Finance      │                │
│   Service      │        │    Service      │                │
│   (3007)       │        │    (3008)       │                │
└───────┬────────┘        └────────┬────────┘                │
        │                          │                         │
┌───────▼────────┐        ┌────────▼────────┐                │
│supply_chain_db │        │   finance_db    │                │
└────────────────┘        └─────────────────┘                │
        │                          │                         │
        └──────────────────────────┴─────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   Monitoring    │
                          │  • Prometheus   │
                          │  • Grafana      │
                          │  • ELK Stack    │
                          └─────────────────┘
```

---

## Service Communication Patterns

### Synchronous Communication (REST API)

```
┌──────────────┐                    ┌──────────────┐
│   Payroll    │                    │   Employee   │
│   Service    │                    │   Service    │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ 1. GET /employees/{id}            │
       │───────────────────────────────────▶│
       │                                   │
       │ 2. Employee Data                  │
       │◀───────────────────────────────────│
       │                                   │
       │ 3. Calculate Payroll              │
       │    (using employee data)          │
       │                                   │
```

### Asynchronous Communication (Events)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Payroll    │         │  Event Bus   │         │  Accounting  │
│   Service    │         │ (RabbitMQ)   │         │   Service    │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. Process Payroll     │                        │
       │                        │                        │
       │ 2. Publish             │                        │
       │    PayrollProcessed    │                        │
       │────────────────────────▶│                        │
       │                        │                        │
       │                        │ 3. Consume Event       │
       │                        │────────────────────────▶│
       │                        │                        │
       │                        │                        │ 4. Create
       │                        │                        │    Journal
       │                        │                        │    Entry
       │                        │                        │
       │                        │ 5. Publish             │
       │                        │    JournalEntryCreated │
       │                        │◀────────────────────────│
       │                        │                        │
```

---

## Data Flow Diagrams

### Payroll Processing Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. POST /payroll/process
     │    { employeeId, payPeriod }
     ▼
┌─────────────────┐
│  API Gateway    │
└────┬────────────┘
     │ 2. Validate JWT
     │    Check permissions
     ▼
┌─────────────────┐
│ Payroll Service │
└────┬────────────┘
     │ 3. GET /employees/{id}
     ▼
┌─────────────────┐
│Employee Service │
└────┬────────────┘
     │ 4. Return employee data
     │    { salary, department }
     ▼
┌─────────────────┐
│ Payroll Service │
│                 │
│ 5. Calculate:   │
│    • Gross Pay  │
│    • Taxes      │
│    • Net Pay    │
└────┬────────────┘
     │ 6. Save to payroll_db
     ▼
┌─────────────────┐
│  payroll_db     │
└────┬────────────┘
     │ 7. Publish PayrollProcessed event
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │ 8. Consume event
     ▼
┌─────────────────┐
│Accounting Service│
│                 │
│ 9. Create:      │
│    • Debit:     │
│      Salary     │
│      Expense    │
│    • Credit:    │
│      Payroll    │
│      Payable    │
└────┬────────────┘
     │ 10. Save to accounting_db
     ▼
┌─────────────────┐
│  accounting_db  │
└────┬────────────┘
     │ 11. Return success
     ▼
┌─────────┐
│  User   │
└─────────┘
```

### Invoice Payment Flow

```
┌─────────┐
│Customer │
└────┬────┘
     │ 1. Make payment
     ▼
┌─────────────────┐
│ Billing Service │
│                 │
│ 2. Record:      │
│    • Payment    │
│    • Update     │
│      Invoice    │
└────┬────────────┘
     │ 3. Save to billing_db
     ▼
┌─────────────────┐
│   billing_db    │
└────┬────────────┘
     │ 4. Publish PaymentReceived event
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │ 5. Consume event
     ▼
┌─────────────────┐
│Accounting Service│
│                 │
│ 6. Create:      │
│    • Debit:     │
│      Cash       │
│    • Credit:    │
│      Accounts   │
│      Receivable │
└────┬────────────┘
     │ 7. Save to accounting_db
     ▼
┌─────────────────┐
│  accounting_db  │
└────┬────────────┘
     │ 8. Publish JournalEntryCreated
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │ 9. Consume event
     ▼
┌─────────────────┐
│ Finance Service │
│                 │
│ 10. Update:     │
│     • Budget    │
│       tracking  │
│     • Reports   │
└─────────────────┘
```

### Inventory Reorder Flow

```
┌─────────────────┐
│Inventory Service│
│                 │
│ 1. Detect:      │
│    Stock level  │
│    below        │
│    reorder point│
└────┬────────────┘
     │ 2. Publish StockLevelLow event
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │ 3. Consume event
     ▼
┌─────────────────┐
│Procurement Svc  │
│                 │
│ 4. Create PO:   │
│    • Get vendor │
│    • Calculate  │
│      quantity   │
│    • Generate   │
│      PO number  │
└────┬────────────┘
     │ 5. Save to procurement_db
     ▼
┌─────────────────┐
│ procurement_db  │
└────┬────────────┘
     │ 6. Publish PurchaseOrderCreated
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │ 7. Consume event
     ▼
┌─────────────────┐
│Inventory Service│
│                 │
│ 8. Update:      │
│    quantity_on  │
│    _order       │
└─────────────────┘
```

---

## Authentication Flow

### Login Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. POST /auth/login
     │    { email, password }
     ▼
┌─────────────────┐
│  Auth Service   │
│                 │
│ 2. Validate:    │
│    • Email      │
│    • Password   │
│    • MFA (opt)  │
└────┬────────────┘
     │ 3. Query auth_db
     ▼
┌─────────────────┐
│    auth_db      │
└────┬────────────┘
     │ 4. User record
     ▼
┌─────────────────┐
│  Auth Service   │
│                 │
│ 5. Generate:    │
│    • Access     │
│      Token      │
│      (1 hour)   │
│    • Refresh    │
│      Token      │
│      (7 days)   │
└────┬────────────┘
     │ 6. Return tokens
     ▼
┌─────────┐
│  User   │
│         │
│ Stores: │
│ • Access│
│   Token │
│ • Refresh│
│   Token │
└─────────┘
```

### Authenticated Request Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. GET /api/v1/employees
     │    Authorization: Bearer {token}
     ▼
┌─────────────────┐
│  API Gateway    │
│                 │
│ 2. Validate:    │
│    • Token      │
│      signature  │
│    • Expiry     │
│    • Issuer     │
└────┬────────────┘
     │ 3. Extract user info
     │    { id, email, role, permissions }
     ▼
┌─────────────────┐
│  API Gateway    │
│                 │
│ 4. Forward:     │
│    Headers:     │
│    • X-User-Id  │
│    • X-User-Role│
│    • X-User-    │
│      Permissions│
└────┬────────────┘
     │ 5. Route to service
     ▼
┌─────────────────┐
│Employee Service │
│                 │
│ 6. Check:       │
│    permissions  │
│    for endpoint │
└────┬────────────┘
     │ 7. Query employee_db
     ▼
┌─────────────────┐
│  employee_db    │
└────┬────────────┘
     │ 8. Employee data
     ▼
┌─────────────────┐
│Employee Service │
└────┬────────────┘
     │ 9. Return response
     ▼
┌─────────────────┐
│  API Gateway    │
└────┬────────────┘
     │ 10. Forward response
     ▼
┌─────────┐
│  User   │
└─────────┘
```

---

## Event Flow Examples

### Employee Update Propagation

```
┌─────────────────┐
│Employee Service │
└────┬────────────┘
     │ 1. PUT /employees/{id}
     │    { salary: 110000 }
     ▼
┌─────────────────┐
│  employee_db    │
│                 │
│ UPDATE employees│
│ SET salary =    │
│   110000        │
└────┬────────────┘
     │ 2. Publish EmployeeUpdated
     ▼
┌─────────────────┐
│   Event Bus     │
│                 │
│ Topic:          │
│ employee.events │
│ Key:            │
│ employee.updated│
└────┬────────────┘
     │
     ├──────────────────────┬──────────────────────┐
     │                      │                      │
     ▼                      ▼                      ▼
┌─────────────┐    ┌─────────────┐      ┌─────────────┐
│  Payroll    │    │  Finance    │      │ Notification│
│  Service    │    │  Service    │      │  Service    │
│             │    │             │      │             │
│ Update:     │    │ Update:     │      │ Send:       │
│ • employee  │    │ • budget    │      │ • Email to  │
│   _cache    │    │   tracking  │      │   manager   │
│             │    │             │      │             │
└─────────────┘    └─────────────┘      └─────────────┘
```

### Purchase Order Lifecycle

```
┌─────────────────┐
│Procurement Svc  │
└────┬────────────┘
     │ 1. POST /purchase-orders
     ▼
┌─────────────────┐
│ procurement_db  │
│ INSERT INTO     │
│ purchase_orders │
└────┬────────────┘
     │ 2. Publish PurchaseOrderCreated
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │
     ├──────────────────────┐
     │                      │
     ▼                      ▼
┌─────────────┐    ┌─────────────┐
│  Finance    │    │ Notification│
│  Service    │    │  Service    │
│             │    │             │
│ Track:      │    │ Notify:     │
│ • Budget    │    │ • Approver  │
│   impact    │    │             │
└─────────────┘    └─────────────┘
     │
     │ 3. POST /purchase-orders/{id}/approve
     ▼
┌─────────────────┐
│Procurement Svc  │
└────┬────────────┘
     │ 4. Publish PurchaseOrderApproved
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │
     │ 5. Vendor receives PO
     │ 6. Goods delivered
     │ 7. POST /purchase-orders/{id}/receive
     ▼
┌─────────────────┐
│Procurement Svc  │
└────┬────────────┘
     │ 8. Publish PurchaseOrderReceived
     ▼
┌─────────────────┐
│   Event Bus     │
└────┬────────────┘
     │
     ├──────────────────────┬──────────────────────┐
     │                      │                      │
     ▼                      ▼                      ▼
┌─────────────┐    ┌─────────────┐      ┌─────────────┐
│ Inventory   │    │ Accounting  │      │  Finance    │
│  Service    │    │  Service    │      │  Service    │
│             │    │             │      │             │
│ Adjust:     │    │ Create:     │      │ Update:     │
│ • Stock     │    │ • Journal   │      │ • Budget    │
│   levels    │    │   entry     │      │   spent     │
│             │    │             │      │             │
└─────────────┘    └─────────────┘      └─────────────┘
```

---

## Database Architecture

### Monolithic Database (Before)

```
┌─────────────────────────────────────────────────────────┐
│              Monolithic Database (PostgreSQL)           │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  employees   │  │ departments  │  │   payroll    │ │
│  │              │  │              │  │   _records   │ │
│  │ • id         │  │ • id         │  │              │ │
│  │ • name       │  │ • name       │  │ • employee_id│ │
│  │ • salary     │  │ • code       │  │   (FK)       │ │
│  │ • dept_id ───┼──┼─▶id          │  │ • gross_pay  │ │
│  │   (FK)       │  │              │  │ • net_pay    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  customers   │  │   invoices   │  │   vendors    │ │
│  │              │  │              │  │              │ │
│  │ • id         │  │ • id         │  │ • id         │ │
│  │ • name       │  │ • customer_id│  │ • name       │ │
│  │ • email      │  │   (FK) ──────┼──┼─▶id          │ │
│  │              │  │ • amount     │  │ • email      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ purchase_    │  │  inventory   │  │  shipments   │ │
│  │  orders      │  │   _items     │  │              │ │
│  │              │  │              │  │ • id         │ │
│  │ • id         │  │ • id         │  │ • order_id   │ │
│  │ • vendor_id  │  │ • sku        │  │ • tracking   │ │
│  │   (FK) ──────┼──┼─▶id          │  │ • status     │ │
│  │ • amount     │  │ • quantity   │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│         ⚠️  All services access same database           │
│         ⚠️  Tight coupling via foreign keys             │
│         ⚠️  Single point of failure                     │
└─────────────────────────────────────────────────────────┘
```

### Microservices Databases (After)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  employee_db    │  │   payroll_db    │  │ accounting_db   │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │ employees   │ │  │ │  payroll    │ │  │ │  journal    │ │
│ │             │ │  │ │  _records   │ │  │ │  _entries   │ │
│ │ • id        │ │  │ │             │ │  │ │             │ │
│ │ • name      │ │  │ │ • employee  │ │  │ │ • journal   │ │
│ │ • salary    │ │  │ │   _id (ref) │ │  │ │   _number   │ │
│ │ • dept_id   │ │  │ │ • gross_pay │ │  │ │ • amount    │ │
│ └─────────────┘ │  │ │ • net_pay   │ │  │ │ • source    │ │
│                 │  │ └─────────────┘ │  │ └─────────────┘ │
│ ┌─────────────┐ │  │                 │  │                 │
│ │departments  │ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │             │ │  │ │  employee   │ │  │ │transactions │ │
│ │ • id        │ │  │ │  _cache     │ │  │ │             │ │
│ │ • name      │ │  │ │             │ │  │ │ • account   │ │
│ │ • code      │ │  │ │ • employee  │ │  │ │   _code     │ │
│ └─────────────┘ │  │ │   _id       │ │  │ │ • debit     │ │
│                 │  │ │ • name      │ │  │ │ • credit    │ │
│  ✅ Owned by    │  │ │ • salary    │ │  │ └─────────────┘ │
│     Employee    │  │ │ (cached)    │ │  │                 │
│     Service     │  │ └─────────────┘ │  │  ✅ Owned by    │
└─────────────────┘  │                 │  │     Accounting  │
                     │  ✅ Owned by    │  │     Service     │
                     │     Payroll     │  └─────────────────┘
                     │     Service     │
                     └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   billing_db    │  │ procurement_db  │  │  inventory_db   │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │ customers   │ │  │ │  vendors    │ │  │ │ inventory   │ │
│ │             │ │  │ │             │ │  │ │  _items     │ │
│ │ • id        │ │  │ │ • id        │ │  │ │             │ │
│ │ • name      │ │  │ │ • name      │ │  │ │ • id        │ │
│ │ • email     │ │  │ │ • email     │ │  │ │ • sku       │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ │ • quantity  │ │
│                 │  │                 │  │ └─────────────┘ │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │                 │
│ │  invoices   │ │  │ │ purchase    │ │  │ ┌─────────────┐ │
│ │             │ │  │ │  _orders    │ │  │ │   stock     │ │
│ │ • id        │ │  │ │             │ │  │ │  movements  │ │
│ │ • customer  │ │  │ │ • id        │ │  │ │             │ │
│ │   _id (ref) │ │  │ │ • vendor_id │ │  │ │ • item_id   │ │
│ │ • amount    │ │  │ │   (ref)     │ │  │ │ • quantity  │ │
│ └─────────────┘ │  │ │ • amount    │ │  │ │ • type      │ │
│                 │  │ └─────────────┘ │  │ └─────────────┘ │
│  ✅ Owned by    │  │                 │  │                 │
│     Billing     │  │  ✅ Owned by    │  │  ✅ Owned by    │
│     Service     │  │     Procurement │  │     Inventory   │
└─────────────────┘  │     Service     │  │     Service     │
                     └─────────────────┘  └─────────────────┘

        ✅ No foreign keys between databases
        ✅ Each service owns its data
        ✅ Data accessed via APIs or events
```

---

## Deployment Architecture

### Kubernetes Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Ingress Controller                  │ │
│  │              (NGINX / Traefik / Istio)                │ │
│  └────────────────────────┬──────────────────────────────┘ │
│                           │                                 │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │                   API Gateway Service                  │ │
│  │                   (3 replicas)                         │ │
│  └────────────────────────┬──────────────────────────────┘ │
│                           │                                 │
│  ┌────────────────────────┼──────────────────────────────┐ │
│  │                        │                              │ │
│  │  ┌──────────────┐  ┌──▼───────────┐  ┌────────────┐ │ │
│  │  │  Employee    │  │   Payroll    │  │ Accounting │ │ │
│  │  │  Service     │  │   Service    │  │  Service   │ │ │
│  │  │  (2 replicas)│  │  (3 replicas)│  │(2 replicas)│ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │ │
│  │         │                 │                 │        │ │
│  │  ┌──────▼───────┐  ┌──────▼───────┐  ┌─────▼──────┐ │ │
│  │  │  employee    │  │   payroll    │  │ accounting │ │ │
│  │  │  _db (PVC)   │  │   _db (PVC)  │  │ _db (PVC)  │ │ │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Billing    │  │ Procurement  │  │ Inventory  │ │ │
│  │  │   Service    │  │   Service    │  │  Service   │ │ │
│  │  │  (2 replicas)│  │  (2 replicas)│  │(2 replicas)│ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │ │
│  │         │                 │                 │        │ │
│  │  ┌──────▼───────┐  ┌──────▼───────┐  ┌─────▼──────┐ │ │
│  │  │   billing    │  │ procurement  │  │ inventory  │ │ │
│  │  │   _db (PVC)  │  │  _db (PVC)   │  │ _db (PVC)  │ │ │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Message Broker (RabbitMQ)                │ │
│  │                   (3 replicas)                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           Monitoring & Logging Stack                  │ │
│  │  • Prometheus  • Grafana  • ELK  • Jaeger            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Metrics Collection

```
┌─────────────────┐
│   Services      │
│  (All 8)        │
└────┬────────────┘
     │ Expose /metrics endpoint
     │ (Prometheus format)
     ▼
┌─────────────────┐
│  Prometheus     │
│                 │
│ • Scrape metrics│
│   every 15s     │
│ • Store time    │
│   series data   │
└────┬────────────┘
     │ Query metrics
     ▼
┌─────────────────┐
│   Grafana       │
│                 │
│ • Dashboards    │
│ • Alerts        │
│ • Visualizations│
└─────────────────┘
```

### Distributed Tracing

```
┌─────────┐
│  User   │
└────┬────┘
     │ Request with Trace-ID
     ▼
┌─────────────────┐
│  API Gateway    │ ──────┐
└────┬────────────┘       │
     │                    │
     ▼                    │
┌─────────────────┐       │
│ Payroll Service │ ──────┤
└────┬────────────┘       │
     │                    │ Send spans to Jaeger
     ▼                    │
┌─────────────────┐       │
│Employee Service │ ──────┤
└────┬────────────┘       │
     │                    │
     ▼                    │
┌─────────────────┐       │
│Accounting Svc   │ ──────┘
└─────────────────┘
                          │
                          ▼
                   ┌─────────────────┐
                   │     Jaeger      │
                   │                 │
                   │ • Trace view    │
                   │ • Latency       │
                   │ • Dependencies  │
                   └─────────────────┘
```

---

## Summary

This visual guide provides:
- ✅ High-level system architecture
- ✅ Service communication patterns
- ✅ Data flow through the system
- ✅ Authentication and authorization flows
- ✅ Event propagation examples
- ✅ Database architecture comparison
- ✅ Deployment architecture
- ✅ Monitoring and observability setup

These diagrams should help stakeholders understand the microservices architecture and how all components work together.

---

*For detailed implementation, refer to the other documentation files.*
