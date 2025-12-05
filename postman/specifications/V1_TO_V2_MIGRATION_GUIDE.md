# Enterprise Resource Planning API - v1 to v2 Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Breaking Changes Summary](#breaking-changes-summary)
3. [URL Path Changes](#url-path-changes)
4. [Property Naming Changes](#property-naming-changes)
5. [Response Structure Changes](#response-structure-changes)
6. [Pagination Changes](#pagination-changes)
7. [Authentication Changes](#authentication-changes)
8. [Status Code Changes](#status-code-changes)
9. [Error Response Changes](#error-response-changes)
10. [Module-Specific Changes](#module-specific-changes)
11. [Migration Timeline](#migration-timeline)
12. [Testing Checklist](#testing-checklist)

---

## Overview

Version 2.0.0 of the Enterprise Resource Planning API introduces significant improvements to consistency, usability, and developer experience. This is a **major version** with **breaking changes** that require code updates in your applications.

### Key Improvements in v2.0.0
- ✅ Consistent camelCase naming across all properties
- ✅ Standardized response envelopes for all endpoints
- ✅ Universal pagination on all list endpoints
- ✅ Versioned URL paths (`/api/v2/`)
- ✅ Enhanced error responses with error codes
- ✅ Consistent authentication requirements
- ✅ Additional HTTP status codes (429, 500)
- ✅ Improved schema consistency

### Migration Effort Estimate
- **Small applications** (1-10 endpoints): 2-4 hours
- **Medium applications** (11-50 endpoints): 1-2 days
- **Large applications** (50+ endpoints): 3-5 days

---

## Breaking Changes Summary

### Critical Changes (Immediate Action Required)

| Change Type | Impact | Affected Endpoints |
|------------|--------|-------------------|
| URL path versioning | HIGH | All endpoints |
| Property naming (snake_case → camelCase) | HIGH | All endpoints |
| Response envelope structure | HIGH | All endpoints |
| Pagination added | MEDIUM | All list endpoints |
| Demo endpoints removed | MEDIUM | `/api/demo/*` |
| Error response structure | MEDIUM | All endpoints |
| Authentication consistency | LOW | Previously unauthenticated endpoints |

---

## URL Path Changes

### Base URL Update

**v1:**
```
http://localhost:3001/api/hr/employees
```

**v2:**
```
http://localhost:3001/api/v2/hr/employees
```

### Action Required
Update all API calls to include `/v2/` in the path:

```javascript
// Before (v1)
const response = await fetch('http://localhost:3001/api/hr/employees');

// After (v2)
const response = await fetch('http://localhost:3001/api/v2/hr/employees');
```

### Endpoint Path Changes

| v1 Path | v2 Path | Notes |
|---------|---------|-------|
| `/api` | `/api/v2/` | API info endpoint |
| `/api/hr/employees` | `/api/v2/hr/employees` | Added version |
| `/api/payroll/process` | `/api/v2/payroll/process` | Added version |
| `/api/demo/*` | **REMOVED** | Demo endpoints removed |
| `/api/mock-stats` | **REMOVED** | Mock endpoint removed |

---

## Property Naming Changes

All property names have been standardized to **camelCase** in v2.

### Employee Schema Changes

**v1 Response:**
```json
{
  "id": 1,
  "employee_id": "EMP-2024-001",
  "first_name": "John",
  "last_name": "Doe",
  "hire_date": "2024-01-15",
  "status": "active"
}
```

**v2 Response:**
```json
{
  "success": true,
  "data": {
    "id": "emp_1234567890",
    "employeeId": "EMP-2024-001",
    "firstName": "John",
    "lastName": "Doe",
    "hireDate": "2024-01-15",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Complete Property Mapping

| v1 Property | v2 Property | Schema |
|------------|-------------|--------|
| `employee_id` | `employeeId` | Employee |
| `first_name` | `firstName` | Employee |
| `last_name` | `lastName` | Employee |
| `hire_date` | `hireDate` | Employee |
| `pay_period_start` | `payPeriodStart` | Payroll |
| `pay_period_end` | `payPeriodEnd` | Payroll |
| `gross_pay` | `grossPay` | Payroll |
| `net_pay` | `netPay` | Payroll |
| `tax_withheld` | `taxWithheld` | Payroll |
| `employee_count` | `employeeCount` | Department |
| `manager_id` | `managerId` | Department |
| `credit_limit` | `creditLimit` | Customer |
| `current_balance` | `currentBalance` | Customer |
| `payment_terms` | `paymentTerms` | Customer/Vendor |
| `invoice_number` | `invoiceNumber` | Invoice |
| `issue_date` | `issueDate` | Invoice |
| `due_date` | `dueDate` | Invoice |
| `subtotal` | `subtotal` | Invoice (no change) |
| `tax_amount` | `taxAmount` | Invoice |
| `total_amount` | `totalAmount` | Invoice |
| `paid_amount` | `paidAmount` | Invoice |
| `balance_due` | `balanceDue` | Invoice |
| `unit_price` | `unitPrice` | Invoice/PO Items |
| `po_number` | `poNumber` | Purchase Order |
| `order_date` | `orderDate` | Purchase Order |
| `expected_delivery_date` | `expectedDeliveryDate` | Purchase Order |
| `vendor_id` | `vendorId` | Purchase Order |
| `vendor_name` | `vendorName` | Purchase Order |
| `shipment_id` | `shipmentId` | Shipment |
| `order_id` | `orderId` | Shipment |
| `tracking_number` | `trackingNumber` | Shipment |
| `estimated_delivery_date` | `estimatedDeliveryDate` | Shipment |
| `actual_delivery_date` | `actualDeliveryDate` | Shipment |
| `total_weight` | `totalWeight` | Shipment |
| `shipping_cost` | `shippingCost` | Shipment |
| `reserved_quantity` | `reservedQuantity` | Inventory |
| `available_quantity` | `availableQuantity` | Inventory |
| `reorder_point` | `reorderPoint` | Inventory |
| `reorder_quantity` | `reorderQuantity` | Inventory |

### Status Enum Changes

**v1:**
```
active, inactive, on_leave, terminated
pending_approval, in_transit, out_of_stock
```

**v2:**
```
active, inactive, onLeave, terminated
pendingApproval, inTransit, outOfStock
```

### Migration Code Example

```javascript
// Helper function to convert v1 employee to v2 format
function migrateEmployeeData(v1Employee) {
  return {
    id: v1Employee.id,
    employeeId: v1Employee.employee_id,
    firstName: v1Employee.first_name,
    lastName: v1Employee.last_name,
    email: v1Employee.email,
    department: v1Employee.department,
    position: v1Employee.position,
    salary: v1Employee.salary,
    hireDate: v1Employee.hire_date,
    status: v1Employee.status === 'on_leave' ? 'onLeave' : v1Employee.status
  };
}
```

---

## Response Structure Changes

### Standardized Response Envelope

All v2 endpoints now return a consistent response structure.

### Success Response Structure

**v1 (Inconsistent):**
```json
// Some endpoints returned this:
{
  "success": true,
  "data": [...],
  "total": 50,
  "timestamp": "2024-01-15T10:30:00Z"
}

// Others returned arrays directly:
[
  { "id": "1", "name": "Engineering" },
  { "id": "2", "name": "Sales" }
]

// Others returned objects with custom keys:
{
  "customers": [...],
  "pagination": {...}
}
```

**v2 (Consistent):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 95,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Single Resource Response

**v1:**
```json
{
  "id": "1",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**v2:**
```json
{
  "success": true,
  "data": {
    "id": "emp_1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Migration Code Example

```javascript
// v1 response handler
async function fetchEmployeesV1() {
  const response = await fetch('/api/hr/employees');
  const json = await response.json();
  
  // v1: data might be in different places
  const employees = json.data || json;
  return employees;
}

// v2 response handler
async function fetchEmployeesV2() {
  const response = await fetch('/api/v2/hr/employees');
  const json = await response.json();
  
  // v2: always in data property
  if (json.success) {
    return {
      employees: json.data,
      pagination: json.pagination
    };
  } else {
    throw new Error(json.error.message);
  }
}
```

---

## Pagination Changes

### Overview
All list endpoints in v2 now support pagination. This is a **breaking change** for endpoints that previously returned all results.

### Affected Endpoints

| Endpoint | v1 Pagination | v2 Pagination |
|----------|---------------|---------------|
| `GET /hr/employees` | ❌ No | ✅ Yes |
| `GET /hr/departments` | ❌ No | ✅ Yes |
| `GET /payroll/records` | ❌ No (new endpoint) | ✅ Yes |
| `GET /billing/customers` | ⚠️ Custom | ✅ Standardized |
| `GET /billing/invoices` | ❌ No | ✅ Yes |
| `GET /procurement/vendors` | ❌ No | ✅ Yes |
| `GET /procurement/purchase-orders` | ⚠️ Custom | ✅ Standardized |
| `GET /supply-chain/shipments` | ⚠️ Custom | ✅ Standardized |
| `GET /inventory/items` | ❌ No | ✅ Yes |

### Pagination Parameters

**v2 Query Parameters:**
- `page` - Page number (1-indexed, default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Example Request:**
```
GET /api/v2/hr/employees?page=2&limit=50
```

### Pagination Response

**v2 Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "totalPages": 5,
    "totalItems": 237,
    "hasNextPage": true,
    "hasPreviousPage": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Migration Strategy

#### Option 1: Fetch All Pages (Small Datasets)

```javascript
async function fetchAllEmployees() {
  let allEmployees = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `/api/v2/hr/employees?page=${page}&limit=100`
    );
    const json = await response.json();
    
    allEmployees = allEmployees.concat(json.data);
    hasMore = json.pagination.hasNextPage;
    page++;
  }
  
  return allEmployees;
}
```

#### Option 2: Implement Pagination UI (Recommended)

```javascript
async function fetchEmployeesPage(page = 1, limit = 20) {
  const response = await fetch(
    `/api/v2/hr/employees?page=${page}&limit=${limit}`
  );
  const json = await response.json();
  
  return {
    employees: json.data,
    currentPage: json.pagination.page,
    totalPages: json.pagination.totalPages,
    totalItems: json.pagination.totalItems,
    hasNextPage: json.pagination.hasNextPage,
    hasPreviousPage: json.pagination.hasPreviousPage
  };
}
```

#### Option 3: Use Cursor-Based Pagination (Future)

For very large datasets, consider implementing cursor-based pagination in your application logic.

---

## Authentication Changes

### Overview
v2 enforces consistent authentication across all protected endpoints.

### Removed Unauthenticated Endpoints

**v1 Endpoints Without Auth:**
- `GET /api/demo/employees` - **REMOVED**
- `GET /api/demo/departments` - **REMOVED**
- `GET /api/demo/payroll` - **REMOVED**
- `GET /api/mock-stats` - **REMOVED**

**v2 Endpoints Without Auth:**
- `GET /health` - Health check
- `GET /api/v2/` - API information

### Authentication Header

**Required for all other endpoints:**
```
Authorization: Bearer <your-jwt-token>
```

### Migration Code Example

```javascript
// v1: Some endpoints didn't require auth
async function fetchDemoEmployees() {
  const response = await fetch('/api/demo/employees');
  return response.json();
}

// v2: Use real authenticated endpoints
async function fetchEmployees(token) {
  const response = await fetch('/api/v2/hr/employees', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    throw new Error('Authentication required');
  }
  
  return response.json();
}
```

---

## Status Code Changes

### New Status Codes in v2

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| `204` | No Content | Successful DELETE operations |
| `202` | Accepted | Batch operations (async processing) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side errors |

### Status Code Mapping

| Operation | v1 | v2 | Notes |
|-----------|----|----|-------|
| Successful GET | 200 | 200 | No change |
| Successful POST | 201 | 201 | No change |
| Successful PUT | 200 | 200 | No change |
| Successful DELETE | 200 | **204** | Changed |
| Batch Processing | 201 | **202** | Changed |
| Invalid Request | 400 | 400 | No change |
| Unauthorized | 401 | 401 | No change |
| Not Found | 404 | 404 | No change |
| Conflict | 409 | 409 | No change |
| Rate Limited | N/A | **429** | New |
| Server Error | 503 | **500** | Changed |

### Migration Code Example

```javascript
// v1: DELETE returned 200 with body
async function deleteEmployeeV1(id) {
  const response = await fetch(`/api/hr/employees/${id}`, {
    method: 'DELETE'
  });
  const json = await response.json();
  return json;
}

// v2: DELETE returns 204 with no body
async function deleteEmployeeV2(id, token) {
  const response = await fetch(`/api/v2/hr/employees/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 204) {
    return { success: true };
  } else if (response.status === 404) {
    throw new Error('Employee not found');
  } else {
    const error = await response.json();
    throw new Error(error.error.message);
  }
}
```

---

## Error Response Changes

### Standardized Error Structure

**v1 (Inconsistent):**
```json
{
  "error": "Invalid input data",
  "statusCode": 400,
  "details": "Email is required"
}
```

**v2 (Consistent):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": "The 'email' field must be a valid email address"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Codes

| Error Code | HTTP Status | Description |
|-----------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters or body |
| `UNAUTHORIZED` | 401 | Authentication required or failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Migration Code Example

```javascript
// v1 error handler
function handleV1Error(response, json) {
  if (!response.ok) {
    throw new Error(json.error || 'Unknown error');
  }
}

// v2 error handler
function handleV2Error(response, json) {
  if (!json.success) {
    const error = new Error(json.error.message);
    error.code = json.error.code;
    error.details = json.error.details;
    error.status = response.status;
    throw error;
  }
}

// Usage
try {
  const response = await fetch('/api/v2/hr/employees', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(employeeData)
  });
  
  const json = await response.json();
  handleV2Error(response, json);
  
  return json.data;
} catch (error) {
  console.error(`Error ${error.code}: ${error.message}`);
  console.error(`Details: ${error.details}`);
}
```

---

## Module-Specific Changes

### Human Resources Module

#### Endpoints Changed

| v1 Endpoint | v2 Endpoint | Changes |
|------------|-------------|---------|
| `GET /api/hr/employees` | `GET /api/v2/hr/employees` | Added pagination, camelCase properties |
| `POST /api/hr/employees` | `POST /api/v2/hr/employees` | camelCase properties, wrapped response |
| `GET /api/hr/employees/{id}` | `GET /api/v2/hr/employees/{id}` | camelCase properties, wrapped response |
| `PUT /api/hr/employees/{id}` | `PUT /api/v2/hr/employees/{id}` | camelCase properties, wrapped response |
| N/A | `DELETE /api/v2/hr/employees/{id}` | New endpoint (204 response) |
| `PATCH /api/hr/employees/{id}/promote` | `POST /api/v2/hr/employees/{id}/promote` | Changed to POST, camelCase |
| `POST /api/hr/employees/{id}/terminate` | `POST /api/v2/hr/employees/{id}/terminate` | camelCase properties |
| `GET /api/hr/departments` | `GET /api/v2/hr/departments` | Added pagination, wrapped response |
| `POST /api/hr/departments` | `POST /api/v2/hr/departments` | camelCase properties, wrapped response |
| `GET /api/hr/departments/{id}` | `GET /api/v2/hr/departments/{id}` | camelCase properties, wrapped response |

#### Example Migration

**v1 Create Employee:**
```javascript
const response = await fetch('/api/hr/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    departmentId: 'dept-123',
    position: 'Engineer',
    salary: 95000,
    hireDate: '2024-01-15'
  })
});

const employee = await response.json();
console.log(employee.employee_id); // EMP-2024-001
```

**v2 Create Employee:**
```javascript
const response = await fetch('/api/v2/hr/employees', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    departmentId: 'dept-123',
    position: 'Engineer',
    salary: 95000,
    hireDate: '2024-01-15'
  })
});

const json = await response.json();
if (json.success) {
  console.log(json.data.employeeId); // EMP-2024-001
}
```

### Payroll Module

#### Endpoints Changed

| v1 Endpoint | v2 Endpoint | Changes |
|------------|-------------|---------|
| N/A | `GET /api/v2/payroll/records` | New list endpoint with pagination |
| N/A | `GET /api/v2/payroll/records/{id}` | New get endpoint |
| `POST /api/payroll/process` | `POST /api/v2/payroll/process` | camelCase properties, wrapped response |
| `POST /api/payroll/batch-process` | `POST /api/v2/payroll/batch-process` | 202 status, camelCase properties |
| `POST /api/payroll/{id}/approve` | `POST /api/v2/payroll/records/{id}/approve` | Path changed, wrapped response |

#### Example Migration

**v1 Process Payroll:**
```javascript
const response = await fetch('/api/payroll/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    employeeId: 'emp-123',
    payPeriodStart: '2024-01-01',
    payPeriodEnd: '2024-01-15',
    deductions: 500,
    bonus: 0,
    overtime: 0
  })
});

const payroll = await response.json();
console.log(payroll.gross_pay);
```

**v2 Process Payroll:**
```javascript
const response = await fetch('/api/v2/payroll/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    employeeId: 'emp-123',
    payPeriodStart: '2024-01-01',
    payPeriodEnd: '2024-01-15',
    deductions: 500,
    bonus: 0,
    overtime: 0
  })
});

const json = await response.json();
if (json.success) {
  console.log(json.data.grossPay);
}
```

### Billing Module

#### Endpoints Changed

| v1 Endpoint | v2 Endpoint | Changes |
|------------|-------------|---------|
| `GET /api/billing/customers` | `GET /api/v2/billing/customers` | Standardized pagination, wrapped response |
| `POST /api/billing/customers` | `POST /api/v2/billing/customers` | camelCase properties, wrapped response |
| `GET /api/billing/invoices` | `GET /api/v2/billing/invoices` | Added pagination, wrapped response |
| `POST /api/billing/invoices` | `POST /api/v2/billing/invoices` | camelCase properties, wrapped response |

### Procurement Module

#### Endpoints Changed

| v1 Endpoint | v2 Endpoint | Changes |
|------------|-------------|---------|
| `GET /api/procurement/vendors` | `GET /api/v2/procurement/vendors` | Added pagination, wrapped response |
| `POST /api/procurement/vendors` | `POST /api/v2/procurement/vendors` | camelCase properties, wrapped response |
| `GET /api/procurement/purchase-orders` | `GET /api/v2/procurement/purchase-orders` | Standardized pagination, camelCase enums |
| `POST /api/procurement/purchase-orders` | `POST /api/v2/procurement/purchase-orders` | camelCase properties, wrapped response |

### Supply Chain Module

#### Endpoints Changed

| v1 Endpoint | v2 Endpoint | Changes |
|------------|-------------|---------|
| `GET /api/supply-chain/shipments` | `GET /api/v2/supply-chain/shipments` | Standardized pagination, camelCase enums |
| `POST /api/supply-chain/shipments` | `POST /api/v2/supply-chain/shipments` | camelCase properties, wrapped response |

### Inventory Module

#### Endpoints Changed

| v1 Endpoint | v2 Endpoint | Changes |
|------------|-------------|---------|
| `GET /api/inventory/items` | `GET /api/v2/inventory/items` | Added pagination, camelCase enums |
| `POST /api/inventory/items` | `POST /api/v2/inventory/items` | camelCase properties, wrapped response |

---

## Migration Timeline

### Recommended Migration Phases

#### Phase 1: Preparation (Week 1)
- [ ] Review this migration guide
- [ ] Audit your codebase for v1 API usage
- [ ] Identify all endpoints currently in use
- [ ] Set up v2 API access in development environment
- [ ] Create a migration tracking spreadsheet

#### Phase 2: Development (Weeks 2-3)
- [ ] Update base URL to include `/v2/`
- [ ] Update all property names from snake_case to camelCase
- [ ] Update response handling for new envelope structure
- [ ] Implement pagination handling for list endpoints
- [ ] Update error handling for new error structure
- [ ] Add authentication headers to all requests
- [ ] Update status code handling (204, 202, 429, 500)
- [ ] Remove dependencies on demo endpoints

#### Phase 3: Testing (Week 4)
- [ ] Unit test all API integration code
- [ ] Integration test critical workflows
- [ ] Test pagination edge cases
- [ ] Test error handling scenarios
- [ ] Performance test with pagination
- [ ] Test authentication flows

#### Phase 4: Staging Deployment (Week 5)
- [ ] Deploy to staging environment
- [ ] Run full regression test suite
- [ ] Monitor for errors and edge cases
- [ ] Validate data consistency
- [ ] Performance testing under load

#### Phase 5: Production Migration (Week 6)
- [ ] Deploy to production during low-traffic period
- [ ] Monitor error rates and performance
- [ ] Have rollback plan ready
- [ ] Communicate with stakeholders
- [ ] Document any issues encountered

#### Phase 6: Cleanup (Week 7)
- [ ] Remove v1 API code
- [ ] Update documentation
- [ ] Archive v1 integration tests
- [ ] Celebrate successful migration! 🎉

### Parallel Running Strategy

For large applications, consider running v1 and v2 in parallel:

```javascript
const API_VERSION = process.env.API_VERSION || 'v1';

function getApiUrl(endpoint) {
  if (API_VERSION === 'v2') {
    return `/api/v2${endpoint}`;
  }
  return `/api${endpoint}`;
}

function transformResponse(response, version) {
  if (version === 'v2') {
    return response.data;
  }
  return response;
}
```

---

## Testing Checklist

### Pre-Migration Testing

- [ ] Document all current v1 API calls
- [ ] Create baseline performance metrics
- [ ] Document expected response formats
- [ ] Identify critical user workflows

### During Migration Testing

#### URL & Authentication
- [ ] All endpoints use `/api/v2/` path
- [ ] All protected endpoints include Bearer token
- [ ] 401 errors handled correctly
- [ ] Token refresh logic works

#### Property Naming
- [ ] All snake_case properties converted to camelCase
- [ ] Enum values updated (e.g., `on_leave` → `onLeave`)
- [ ] Date formats remain consistent
- [ ] Numeric values maintain precision

#### Response Structure
- [ ] All responses have `success` field
- [ ] All responses have `timestamp` field
- [ ] Single resources wrapped in `data` object
- [ ] List responses include `pagination` object
- [ ] Error responses have `error.code`, `error.message`, `error.details`

#### Pagination
- [ ] List endpoints accept `page` and `limit` parameters
- [ ] Pagination metadata is correct
- [ ] `hasNextPage` and `hasPreviousPage` work correctly
- [ ] Edge cases handled (page beyond total, limit > max)
- [ ] Empty result sets handled correctly

#### Status Codes
- [ ] DELETE operations return 204
- [ ] Batch operations return 202
- [ ] Rate limiting returns 429
- [ ] Server errors return 500
- [ ] All error codes handled in client

#### Error Handling
- [ ] Error responses parsed correctly
- [ ] Error codes mapped to user messages
- [ ] Network errors handled
- [ ] Timeout errors handled
- [ ] Validation errors displayed to users

### Post-Migration Testing

- [ ] All critical workflows function correctly
- [ ] Performance meets or exceeds baseline
- [ ] No data loss or corruption
- [ ] Error rates within acceptable range
- [ ] User experience is maintained or improved

---

## Common Migration Pitfalls

### 1. Forgetting to Update Property Names in Filters

**Problem:**
```javascript
// This will fail in v2
fetch('/api/v2/hr/employees?status=on_leave')
```

**Solution:**
```javascript
// Use camelCase enum values
fetch('/api/v2/hr/employees?status=onLeave')
```

### 2. Not Handling Pagination

**Problem:**
```javascript
// This only gets first page (20 items)
const response = await fetch('/api/v2/hr/employees');
const json = await response.json();
const employees = json.data; // Only 20 employees!
```

**Solution:**
```javascript
// Fetch all pages or implement pagination UI
async function fetchAllEmployees() {
  let allEmployees = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`/api/v2/hr/employees?page=${page}&limit=100`);
    const json = await response.json();
    allEmployees = allEmployees.concat(json.data);
    hasMore = json.pagination.hasNextPage;
    page++;
  }
  
  return allEmployees;
}
```

### 3. Expecting Response Body on DELETE

**Problem:**
```javascript
// This will fail - no response body on 204
const response = await fetch('/api/v2/hr/employees/123', { method: 'DELETE' });
const json = await response.json(); // Error: Unexpected end of JSON
```

**Solution:**
```javascript
const response = await fetch('/api/v2/hr/employees/123', { method: 'DELETE' });
if (response.status === 204) {
  console.log('Employee deleted successfully');
}
```

### 4. Not Wrapping Response Data

**Problem:**
```javascript
// Expecting direct array
const employees = await response.json();
employees.forEach(emp => console.log(emp.firstName));
```

**Solution:**
```javascript
// Access through data property
const json = await response.json();
json.data.forEach(emp => console.log(emp.firstName));
```

### 5. Using Demo Endpoints

**Problem:**
```javascript
// Demo endpoints removed in v2
fetch('/api/v2/demo/employees') // 404 Not Found
```

**Solution:**
```javascript
// Use real authenticated endpoints
fetch('/api/v2/hr/employees', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## Support & Resources

### Documentation
- [API v2 OpenAPI Specification](./Enterprise%20Resource%20Planning%20API%20v2.openapi.yaml)
- [API v1 OpenAPI Specification](./Enterprise%20Resource%20Planning%20API.openapi.yaml)

### Getting Help
- **Email**: api-support@yourcompany.com
- **Slack**: #erp-api-support
- **Office Hours**: Tuesdays & Thursdays, 2-4 PM EST

### Migration Support
We're here to help! If you encounter issues during migration:
1. Check this guide first
2. Search existing support tickets
3. Contact the API team via Slack or email
4. Schedule a migration consultation call

---

## Appendix: Complete API Comparison

### All Endpoint Changes

| Module | v1 Endpoint | v2 Endpoint | Breaking Changes |
|--------|------------|-------------|------------------|
| System | `GET /health` | `GET /health` | None |
| System | `GET /api` | `GET /api/v2/` | Path change |
| System | `GET /api/mock-stats` | **REMOVED** | Endpoint removed |
| Demo | `GET /api/demo/employees` | **REMOVED** | Endpoint removed |
| Demo | `GET /api/demo/departments` | **REMOVED** | Endpoint removed |
| Demo | `GET /api/demo/payroll` | **REMOVED** | Endpoint removed |
| HR | `GET /api/hr/employees` | `GET /api/v2/hr/employees` | Path, pagination, camelCase, envelope |
| HR | `POST /api/hr/employees` | `POST /api/v2/hr/employees` | Path, camelCase, envelope |
| HR | `GET /api/hr/employees/{id}` | `GET /api/v2/hr/employees/{id}` | Path, camelCase, envelope |
| HR | `PUT /api/hr/employees/{id}` | `PUT /api/v2/hr/employees/{id}` | Path, camelCase, envelope |
| HR | N/A | `DELETE /api/v2/hr/employees/{id}` | New endpoint |
| HR | `PATCH /api/hr/employees/{id}/promote` | `POST /api/v2/hr/employees/{id}/promote` | Method, path, camelCase |
| HR | `POST /api/hr/employees/{id}/terminate` | `POST /api/v2/hr/employees/{id}/terminate` | Path, camelCase |
| HR | `GET /api/hr/departments` | `GET /api/v2/hr/departments` | Path, pagination, envelope |
| HR | `POST /api/hr/departments` | `POST /api/v2/hr/departments` | Path, camelCase, envelope |
| HR | `GET /api/hr/departments/{id}` | `GET /api/v2/hr/departments/{id}` | Path, camelCase, envelope |
| Payroll | N/A | `GET /api/v2/payroll/records` | New endpoint |
| Payroll | N/A | `GET /api/v2/payroll/records/{id}` | New endpoint |
| Payroll | `POST /api/payroll/process` | `POST /api/v2/payroll/process` | Path, camelCase, envelope |
| Payroll | `POST /api/payroll/batch-process` | `POST /api/v2/payroll/batch-process` | Path, status 202, camelCase |
| Payroll | `POST /api/payroll/{id}/approve` | `POST /api/v2/payroll/records/{id}/approve` | Path, envelope |
| Billing | `GET /api/billing/customers` | `GET /api/v2/billing/customers` | Path, pagination, envelope |
| Billing | `POST /api/billing/customers` | `POST /api/v2/billing/customers` | Path, camelCase, envelope |
| Billing | `GET /api/billing/invoices` | `GET /api/v2/billing/invoices` | Path, pagination, camelCase, envelope |
| Billing | `POST /api/billing/invoices` | `POST /api/v2/billing/invoices` | Path, camelCase, envelope |
| Procurement | `GET /api/procurement/vendors` | `GET /api/v2/procurement/vendors` | Path, pagination, envelope |
| Procurement | `POST /api/procurement/vendors` | `POST /api/v2/procurement/vendors` | Path, camelCase, envelope |
| Procurement | `GET /api/procurement/purchase-orders` | `GET /api/v2/procurement/purchase-orders` | Path, pagination, camelCase |
| Procurement | `POST /api/procurement/purchase-orders` | `POST /api/v2/procurement/purchase-orders` | Path, camelCase, envelope |
| Supply Chain | `GET /api/supply-chain/shipments` | `GET /api/v2/supply-chain/shipments` | Path, pagination, camelCase |
| Supply Chain | `POST /api/supply-chain/shipments` | `POST /api/v2/supply-chain/shipments` | Path, camelCase, envelope |
| Inventory | `GET /api/inventory/items` | `GET /api/v2/inventory/items` | Path, pagination, camelCase |
| Inventory | `POST /api/inventory/items` | `POST /api/v2/inventory/items` | Path, camelCase, envelope |

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**API Version**: v2.0.0

For questions or clarifications, please contact the API team at api-support@yourcompany.com
