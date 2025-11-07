# Event Schemas for Microservices Communication

## Overview

This document defines all event schemas used for asynchronous communication between microservices. Events are published to a message broker (RabbitMQ/Kafka) and consumed by interested services.

## Event Design Principles

1. **Event Naming**: Use past tense (e.g., `EmployeeCreated`, not `CreateEmployee`)
2. **Immutability**: Events are immutable once published
3. **Self-Contained**: Events should contain all necessary data
4. **Versioning**: Include version in event schema for backward compatibility
5. **Idempotency**: Consumers should handle duplicate events gracefully

---

## Event Categories

### 1. Employee Events
### 2. Payroll Events
### 3. Accounting Events
### 4. Billing Events
### 5. Procurement Events
### 6. Inventory Events
### 7. Supply Chain Events
### 8. Finance Events

---

## 1. Employee Events

### EmployeeCreated

**Publisher**: Employee Service  
**Consumers**: Payroll Service, Finance Service  
**Exchange**: `employee.events`  
**Routing Key**: `employee.created`

```json
{
  "eventId": "evt-uuid-12345",
  "eventType": "EmployeeCreated",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "source": "employee-service",
  "data": {
    "employeeId": "emp-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phoneNumber": "+1-555-0123",
    "jobTitle": "Software Engineer",
    "salary": 95000.00,
    "hireDate": "2024-01-15",
    "status": "active",
    "department": {
      "id": "dept-uuid",
      "name": "Engineering",
      "code": "ENG"
    },
    "bankAccountNumber": "****7890",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "admin@company.com"
  }
}
```

### EmployeeUpdated

**Publisher**: Employee Service  
**Consumers**: Payroll Service, Finance Service  
**Exchange**: `employee.events`  
**Routing Key**: `employee.updated`

```json
{
  "eventId": "evt-uuid-12346",
  "eventType": "EmployeeUpdated",
  "eventVersion": "1.0",
  "timestamp": "2024-06-15T10:00:00Z",
  "source": "employee-service",
  "data": {
    "employeeId": "emp-uuid",
    "changes": {
      "jobTitle": {
        "oldValue": "Software Engineer",
        "newValue": "Senior Software Engineer"
      },
      "salary": {
        "oldValue": 95000.00,
        "newValue": 110000.00
      }
    },
    "updatedAt": "2024-06-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "hr@company.com"
  }
}
```

### EmployeeTerminated

**Publisher**: Employee Service  
**Consumers**: Payroll Service, Finance Service, Billing Service  
**Exchange**: `employee.events`  
**Routing Key**: `employee.terminated`

```json
{
  "eventId": "evt-uuid-12347",
  "eventType": "EmployeeTerminated",
  "eventVersion": "1.0",
  "timestamp": "2024-12-31T10:00:00Z",
  "source": "employee-service",
  "data": {
    "employeeId": "emp-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "terminationDate": "2024-12-31",
    "reason": "Resignation",
    "finalSalary": 110000.00,
    "department": {
      "id": "dept-uuid",
      "name": "Engineering"
    },
    "terminatedAt": "2024-12-31T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "hr@company.com"
  }
}
```

---

## 2. Payroll Events

### PayrollProcessed

**Publisher**: Payroll Service  
**Consumers**: Accounting Service, Finance Service  
**Exchange**: `payroll.events`  
**Routing Key**: `payroll.processed`

```json
{
  "eventId": "evt-uuid-22345",
  "eventType": "PayrollProcessed",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "source": "payroll-service",
  "data": {
    "payrollId": "payroll-uuid",
    "employeeId": "emp-uuid",
    "employeeName": "John Doe",
    "department": "Engineering",
    "payPeriod": {
      "start": "2024-01-01",
      "end": "2024-01-15"
    },
    "amounts": {
      "grossPay": 3653.85,
      "federalTax": 548.08,
      "stateTax": 182.69,
      "socialSecurityTax": 226.54,
      "medicareTax": 52.98,
      "deductions": 150.00,
      "netPay": 2493.56
    },
    "status": "pending",
    "processedAt": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "payroll@company.com"
  }
}
```

### PayrollApproved

**Publisher**: Payroll Service  
**Consumers**: Accounting Service  
**Exchange**: `payroll.events`  
**Routing Key**: `payroll.approved`

