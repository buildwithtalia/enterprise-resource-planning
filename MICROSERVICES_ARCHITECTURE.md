# Microservices Architecture - ERP System

## Table of Contents
1. [Overview](#overview)
2. [Service Catalog](#service-catalog)
3. [API Contracts](#api-contracts)
4. [Event Schemas](#event-schemas)
5. [Database Strategy](#database-strategy)
6. [Authentication & Authorization](#authentication--authorization)
7. [Inter-Service Communication](#inter-service-communication)
8. [Migration Strategy](#migration-strategy)

---

## Overview

This document outlines the complete microservices architecture for refactoring the monolithic ERP system into 8 independent, loosely-coupled services.

### Architecture Principles
- **Database per Service**: Each service owns its data
- **API-First Design**: Well-defined REST APIs for synchronous communication
- **Event-Driven**: Asynchronous communication via message broker
- **Independent Deployment**: Services can be deployed independently
- **Decentralized Governance**: Teams own their services end-to-end

### Technology Stack
- **API Gateway**: Kong / AWS API Gateway / Azure API Management
- **Message Broker**: RabbitMQ / Apache Kafka / AWS SNS/SQS
- **Service Discovery**: Consul / Eureka / Kubernetes DNS
- **Authentication**: JWT with OAuth 2.0
- **API Documentation**: OpenAPI 3.0 (Swagger)

---

## Service Catalog

| Service | Port | Database | Primary Responsibility |
|---------|------|----------|------------------------|
| **Employee Service** | 3001 | employee_db | Employee master data management |
| **Payroll Service** | 3002 | payroll_db | Salary processing and tax calculations |
| **Accounting Service** | 3003 | accounting_db | General ledger and financial transactions |
| **Billing Service** | 3004 | billing_db | Customer invoicing and payments |
| **Procurement Service** | 3005 | procurement_db | Vendor and purchase order management |
| **Inventory Service** | 3006 | inventory_db | Stock management and valuation |
| **Supply Chain Service** | 3007 | supply_chain_db | Shipment and logistics tracking |
| **Finance Service** | 3008 | finance_db | Budgeting and financial reporting |
| **API Gateway** | 3000 | - | Request routing and authentication |

---

## Service Dependencies

```
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┬────────┬────────┬────────┬────────┐
    │         │        │        │        │        │        │        │
┌───▼───┐ ┌──▼──┐ ┌───▼───┐ ┌──▼──┐ ┌──▼──┐ ┌───▼───┐ ┌──▼──┐ ┌──▼──┐
│Employee│ │Payroll│ │Account│ │Billing│ │Procure│ │Inventory│ │Supply│ │Finance│
│Service │ │Service│ │Service│ │Service│ │Service│ │Service │ │Chain │ │Service│
└────────┘ └───┬───┘ └───▲───┘ └───┬───┘ └───┬───┘ └────┬────┘ └──────┘ └───┬───┘
               │         │         │         │          │                    │
               │    ┌────┴─────────┴─────────┴──────────┘                    │
               │    │         Event Bus (RabbitMQ/Kafka)                     │
               └────┤                                                         │
                    └─────────────────────────────────────────────────────────┘
```

### Synchronous Dependencies (REST API Calls)
- **Payroll Service** → Employee Service (get employee data)
- **Finance Service** → Accounting Service (get financial data)
- **Inventory Service** → Procurement Service (create purchase orders)

### Asynchronous Dependencies (Events)
- **Payroll Service** → Accounting Service (PayrollProcessed event)
- **Billing Service** → Accounting Service (InvoiceCreated, PaymentReceived events)
- **Procurement Service** → Accounting Service (PurchaseOrderReceived event)
- **Inventory Service** → Procurement Service (StockLevelLow event)

---

## API Contracts

### 1. Employee Service API

**Base URL**: `http://employee-service:3001/api/v1`

#### Endpoints

##### Create Employee
```http
POST /employees
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phoneNumber": "+1-555-0123",
  "jobTitle": "Software Engineer",
  "salary": 95000,
  "hireDate": "2024-01-15",
  "departmentId": "dept-uuid",
  "socialSecurityNumber": "123-45-6789",
  "bankAccountNumber": "1234567890"
}

Response: 201 Created
{
  "id": "emp-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phoneNumber": "+1-555-0123",
  "jobTitle": "Software Engineer",
  "salary": 95000,
  "hireDate": "2024-01-15",
  "status": "active",
  "departmentId": "dept-uuid",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

##### Get Employee by ID
```http
GET /employees/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "emp-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phoneNumber": "+1-555-0123",
  "jobTitle": "Software Engineer",
  "salary": 95000,
  "hireDate": "2024-01-15",
  "status": "active",
  "department": {
    "id": "dept-uuid",
    "name": "Engineering",
    "code": "ENG"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

##### List Employees
```http
GET /employees?status=active&department=ENG&page=1&limit=20
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "id": "emp-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "jobTitle": "Software Engineer",
      "status": "active",
      "department": {
        "id": "dept-uuid",
        "name": "Engineering"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

##### Update Employee
```http
PUT /employees/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "jobTitle": "Senior Software Engineer",
  "salary": 110000
}

Response: 200 OK
{
  "id": "emp-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "jobTitle": "Senior Software Engineer",
  "salary": 110000,
  "updatedAt": "2024-06-15T10:00:00Z"
}
```

##### Terminate Employee
```http
POST /employees/{id}/terminate
Authorization: Bearer {token}
Content-Type: application/json

{
  "terminationDate": "2024-12-31",
  "reason": "Resignation"
}

Response: 200 OK
{
  "id": "emp-uuid",
  "status": "terminated",
  "terminationDate": "2024-12-31",
  "updatedAt": "2024-12-31T10:00:00Z"
}
```

##### Department Endpoints
```http
POST /departments
GET /departments
GET /departments/{id}
PUT /departments/{id}
```

---

### 2. Payroll Service API

**Base URL**: `http://payroll-service:3002/api/v1`

#### Endpoints

##### Process Payroll
```http
POST /payroll/process
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": "emp-uuid",
  "payPeriodStart": "2024-01-01",
  "payPeriodEnd": "2024-01-15",
  "deductions": 150.00
}

Response: 201 Created
{
  "id": "payroll-uuid",
  "employeeId": "emp-uuid",
  "employeeName": "John Doe",
  "payPeriodStart": "2024-01-01",
  "payPeriodEnd": "2024-01-15",
  "grossPay": 3653.85,
  "federalTax": 548.08,
  "stateTax": 182.69,
  "socialSecurityTax": 226.54,
  "medicareTax": 52.98,
  "deductions": 150.00,
  "netPay": 2493.56,
  "status": "pending",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

##### Batch Process Payroll
```http
POST /payroll/batch-process
Authorization: Bearer {token}
Content-Type: application/json

{
  "payPeriodStart": "2024-01-01",
  "payPeriodEnd": "2024-01-15",
  "departmentId": "dept-uuid" // optional
}

Response: 201 Created
{
  "message": "Batch payroll processed",
  "recordsCreated": 150,
  "totalGrossPay": 548077.50,
  "totalNetPay": 396234.12,
  "payrolls": [...]
}
```

##### Approve Payroll
```http
POST /payroll/{id}/approve
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "payroll-uuid",
  "status": "approved",
  "approvedAt": "2024-01-16T10:00:00Z",
  "approvedBy": "manager-uuid"
}
```

##### Get Payroll History
```http
GET /payroll/employee/{employeeId}/history?year=2024
Authorization: Bearer {token}

Response: 200 OK
{
  "employeeId": "emp-uuid",
  "employeeName": "John Doe",
  "year": 2024,
  "totalGrossPay": 95000.00,
  "totalNetPay": 68450.00,
  "payrolls": [
    {
      "id": "payroll-uuid",
      "payPeriodStart": "2024-01-01",
      "payPeriodEnd": "2024-01-15",
      "grossPay": 3653.85,
      "netPay": 2493.56,
      "status": "paid"
    }
  ]
}
```

---

### 3. Accounting Service API

**Base URL**: `http://accounting-service:3003/api/v1`

#### Endpoints

##### Create Journal Entry
```http
POST /journal-entries
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-01-15",
  "description": "Payroll expense for John Doe",
  "reference": "PAYROLL-2024-001",
  "entries": [
    {
      "accountCode": "5100",
      "accountName": "Salary Expense",
      "debitAmount": 3653.85,
      "creditAmount": 0
    },
    {
      "accountCode": "2100",
      "accountName": "Payroll Payable",
      "debitAmount": 0,
      "creditAmount": 3653.85
    }
  ]
}

Response: 201 Created
{
  "id": "journal-uuid",
  "journalNumber": "JE-2024-001234",
  "date": "2024-01-15",
  "description": "Payroll expense for John Doe",
  "reference": "PAYROLL-2024-001",
  "totalDebit": 3653.85,
  "totalCredit": 3653.85,
  "status": "posted",
  "entries": [...],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

##### Get Transactions
```http
GET /transactions?startDate=2024-01-01&endDate=2024-01-31&accountCode=5100
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "id": "txn-uuid",
      "date": "2024-01-15",
      "accountCode": "5100",
      "accountName": "Salary Expense",
      "description": "Payroll expense",
      "debitAmount": 3653.85,
      "creditAmount": 0,
      "balance": 3653.85
    }
  ],
  "summary": {
    "totalDebits": 548077.50,
    "totalCredits": 0,
    "netBalance": 548077.50
  }
}
```

##### Get General Ledger
```http
GET /ledger/{accountCode}?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}

Response: 200 OK
{
  "accountCode": "5100",
  "accountName": "Salary Expense",
  "accountType": "expense",
  "openingBalance": 0,
  "closingBalance": 548077.50,
  "transactions": [...]
}
```

##### Get Trial Balance
```http
GET /trial-balance?date=2024-12-31
Authorization: Bearer {token}

Response: 200 OK
{
  "date": "2024-12-31",
  "accounts": [
    {
      "accountCode": "1000",
      "accountName": "Cash",
      "debitBalance": 500000.00,
      "creditBalance": 0
    },
    {
      "accountCode": "2000",
      "accountName": "Accounts Payable",
      "debitBalance": 0,
      "creditBalance": 150000.00
    }
  ],
  "totalDebits": 2500000.00,
  "totalCredits": 2500000.00,
  "balanced": true
}
```

---

### 4. Billing Service API

**Base URL**: `http://billing-service:3004/api/v1`

#### Endpoints

##### Create Customer
```http
POST /customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-0199",
  "address": "123 Business St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "creditLimit": 50000.00
}

Response: 201 Created
{
  "id": "customer-uuid",
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "status": "active",
  "creditLimit": 50000.00,
  "currentBalance": 0,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

##### Create Invoice
```http
POST /invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "lineItems": [
    {
      "description": "Professional Services - January 2024",
      "quantity": 40,
      "unitPrice": 150.00,
      "amount": 6000.00
    }
  ],
  "subtotal": 6000.00,
  "taxRate": 0.08,
  "taxAmount": 480.00,
  "totalAmount": 6480.00,
  "notes": "Payment due within 30 days"
}

Response: 201 Created
{
  "id": "invoice-uuid",
  "invoiceNumber": "INV-2024-001234",
  "customerId": "customer-uuid",
  "customerName": "Acme Corporation",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "subtotal": 6000.00,
  "taxAmount": 480.00,
  "totalAmount": 6480.00,
  "paidAmount": 0,
  "status": "pending",
  "lineItems": [...],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

##### Record Payment
```http
POST /invoices/{id}/payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 6480.00,
  "paymentDate": "2024-02-10",
  "paymentMethod": "bank_transfer",
  "reference": "TXN-987654"
}

Response: 200 OK
{
  "id": "invoice-uuid",
  "invoiceNumber": "INV-2024-001234",
  "totalAmount": 6480.00,
  "paidAmount": 6480.00,
  "status": "paid",
  "paymentDate": "2024-02-10",
  "updatedAt": "2024-02-10T10:00:00Z"
}
```

##### Get Customer Balance
```http
GET /customers/{id}/balance
Authorization: Bearer {token}

Response: 200 OK
{
  "customerId": "customer-uuid",
  "customerName": "Acme Corporation",
  "currentBalance": 12960.00,
  "creditLimit": 50000.00,
  "availableCredit": 37040.00,
  "overdueAmount": 0,
  "invoices": {
    "pending": 2,
    "overdue": 0,
    "paid": 8
  }
}
```

---

### 5. Procurement Service API

**Base URL**: `http://procurement-service:3005/api/v1`

#### Endpoints

##### Create Vendor
```http
POST /vendors
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Office Supplies Inc",
  "email": "sales@officesupplies.com",
  "phone": "+1-555-0177",
  "address": "456 Vendor Ave",
  "city": "Chicago",
  "state": "IL",
  "zipCode": "60601",
  "country": "USA",
  "paymentTerms": "Net 30",
  "taxId": "12-3456789"
}

Response: 201 Created
{
  "id": "vendor-uuid",
  "name": "Office Supplies Inc",
  "email": "sales@officesupplies.com",
  "status": "active",
  "paymentTerms": "Net 30",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

##### Create Purchase Order
```http
POST /purchase-orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "vendorId": "vendor-uuid",
  "orderDate": "2024-01-15",
  "expectedDeliveryDate": "2024-01-25",
  "items": [
    {
      "sku": "DESK-001",
      "description": "Executive Desk",
      "quantity": 10,
      "unitPrice": 500.00,
      "amount": 5000.00
    }
  ],
  "subtotal": 5000.00,
  "taxAmount": 400.00,
  "shippingCost": 125.50,
  "totalAmount": 5525.50,
  "notes": "Deliver to warehouse"
}

Response: 201 Created
{
  "id": "po-uuid",
  "poNumber": "PO-2024-001234",
  "vendorId": "vendor-uuid",
  "vendorName": "Office Supplies Inc",
  "orderDate": "2024-01-15",
  "expectedDeliveryDate": "2024-01-25",
  "totalAmount": 5525.50,
  "status": "pending",
  "items": [...],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

##### Approve Purchase Order
```http
POST /purchase-orders/{id}/approve
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "po-uuid",
  "poNumber": "PO-2024-001234",
  "status": "approved",
  "approvedBy": "manager-uuid",
  "approvedAt": "2024-01-16T10:00:00Z"
}
```

##### Place Purchase Order
```http
POST /purchase-orders/{id}/place
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "po-uuid",
  "poNumber": "PO-2024-001234",
  "status": "ordered",
  "orderedAt": "2024-01-16T14:00:00Z"
}
```

##### Receive Purchase Order
```http
POST /purchase-orders/{id}/receive
Authorization: Bearer {token}
Content-Type: application/json

{
  "actualDeliveryDate": "2024-01-24",
  "receivedItems": [
    {
      "sku": "DESK-001",
      "quantityReceived": 10,
      "condition": "good"
    }
  ]
}

Response: 200 OK
{
  "id": "po-uuid",
  "poNumber": "PO-2024-001234",
  "status": "received",
  "actualDeliveryDate": "2024-01-24",
  "receivedAt": "2024-01-24T10:00:00Z"
}
```

---

### 6. Inventory Service API

**Base URL**: `http://inventory-service:3006/api/v1`

#### Endpoints

##### Create Inventory Item
```http
POST /items
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "DESK-001",
  "name": "Executive Desk",
  "description": "Premium executive desk with drawers",
  "category": "Furniture",
  "quantityOnHand": 0,
  "reorderPoint": 5,
  "reorderQuantity": 20,
  "unitCost": 500.00,
  "unitPrice": 750.00,
  "warehouseLocation": "A-12-3",
  "preferredVendorId": "vendor-uuid"
}

Response: 201 Created
{
  "id": "item-uuid",
  "sku": "DESK-001",
  "name": "Executive Desk",
  "category": "Furniture",
  "quantityOnHand": 0,
  "quantityReserved": 0,
  "quantityOnOrder": 0,
  "quantityAvailable": 0,
  "reorderPoint": 5,
  "reorderQuantity": 20,
  "unitCost": 500.00,
  "unitPrice": 750.00,
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

##### Adjust Stock
```http
POST /items/{id}/adjust
Authorization: Bearer {token}
Content-Type: application/json

{
  "adjustmentType": "receipt", // receipt, adjustment, damage, theft
  "quantity": 10,
  "reason": "Purchase order PO-2024-001234 received",
  "reference": "PO-2024-001234"
}

Response: 200 OK
{
  "id": "item-uuid",
  "sku": "DESK-001",
  "quantityOnHand": 10,
  "quantityAvailable": 10,
  "adjustment": {
    "type": "receipt",
    "quantity": 10,
    "previousQuantity": 0,
    "newQuantity": 10,
    "adjustedAt": "2024-01-24T10:00:00Z"
  }
}
```

##### Reserve Stock
```http
POST /items/{id}/reserve
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 2,
  "orderId": "order-uuid",
  "customerId": "customer-uuid"
}

Response: 200 OK
{
  "id": "item-uuid",
  "sku": "DESK-001",
  "quantityOnHand": 10,
  "quantityReserved": 2,
  "quantityAvailable": 8,
  "reservation": {
    "id": "reservation-uuid",
    "quantity": 2,
    "orderId": "order-uuid",
    "reservedAt": "2024-01-25T10:00:00Z"
  }
}
```

##### Get Low Stock Items
```http
GET /items/low-stock
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "id": "item-uuid",
      "sku": "DESK-001",
      "name": "Executive Desk",
      "quantityOnHand": 10,
      "quantityReserved": 2,
      "quantityAvailable": 8,
      "reorderPoint": 5,
      "reorderQuantity": 20,
      "status": "low_stock",
      "preferredVendorId": "vendor-uuid"
    }
  ]
}
```

##### Get Inventory Valuation
```http
GET /valuation?date=2024-12-31
Authorization: Bearer {token}

