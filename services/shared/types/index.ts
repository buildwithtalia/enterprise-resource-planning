// Common types used across all microservices

export interface BaseEvent {
  eventId: string;
  eventType: string;
  eventVersion: string;
  timestamp: string;
  source: string;
  metadata: EventMetadata;
}

export interface EventMetadata {
  correlationId: string;
  causationId: string;
  userId: string;
  userEmail: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthenticatedRequest {
  user?: User;
}

// Employee Events
export interface EmployeeCreatedEvent extends BaseEvent {
  eventType: 'EmployeeCreated';
  data: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    jobTitle: string;
    salary: number;
    hireDate: string;
    status: string;
    department: {
      id: string;
      name: string;
      code: string;
    };
    bankAccountNumber: string;
    createdAt: string;
  };
}

export interface EmployeeUpdatedEvent extends BaseEvent {
  eventType: 'EmployeeUpdated';
  data: {
    employeeId: string;
    changes: Record<string, { oldValue: any; newValue: any }>;
    updatedAt: string;
  };
}

export interface EmployeeTerminatedEvent extends BaseEvent {
  eventType: 'EmployeeTerminated';
  data: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    terminationDate: string;
    reason: string;
    finalSalary: number;
    department: {
      id: string;
      name: string;
    };
    terminatedAt: string;
  };
}

// Payroll Events
export interface PayrollProcessedEvent extends BaseEvent {
  eventType: 'PayrollProcessed';
  data: {
    payrollId: string;
    employeeId: string;
    employeeName: string;
    department: string;
    payPeriod: {
      start: string;
      end: string;
    };
    amounts: {
      grossPay: number;
      federalTax: number;
      stateTax: number;
      socialSecurityTax: number;
      medicareTax: number;
      deductions: number;
      netPay: number;
    };
    status: string;
    processedAt: string;
  };
}

export interface PayrollApprovedEvent extends BaseEvent {
  eventType: 'PayrollApproved';
  data: {
    payrollId: string;
    employeeId: string;
    employeeName: string;
    department: string;
    payPeriod: {
      start: string;
      end: string;
    };
    amounts: {
      grossPay: number;
      taxes: number;
      netPay: number;
    };
    approvedBy: string;
    approvedAt: string;
  };
}

// Billing Events
export interface InvoiceCreatedEvent extends BaseEvent {
  eventType: 'InvoiceCreated';
  data: {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    amounts: {
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
    };
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    status: string;
    createdAt: string;
  };
}

export interface PaymentReceivedEvent extends BaseEvent {
  eventType: 'PaymentReceived';
  data: {
    paymentId: string;
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    paymentAmount: number;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    invoiceStatus: string;
    receivedAt: string;
  };
}

// Procurement Events
export interface PurchaseOrderCreatedEvent extends BaseEvent {
  eventType: 'PurchaseOrderCreated';
  data: {
    purchaseOrderId: string;
    poNumber: string;
    vendorId: string;
    vendorName: string;
    orderDate: string;
    expectedDeliveryDate: string;
    totalAmount: number;
    items: Array<{
      sku: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    status: string;
    createdAt: string;
  };
}

export interface PurchaseOrderReceivedEvent extends BaseEvent {
  eventType: 'PurchaseOrderReceived';
  data: {
    purchaseOrderId: string;
    poNumber: string;
    vendorId: string;
    vendorName: string;
    orderDate: string;
    expectedDeliveryDate: string;
    actualDeliveryDate: string;
    totalAmount: number;
    receivedItems: Array<{
      sku: string;
      description: string;
      quantityOrdered: number;
      quantityReceived: number;
      unitPrice: number;
      amount: number;
      condition: string;
    }>;
    receivedBy: string;
    receivedAt: string;
  };
}

// Inventory Events
export interface StockLevelLowEvent extends BaseEvent {
  eventType: 'StockLevelLow';
  data: {
    itemId: string;
    sku: string;
    name: string;
    currentQuantity: number;
    reorderPoint: number;
    reorderQuantity: number;
    preferredVendorId?: string;
    detectedAt: string;
  };
}

export interface StockMovementEvent extends BaseEvent {
  eventType: 'StockMovement';
  data: {
    movementId: string;
    itemId: string;
    sku: string;
    movementType: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    reference: string;
    reason?: string;
    movedBy: string;
    movedAt: string;
  };
}