```json
{
  "eventId": "evt-uuid-22346",
  "eventType": "PayrollApproved",
  "eventVersion": "1.0",
  "timestamp": "2024-01-16T10:00:00Z",
  "source": "payroll-service",
  "data": {
    "payrollId": "payroll-uuid",
    "employeeId": "emp-uuid",
    "employeeName": "John Doe",
    "department": "Engineering",
    "payPeriod": {
      "start": "2024-01-01",
      "end": "2024-01-15"
    },
    "amounts": {
      "grossPay": 3653.85,
      "taxes": 1010.29,
      "netPay": 2493.56
    },
    "approvedBy": "manager-uuid",
    "approvedAt": "2024-01-16T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "payroll-uuid",
    "userId": "manager-uuid",
    "userEmail": "manager@company.com"
  }
}
```

### BatchPayrollCompleted

**Publisher**: Payroll Service  
**Consumers**: Accounting Service, Finance Service  
**Exchange**: `payroll.events`  
**Routing Key**: `payroll.batch.completed`

```json
{
  "eventId": "evt-uuid-22347",
  "eventType": "BatchPayrollCompleted",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "source": "payroll-service",
  "data": {
    "batchId": "batch-uuid",
    "payPeriod": {
      "start": "2024-01-01",
      "end": "2024-01-15"
    },
    "summary": {
      "totalEmployees": 150,
      "totalGrossPay": 548077.50,
      "totalTaxes": 151462.38,
      "totalNetPay": 396615.12
    },
    "departments": [
      {
        "name": "Engineering",
        "employeeCount": 50,
        "totalGrossPay": 250000.00
      },
      {
        "name": "Sales",
        "employeeCount": 40,
        "totalGrossPay": 180000.00
      }
    ],
    "completedAt": "2024-01-15T12:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "payroll@company.com"
  }
}
```

---

## 3. Accounting Events

### JournalEntryCreated

**Publisher**: Accounting Service  
**Consumers**: Finance Service  
**Exchange**: `accounting.events`  
**Routing Key**: `accounting.journal.created`

```json
{
  "eventId": "evt-uuid-32345",
  "eventType": "JournalEntryCreated",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "source": "accounting-service",
  "data": {
    "journalEntryId": "journal-uuid",
    "journalNumber": "JE-2024-001234",
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
    ],
    "totalDebit": 3653.85,
    "totalCredit": 3653.85,
    "status": "posted",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "payroll-uuid",
    "userId": "system",
    "userEmail": "system@company.com"
  }
}
```

### TransactionRecorded

**Publisher**: Accounting Service  
**Consumers**: Finance Service  
**Exchange**: `accounting.events`  
**Routing Key**: `accounting.transaction.recorded`

```json
{
  "eventId": "evt-uuid-32346",
  "eventType": "TransactionRecorded",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "source": "accounting-service",
  "data": {
    "transactionId": "txn-uuid",
    "date": "2024-01-15",
    "accountCode": "5100",
    "accountName": "Salary Expense",
    "description": "Payroll expense",
    "debitAmount": 3653.85,
    "creditAmount": 0,
    "balance": 3653.85,
    "reference": "PAYROLL-2024-001",
    "recordedAt": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "journal-uuid",
    "userId": "system",
    "userEmail": "system@company.com"
  }
}
```

---

## 4. Billing Events

### InvoiceCreated

**Publisher**: Billing Service  
**Consumers**: Accounting Service, Finance Service  
**Exchange**: `billing.events`  
**Routing Key**: `billing.invoice.created`

```json
{
  "eventId": "evt-uuid-42345",
  "eventType": "InvoiceCreated",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "source": "billing-service",
  "data": {
    "invoiceId": "invoice-uuid",
    "invoiceNumber": "INV-2024-001234",
    "customerId": "customer-uuid",
    "customerName": "Acme Corporation",
    "invoiceDate": "2024-01-15",
    "dueDate": "2024-02-15",
    "amounts": {
      "subtotal": 6000.00,
      "taxAmount": 480.00,
      "totalAmount": 6480.00
    },
    "lineItems": [
      {
        "description": "Professional Services - January 2024",
        "quantity": 40,
        "unitPrice": 150.00,
        "amount": 6000.00
      }
    ],
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "billing@company.com"
  }
}
```

### InvoiceSent

**Publisher**: Billing Service  
**Consumers**: Finance Service  
**Exchange**: `billing.events`  
**Routing Key**: `billing.invoice.sent`