Response: 200 OK
{
  "date": "2024-12-31",
  "totalItems": 250,
  "totalQuantity": 5420,
  "totalValue": 2710000.00,
  "byCategory": [
    {
      "category": "Furniture",
      "items": 45,
      "quantity": 320,
      "value": 240000.00
    }
  ]
}
```

---

### 7. Supply Chain Service API

**Base URL**: `http://supply-chain-service:3007/api/v1`

#### Endpoints

##### Create Shipment
```http
POST /shipments
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "order-uuid",
  "shipmentType": "outbound", // inbound, outbound
  "carrier": "FedEx",
  "trackingNumber": "1234567890",
  "origin": {
    "address": "123 Warehouse St",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601"
  },
  "destination": {
    "address": "456 Customer Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "estimatedDeliveryDate": "2024-01-30",
  "items": [
    {
      "sku": "DESK-001",
      "quantity": 2,
      "weight": 150.0
    }
  ]
}

Response: 201 Created
{
  "id": "shipment-uuid",
  "shipmentNumber": "SHIP-2024-001234",
  "orderId": "order-uuid",
  "shipmentType": "outbound",
  "carrier": "FedEx",
  "trackingNumber": "1234567890",
  "status": "pending",
  "estimatedDeliveryDate": "2024-01-30",
  "createdAt": "2024-01-25T10:00:00Z"
}
```