```json
{
  "eventId": "evt-uuid-42346",
  "eventType": "InvoiceSent",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T14:00:00Z",
  "source": "billing-service",
  "data": {
    "invoiceId": "invoice-uuid",
    "invoiceNumber": "INV-2024-001234",
    "customerId": "customer-uuid",
    "customerName": "Acme Corporation",
    "customerEmail": "billing@acme.com",
    "totalAmount": 6480.00,
    "dueDate": "2024-02-15",
    "sentAt": "2024-01-15T14:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "invoice-uuid",
    "userId": "user-uuid",
    "userEmail": "billing@company.com"
  }
}
```

### PaymentReceived

**Publisher**: Billing Service  
**Consumers**: Accounting Service, Finance Service  
**Exchange**: `billing.events`  
**Routing Key**: `billing.payment.received`

```json
{
  "eventId": "evt-uuid-42347",
  "eventType": "PaymentReceived",
  "eventVersion": "1.0",
  "timestamp": "2024-02-10T10:00:00Z",
  "source": "billing-service",
  "data": {
    "paymentId": "payment-uuid",
    "invoiceId": "invoice-uuid",
    "invoiceNumber": "INV-2024-001234",
    "customerId": "customer-uuid",
    "customerName": "Acme Corporation",
    "paymentAmount": 6480.00,
    "paymentDate": "2024-02-10",
    "paymentMethod": "bank_transfer",
    "reference": "TXN-987654",
    "invoiceStatus": "paid",
    "receivedAt": "2024-02-10T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "invoice-uuid",
    "userId": "user-uuid",
    "userEmail": "billing@company.com"
  }
}
```

### InvoiceOverdue

**Publisher**: Billing Service  
**Consumers**: Finance Service, Notification Service  
**Exchange**: `billing.events`  
**Routing Key**: `billing.invoice.overdue`

```json
{
  "eventId": "evt-uuid-42348",
  "eventType": "InvoiceOverdue",
  "eventVersion": "1.0",
  "timestamp": "2024-02-16T00:00:00Z",
  "source": "billing-service",
  "data": {
    "invoiceId": "invoice-uuid",
    "invoiceNumber": "INV-2024-001234",
    "customerId": "customer-uuid",
    "customerName": "Acme Corporation",
    "customerEmail": "billing@acme.com",
    "totalAmount": 6480.00,
    "paidAmount": 0,
    "outstandingAmount": 6480.00,
    "dueDate": "2024-02-15",
    "daysOverdue": 1,
    "overdueAt": "2024-02-16T00:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "invoice-uuid",
    "userId": "system",
    "userEmail": "system@company.com"
  }
}
```

---

## 5. Procurement Events

### PurchaseOrderCreated

**Publisher**: Procurement Service  
**Consumers**: Finance Service, Inventory Service  
**Exchange**: `procurement.events`  
**Routing Key**: `procurement.po.created`

```json
{
  "eventId": "evt-uuid-52345",
  "eventType": "PurchaseOrderCreated",
  "eventVersion": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "source": "procurement-service",
  "data": {
    "purchaseOrderId": "po-uuid",
    "poNumber": "PO-2024-001234",
    "vendorId": "vendor-uuid",
    "vendorName": "Office Supplies Inc",
    "orderDate": "2024-01-15",
    "expectedDeliveryDate": "2024-01-25",
    "totalAmount": 5525.50,
    "items": [
      {
        "sku": "DESK-001",
        "description": "Executive Desk",
        "quantity": 10,
        "unitPrice": 500.00,
        "amount": 5000.00
      }
    ],
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "procurement@company.com"
  }
}
```

### PurchaseOrderApproved

**Publisher**: Procurement Service  
**Consumers**: Finance Service  
**Exchange**: `procurement.events`  
**Routing Key**: `procurement.po.approved`

```json
{
  "eventId": "evt-uuid-52346",
  "eventType": "PurchaseOrderApproved",
  "eventVersion": "1.0",
  "timestamp": "2024-01-16T10:00:00Z",
  "source": "procurement-service",
  "data": {
    "purchaseOrderId": "po-uuid",
    "poNumber": "PO-2024-001234",
    "vendorId": "vendor-uuid",
    "vendorName": "Office Supplies Inc",
    "totalAmount": 5525.50,
    "approvedBy": "manager-uuid",
    "approvedByName": "Jane Manager",
    "approvedAt": "2024-01-16T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "po-uuid",
    "userId": "manager-uuid",
    "userEmail": "manager@company.com"
  }
}
```

### PurchaseOrderReceived

**Publisher**: Procurement Service  
**Consumers**: Accounting Service, Inventory Service, Finance Service  
**Exchange**: `procurement.events`  
**Routing Key**: `procurement.po.received`

```json
{
  "eventId": "evt-uuid-52347",
  "eventType": "PurchaseOrderReceived",
  "eventVersion": "1.0",
  "timestamp": "2024-01-24T10:00:00Z",
  "source": "procurement-service",
  "data": {
    "purchaseOrderId": "po-uuid",
    "poNumber": "PO-2024-001234",
    "vendorId": "vendor-uuid",
    "vendorName": "Office Supplies Inc",
    "orderDate": "2024-01-15",
    "expectedDeliveryDate": "2024-01-25",
    "actualDeliveryDate": "2024-01-24",
    "totalAmount": 5525.50,
    "receivedItems": [
      {
        "sku": "DESK-001",
        "description": "Executive Desk",
        "quantityOrdered": 10,
        "quantityReceived": 10,
        "unitPrice": 500.00,
        "amount": 5000.00,
        "condition": "good"
      }
    ],
    "receivedBy": "warehouse-user-uuid",
    "receivedAt": "2024-01-24T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "po-uuid",
    "userId": "warehouse-user-uuid",
    "userEmail": "warehouse@company.com"
  }
}
```

---

## 6. Inventory Events

### StockLevelLow

**Publisher**: Inventory Service  
**Consumers**: Procurement Service, Notification Service  
**Exchange**: `inventory.events`  
**Routing Key**: `inventory.stock.low`

```json
{
  "eventId": "evt-uuid-62345",
  "eventType": "StockLevelLow",
  "eventVersion": "1.0",
  "timestamp": "2024-01-20T10:00:00Z",
  "source": "inventory-service",
  "data": {
    "itemId": "item-uuid",
    "sku": "DESK-001",
    "name": "Executive Desk",
    "category": "Furniture",
    "quantityOnHand": 4,
    "quantityReserved": 2,
    "quantityAvailable": 2,
    "reorderPoint": 5,
    "reorderQuantity": 20,
    "preferredVendorId": "vendor-uuid",
    "preferredVendorName": "Office Supplies Inc",
    "unitCost": 500.00,
    "estimatedReorderCost": 10000.00,
    "detectedAt": "2024-01-20T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "system",
    "userEmail": "system@company.com"
  }
}
```

### StockAdjusted

**Publisher**: Inventory Service  
**Consumers**: Finance Service, Accounting Service  
**Exchange**: `inventory.events`  
**Routing Key**: `inventory.stock.adjusted`

```json
{
  "eventId": "evt-uuid-62346",
  "eventType": "StockAdjusted",
  "eventVersion": "1.0",
  "timestamp": "2024-01-24T10:00:00Z",
  "source": "inventory-service",
  "data": {
    "adjustmentId": "adjustment-uuid",
    "itemId": "item-uuid",
    "sku": "DESK-001",
    "name": "Executive Desk",
    "adjustmentType": "receipt",
    "quantity": 10,
    "previousQuantity": 4,
    "newQuantity": 14,
    "unitCost": 500.00,
    "totalValue": 5000.00,
    "reason": "Purchase order PO-2024-001234 received",
    "reference": "PO-2024-001234",
    "adjustedBy": "warehouse-user-uuid",
    "adjustedAt": "2024-01-24T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "po-uuid",
    "userId": "warehouse-user-uuid",
    "userEmail": "warehouse@company.com"
  }
}
```

### StockReserved

**Publisher**: Inventory Service  
**Consumers**: Supply Chain Service  
**Exchange**: `inventory.events`  
**Routing Key**: `inventory.stock.reserved`

```json
{
  "eventId": "evt-uuid-62347",
  "eventType": "StockReserved",
  "eventVersion": "1.0",
  "timestamp": "2024-01-25T10:00:00Z",
  "source": "inventory-service",
  "data": {
    "reservationId": "reservation-uuid",
    "itemId": "item-uuid",
    "sku": "DESK-001",
    "name": "Executive Desk",
    "quantity": 2,
    "orderId": "order-uuid",
    "customerId": "customer-uuid",
    "customerName": "Acme Corporation",
    "reservedAt": "2024-01-25T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "order-uuid",
    "userId": "user-uuid",
    "userEmail": "sales@company.com"
  }
}
```