##### Dispatch Shipment
```http
POST /shipments/{id}/dispatch
Authorization: Bearer {token}
Content-Type: application/json

{
  "dispatchDate": "2024-01-26"
}

Response: 200 OK
{
  "id": "shipment-uuid",
  "shipmentNumber": "SHIP-2024-001234",
  "status": "in_transit",
  "dispatchedAt": "2024-01-26T08:00:00Z"
}
```

##### Update Shipment Status
```http
PUT /shipments/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_transit",
  "location": "Memphis, TN",
  "notes": "Package at sorting facility"
}

Response: 200 OK
{
  "id": "shipment-uuid",
  "status": "in_transit",
  "currentLocation": "Memphis, TN",
  "updatedAt": "2024-01-27T10:00:00Z"
}
```

##### Track Shipment
```http
GET /shipments/tracking/{trackingNumber}
Authorization: Bearer {token}

Response: 200 OK
{
  "shipmentNumber": "SHIP-2024-001234",
  "trackingNumber": "1234567890",
  "carrier": "FedEx",
  "status": "in_transit",
  "estimatedDeliveryDate": "2024-01-30",
  "trackingHistory": [
    {
      "timestamp": "2024-01-26T08:00:00Z",
      "status": "dispatched",
      "location": "Chicago, IL"
    },
    {
      "timestamp": "2024-01-27T10:00:00Z",
      "status": "in_transit",
      "location": "Memphis, TN"
    }
  ]
}
```