---

## 7. Supply Chain Events

### ShipmentCreated

**Publisher**: Supply Chain Service  
**Consumers**: Inventory Service, Notification Service  
**Exchange**: `supply-chain.events`  
**Routing Key**: `supply-chain.shipment.created`

```json
{
  "eventId": "evt-uuid-72345",
  "eventType": "ShipmentCreated",
  "eventVersion": "1.0",
  "timestamp": "2024-01-25T10:00:00Z",
  "source": "supply-chain-service",
  "data": {
    "shipmentId": "shipment-uuid",
    "shipmentNumber": "SHIP-2024-001234",
    "orderId": "order-uuid",
    "shipmentType": "outbound",
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
    ],
    "status": "pending",
    "createdAt": "2024-01-25T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "order-uuid",
    "userId": "user-uuid",
    "userEmail": "warehouse@company.com"
  }
}
```

### ShipmentDispatched

**Publisher**: Supply Chain Service  
**Consumers**: Inventory Service, Notification Service  
**Exchange**: `supply-chain.events`  
**Routing Key**: `supply-chain.shipment.dispatched`

```json
{
  "eventId": "evt-uuid-72346",
  "eventType": "ShipmentDispatched",
  "eventVersion": "1.0",
  "timestamp": "2024-01-26T08:00:00Z",
  "source": "supply-chain-service",
  "data": {
    "shipmentId": "shipment-uuid",
    "shipmentNumber": "SHIP-2024-001234",
    "orderId": "order-uuid",
    "carrier": "FedEx",
    "trackingNumber": "1234567890",
    "estimatedDeliveryDate": "2024-01-30",
    "items": [
      {
        "sku": "DESK-001",
        "quantity": 2
      }
    ],
    "dispatchedAt": "2024-01-26T08:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "shipment-uuid",
    "userId": "warehouse-user-uuid",
    "userEmail": "warehouse@company.com"
  }
}
```

### ShipmentDelivered

**Publisher**: Supply Chain Service  
**Consumers**: Billing Service, Inventory Service, Notification Service  
**Exchange**: `supply-chain.events`  
**Routing Key**: `supply-chain.shipment.delivered`

```json
{
  "eventId": "evt-uuid-72347",
  "eventType": "ShipmentDelivered",
  "eventVersion": "1.0",
  "timestamp": "2024-01-29T14:00:00Z",
  "source": "supply-chain-service",
  "data": {
    "shipmentId": "shipment-uuid",
    "shipmentNumber": "SHIP-2024-001234",
    "orderId": "order-uuid",
    "carrier": "FedEx",
    "trackingNumber": "1234567890",
    "estimatedDeliveryDate": "2024-01-30",
    "actualDeliveryDate": "2024-01-29",
    "items": [
      {
        "sku": "DESK-001",
        "quantity": 2
      }
    ],
    "deliveredTo": "John Smith",
    "deliveredAt": "2024-01-29T14:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "shipment-uuid",
    "userId": "system",
    "userEmail": "system@company.com"
  }
}
```

---

## 8. Finance Events

### BudgetCreated

**Publisher**: Finance Service  
**Consumers**: Notification Service  
**Exchange**: `finance.events`  
**Routing Key**: `finance.budget.created`

```json
{
  "eventId": "evt-uuid-82345",
  "eventType": "BudgetCreated",
  "eventVersion": "1.0",
  "timestamp": "2024-01-01T10:00:00Z",
  "source": "finance-service",
  "data": {
    "budgetId": "budget-uuid",
    "department": "Engineering",
    "fiscalYear": 2024,
    "quarter": 1,
    "category": "Salaries",
    "allocatedAmount": 500000.00,
    "startDate": "2024-01-01",
    "endDate": "2024-03-31",
    "status": "active",
    "createdAt": "2024-01-01T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "cause-uuid",
    "userId": "user-uuid",
    "userEmail": "finance@company.com"
  }
}
```

### BudgetThresholdExceeded

**Publisher**: Finance Service  
**Consumers**: Notification Service  
**Exchange**: `finance.events`  
**Routing Key**: `finance.budget.threshold.exceeded`

```json
{
  "eventId": "evt-uuid-82346",
  "eventType": "BudgetThresholdExceeded",
  "eventVersion": "1.0",
  "timestamp": "2024-02-15T10:00:00Z",
  "source": "finance-service",
  "data": {
    "budgetId": "budget-uuid",
    "department": "Engineering",
    "fiscalYear": 2024,
    "quarter": 1,
    "category": "Salaries",
    "allocatedAmount": 500000.00,
    "spentAmount": 425000.00,
    "remainingAmount": 75000.00,
    "utilizationPercentage": 85.0,
    "threshold": 80.0,
    "thresholdExceededAt": "2024-02-15T10:00:00Z"
  },
  "metadata": {
    "correlationId": "corr-uuid",
    "causationId": "budget-uuid",
    "userId": "system",
    "userEmail": "system@company.com"
  }
}
```

---

## Event Infrastructure

### Message Broker Configuration

#### RabbitMQ Exchanges

```yaml
exchanges:
  - name: employee.events
    type: topic
    durable: true
    
  - name: payroll.events
    type: topic
    durable: true
    
  - name: accounting.events
    type: topic
    durable: true
    
  - name: billing.events
    type: topic
    durable: true
    
  - name: procurement.events
    type: topic
    durable: true
    
  - name: inventory.events
    type: topic
    durable: true
    
  - name: supply-chain.events
    type: topic
    durable: true
    
  - name: finance.events
    type: topic
    durable: true
```

#### Queue Bindings Example

```yaml
# Accounting Service Queues
queues:
  - name: accounting.payroll.queue
    exchange: payroll.events
    routing_keys:
      - payroll.processed
      - payroll.approved
    durable: true
    
  - name: accounting.billing.queue
    exchange: billing.events
    routing_keys:
      - billing.invoice.created
      - billing.payment.received
    durable: true
    
  - name: accounting.procurement.queue
    exchange: procurement.events
    routing_keys:
      - procurement.po.received
    durable: true
```

### Event Publishing Pattern (TypeScript)

```typescript
// event-publisher.ts
import amqp from 'amqplib';

export class EventPublisher {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  async publish(exchange: string, routingKey: string, event: any) {
    const eventWithMetadata = {
      ...event,
      eventId: generateUUID(),
      timestamp: new Date().toISOString(),
      source: process.env.SERVICE_NAME,
    };

    await this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(eventWithMetadata)),
      {
        persistent: true,
        contentType: 'application/json',
      }
    );

    console.log(`Event published: ${event.eventType}`);
  }
}
```

### Event Consumer Pattern (TypeScript)

```typescript
// event-consumer.ts
import amqp from 'amqplib';

export class EventConsumer {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  async subscribe(
    queue: string,
    handler: (event: any) => Promise<void>
  ) {
    await this.channel.assertQueue(queue, { durable: true });
    
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          
          // Idempotency check
          if (await this.isEventProcessed(event.eventId)) {
            console.log(`Event already processed: ${event.eventId}`);
            this.channel.ack(msg);
            return;
          }

          // Process event
          await handler(event);
          
          // Mark as processed
          await this.markEventProcessed(event.eventId);
          
          // Acknowledge message
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing event:', error);
          // Reject and requeue
          this.channel.nack(msg, false, true);
        }
      }
    });
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    // Check in database or cache
    return false;
  }

  private async markEventProcessed(eventId: string): Promise<void> {
    // Store in database or cache
  }
}
```

---

## Event Versioning Strategy

### Version 1.0 → 2.0 Migration Example

**Old Event (v1.0)**:
```json
{
  "eventType": "EmployeeCreated",
  "eventVersion": "1.0",
  "data": {
    "employeeId": "emp-uuid",
    "name": "John Doe",
    "salary": 95000.00
  }
}
```

**New Event (v2.0)**:
```json
{
  "eventType": "EmployeeCreated",
  "eventVersion": "2.0",
  "data": {
    "employeeId": "emp-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "salary": {
      "amount": 95000.00,
      "currency": "USD"
    }
  }
}
```

**Consumer Handling**:
```typescript
async handleEmployeeCreated(event: any) {
  if (event.eventVersion === '1.0') {
    // Transform v1 to v2 format
    const [firstName, lastName] = event.data.name.split(' ');
    event.data = {
      ...event.data,
      firstName,
      lastName,
      salary: {
        amount: event.data.salary,
        currency: 'USD'
      }
    };
  }
  
  // Process v2 format
  await this.processEmployeeCreated(event.data);
}
```

---

*Continue to [Database Strategy](./DATABASE_STRATEGY.md)*