---

### 8. Finance Service API

**Base URL**: `http://finance-service:3008/api/v1`

#### Endpoints

##### Create Budget
```http
POST /budgets
Authorization: Bearer {token}
Content-Type: application/json

{
  "department": "Engineering",
  "fiscalYear": 2024,
  "quarter": 1,
  "category": "Salaries",
  "allocatedAmount": 500000.00,
  "startDate": "2024-01-01",
  "endDate": "2024-03-31"
}

Response: 201 Created
{
  "id": "budget-uuid",
  "department": "Engineering",
  "fiscalYear": 2024,
  "quarter": 1,
  "category": "Salaries",
  "allocatedAmount": 500000.00,
  "spentAmount": 0,
  "remainingAmount": 500000.00,
  "utilizationPercentage": 0,
  "status": "active",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

##### Get Budget Utilization
```http
GET /budgets/{id}/utilization
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "budget-uuid",
  "department": "Engineering",
  "fiscalYear": 2024,
  "quarter": 1,
  "category": "Salaries",
  "allocatedAmount": 500000.00,
  "spentAmount": 375000.00,
  "remainingAmount": 125000.00,
  "utilizationPercentage": 75.0,
  "status": "active",
  "onTrack": true,
  "projectedSpend": 500000.00,
  "variance": 0
}
```

##### Generate Financial Report
```http
GET /reports/financial?startDate=2024-01-01&endDate=2024-12-31&type=income_statement
Authorization: Bearer {token}

Response: 200 OK
{
  "reportType": "income_statement",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "revenue": {
    "total": 5000000.00,
    "breakdown": [
      {
        "category": "Product Sales",
        "amount": 3500000.00
      },
      {
        "category": "Services",
        "amount": 1500000.00
      }
    ]
  },
  "expenses": {
    "total": 3500000.00,
    "breakdown": [
      {
        "category": "Salaries",
        "amount": 2000000.00
      },
      {
        "category": "Operating Expenses",
        "amount": 1500000.00
      }
    ]
  },
  "netIncome": 1500000.00,
  "profitMargin": 30.0
}
```

---

## Common API Patterns

### Pagination
All list endpoints support pagination:
```http
GET /resource?page=1&limit=20&sort=createdAt&order=desc
```

### Filtering
```http
GET /resource?status=active&startDate=2024-01-01&endDate=2024-12-31
```

### Error Responses
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Employee with ID emp-123 not found",
    "statusCode": 404,
    "timestamp": "2024-01-15T10:00:00Z",
    "path": "/api/v1/employees/emp-123"
  }
}
```

### Standard HTTP Status Codes
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

---

*Continue to [Event Schemas](./EVENT_SCHEMAS.md)*
