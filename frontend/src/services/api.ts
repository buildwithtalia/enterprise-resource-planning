import axios from 'axios'

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Health and Info
export const getHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export const getApiInfo = async () => {
  const response = await api.get('/api')
  return response.data
}

// Mock/Demo Stats
export const getMockStats = async () => {
  const response = await api.get('/api/mock-stats')
  return response.data
}

// Demo Data
export const getDemoEmployees = async () => {
  const response = await api.get('/api/demo/employees')
  return response.data
}

export const getDemoDepartments = async () => {
  const response = await api.get('/api/demo/departments')
  return response.data
}

export const getDemoPayroll = async () => {
  const response = await api.get('/api/demo/payroll')
  return response.data
}

export const getDemoTransactions = async () => {
  const response = await api.get('/api/demo/transactions')
  return response.data
}

export const getDemoBudgets = async () => {
  const response = await api.get('/api/demo/budgets')
  return response.data
}

export const getDemoCustomers = async () => {
  const response = await api.get('/api/demo/customers')
  return response.data
}

export const getDemoInvoices = async () => {
  const response = await api.get('/api/demo/invoices')
  return response.data
}

export const getDemoVendors = async () => {
  const response = await api.get('/api/demo/vendors')
  return response.data
}

export const getDemoPurchaseOrders = async () => {
  const response = await api.get('/api/demo/purchase-orders')
  return response.data
}

export const getDemoInventory = async () => {
  const response = await api.get('/api/demo/inventory')
  return response.data
}

export const getDemoShipments = async () => {
  const response = await api.get('/api/demo/shipments')
  return response.data
}

// Human Resources
// The HR blueprint returns {success, data, total} with snake_case field names.
// These helpers normalise the response for the frontend.
function normaliseEmployee(emp: any) {
  if (!emp) return emp
  return {
    id: String(emp.id),
    firstName: emp.firstName ?? emp.first_name ?? '',
    lastName: emp.lastName ?? emp.last_name ?? '',
    email: emp.email ?? '',
    phoneNumber: emp.phoneNumber ?? emp.phone_number ?? '',
    position: emp.position ?? emp.jobTitle ?? '',
    salary: emp.salary ?? 0,
    hireDate: emp.hireDate ?? emp.hire_date ?? '',
    terminationDate: emp.terminationDate ?? emp.termination_date,
    status: emp.status ?? 'active',
    department: emp.department
      ? typeof emp.department === 'object'
        ? emp.department
        : { id: emp.departmentId ?? '', name: emp.department }
      : emp.departmentId
        ? { id: emp.departmentId, name: '' }
        : undefined,
  }
}

function normaliseDepartment(dept: any) {
  if (!dept) return dept
  return {
    id: String(dept.id),
    name: dept.name ?? '',
    description: dept.description ?? '',
    managerId: dept.managerId ?? dept.manager_id,
    budget: dept.budget ?? dept.budgetAllocated,
    location: dept.location ?? '',
    employeeCount: dept.employeeCount ?? dept.employee_count ?? 0,
  }
}

export const getEmployees = async (status?: string) => {
  const url = status ? `/api/hr/employees?status=${status}` : '/api/hr/employees'
  const response = await api.get(url)
  // Blueprint returns {success, data, total}; fallback to direct array
  const raw = response.data?.data ?? response.data
  const employees = Array.isArray(raw) ? raw : []
  return employees.map(normaliseEmployee)
}

export const getEmployee = async (id: string) => {
  const response = await api.get(`/api/hr/employees/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseEmployee(raw)
}

export const createEmployee = async (data: any) => {
  // Send both camelCase and snake_case to be compatible with both app.py inline
  // routes and the hr_routes blueprint (which uses snake_case field names).
  const payload = {
    ...data,
    first_name: data.firstName ?? data.first_name,
    last_name: data.lastName ?? data.last_name,
    hire_date: data.hireDate ?? data.hire_date,
    phone_number: data.phoneNumber ?? data.phone_number,
    department_id: data.departmentId ?? data.department_id,
  }
  const response = await api.post('/api/hr/employees', payload)
  const raw = response.data?.data ?? response.data
  return normaliseEmployee(raw)
}

export const updateEmployee = async (id: string, data: any) => {
  const response = await api.put(`/api/hr/employees/${id}`, data)
  const raw = response.data?.data ?? response.data
  return normaliseEmployee(raw)
}

export const terminateEmployee = async (id: string, terminationDate: string) => {
  const response = await api.post(`/api/hr/employees/${id}/terminate`, { terminationDate })
  return response.data?.data ?? response.data
}

export const promoteEmployee = async (id: string, data: { title: string; salaryIncrease: number }) => {
  const response = await api.patch(`/api/hr/employees/${id}/promote`, data)
  return response.data?.data ?? response.data
}

export const getDepartments = async () => {
  const response = await api.get('/api/hr/departments')
  const raw = response.data?.data ?? response.data
  const departments = Array.isArray(raw) ? raw : []
  return departments.map(normaliseDepartment)
}

export const getDepartment = async (id: string) => {
  const response = await api.get(`/api/hr/departments/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseDepartment(raw)
}

export const createDepartment = async (data: any) => {
  const response = await api.post('/api/hr/departments', data)
  const raw = response.data?.data ?? response.data
  return normaliseDepartment(raw)
}

// Payroll
function normalisePayroll(p: any) {
  if (!p) return p
  return {
    id: String(p.id),
    employeeId: p.employeeId ?? p.employee_id ?? '',
    payPeriodStart: p.payPeriodStart ?? p.pay_period_start ?? '',
    payPeriodEnd: p.payPeriodEnd ?? p.pay_period_end ?? '',
    grossPay: Number(p.grossPay ?? p.gross_pay ?? 0),
    deductions: Number(p.deductions ?? 0),
    taxWithheld: Number(p.taxWithheld ?? p.tax_withheld ?? 0),
    netPay: Number(p.netPay ?? p.net_pay ?? 0),
    bonus: Number(p.bonus ?? 0),
    overtime: Number(p.overtime ?? 0),
    status: p.status ?? 'pending',
    processedAt: p.processedAt ?? p.processed_at,
  }
}

export const getPayrollRecords = async () => {
  const response = await api.get('/api/payroll')
  const raw = response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normalisePayroll)
}

export const getPayrollRecord = async (id: string) => {
  const response = await api.get(`/api/payroll/${id}`)
  const raw = response.data?.data ?? response.data
  return normalisePayroll(raw)
}

export const getEmployeePayrollHistory = async (employeeId: string) => {
  const response = await api.get(`/api/payroll/employee/${employeeId}`)
  const raw = response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normalisePayroll)
}

export const processPayroll = async (data: {
  employeeId: string
  payPeriodStart: string
  payPeriodEnd: string
  grossPay?: number
  deductions?: number
  bonus?: number
  overtime?: number
}) => {
  const response = await api.post('/api/payroll/process', data)
  const raw = response.data?.data ?? response.data
  return normalisePayroll(raw)
}

export const processBatchPayroll = async (data: {
  employeeIds: string[]
  payPeriodStart: string
  payPeriodEnd: string
}) => {
  const response = await api.post('/api/payroll/process-batch', data)
  return response.data?.data ?? response.data
}

export const approvePayroll = async (id: string) => {
  const response = await api.post(`/api/payroll/${id}/approve`)
  return response.data?.data ?? response.data
}

// Accounting
function normaliseTransaction(t: any) {
  if (!t) return t
  return {
    id: String(t.id),
    date: t.date ?? '',
    description: t.description ?? '',
    amount: Number(t.amount ?? 0),
    type: t.type ?? 'debit',
    accountCode: t.accountCode ?? t.account_code ?? '',
    reference: t.reference ?? '',
  }
}

export const getTransactions = async () => {
  const response = await api.get('/api/accounting/transactions')
  const raw = response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseTransaction)
}

export const getTransaction = async (id: string) => {
  const response = await api.get(`/api/accounting/transactions/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseTransaction(raw)
}

export const createJournalEntry = async (data: {
  date: string
  description: string
  entries: Array<{ accountCode: string; debit?: number; credit?: number; description?: string }>
}) => {
  const response = await api.post('/api/accounting/journal-entries', data)
  return response.data?.data ?? response.data
}

export const getGeneralLedger = async () => {
  const response = await api.get('/api/accounting/general-ledger')
  return response.data?.data ?? response.data
}

export const getTrialBalance = async () => {
  const response = await api.get('/api/accounting/trial-balance')
  return response.data?.data ?? response.data
}

// Finance
function normaliseBudget(b: any) {
  if (!b) return b
  const allocated = Number(b.allocatedAmount ?? b.allocated_amount ?? 0)
  const spent = Number(b.spentAmount ?? b.spent_amount ?? 0)
  return {
    id: String(b.id),
    departmentId: b.departmentId ?? b.department_id ?? '',
    fiscalYear: Number(b.fiscalYear ?? b.fiscal_year ?? 0),
    quarter: b.quarter != null ? Number(b.quarter) : null,
    allocatedAmount: allocated,
    spentAmount: spent,
    remainingAmount: Number(b.remainingAmount ?? b.remaining_amount ?? allocated - spent),
    status: b.status ?? 'active',
  }
}

export const getBudgets = async () => {
  const response = await api.get('/api/finance/budgets')
  const raw = response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseBudget)
}

export const getBudget = async (id: string) => {
  const response = await api.get(`/api/finance/budgets/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseBudget(raw)
}

export const createBudget = async (data: any) => {
  const response = await api.post('/api/finance/budgets', data)
  const raw = response.data?.data ?? response.data
  return normaliseBudget(raw)
}

export const closeBudget = async (id: string) => {
  const response = await api.post(`/api/finance/budgets/${id}/close`)
  return response.data?.data ?? response.data
}

export const getBudgetUtilization = async (id: string) => {
  const response = await api.get(`/api/finance/budgets/${id}/utilization`)
  return response.data?.data ?? response.data
}

export const getFinancialReport = async (reportType: string = 'summary') => {
  const response = await api.get(`/api/finance/reports?type=${encodeURIComponent(reportType)}`)
  return response.data?.data ?? response.data
}

// Billing
function normaliseCustomer(c: any) {
  if (!c) return c
  return {
    id: String(c.id),
    name: c.name ?? '',
    email: c.email ?? '',
    phone: c.phone ?? c.phoneNumber ?? '',
    address: c.address ?? '',
    creditLimit: Number(c.creditLimit ?? c.credit_limit ?? 0),
    currentBalance: Number(c.currentBalance ?? c.current_balance ?? 0),
    paymentTerms: c.paymentTerms ?? c.payment_terms ?? '',
    status: c.status ?? 'active',
  }
}

function normaliseInvoice(i: any) {
  if (!i) return i
  const subtotal = Number(i.subtotal ?? 0)
  const taxAmount = Number(i.taxAmount ?? i.tax_amount ?? 0)
  const totalAmount = Number(i.totalAmount ?? i.total_amount ?? subtotal + taxAmount)
  const paidAmount = Number(i.paidAmount ?? i.paid_amount ?? 0)
  return {
    id: String(i.id),
    invoiceNumber: i.invoiceNumber ?? i.invoice_number ?? '',
    customerId: i.customerId ?? i.customer_id ?? '',
    issueDate: i.issueDate ?? i.issue_date ?? '',
    dueDate: i.dueDate ?? i.due_date ?? '',
    subtotal,
    taxAmount,
    totalAmount,
    paidAmount,
    balanceDue: Number(i.balanceDue ?? i.balance_due ?? totalAmount - paidAmount),
    status: i.status ?? 'draft',
    items: Array.isArray(i.items) ? i.items : [],
  }
}

export const getCustomers = async () => {
  const response = await api.get('/api/billing/customers')
  const raw = response.data?.customers ?? response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseCustomer)
}

export const getCustomer = async (id: string) => {
  const response = await api.get(`/api/billing/customers/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseCustomer(raw)
}

export const getCustomerBalance = async (id: string) => {
  const response = await api.get(`/api/billing/customers/${id}/balance`)
  return response.data?.data ?? response.data
}

export const createCustomer = async (data: any) => {
  const response = await api.post('/api/billing/customers', data)
  const raw = response.data?.data ?? response.data
  return normaliseCustomer(raw)
}

export const getInvoices = async () => {
  const response = await api.get('/api/billing/invoices')
  const raw = response.data?.invoices ?? response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseInvoice)
}

export const getInvoice = async (id: string) => {
  const response = await api.get(`/api/billing/invoices/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseInvoice(raw)
}

export const createInvoice = async (data: any) => {
  const response = await api.post('/api/billing/invoices', data)
  const raw = response.data?.data ?? response.data
  return normaliseInvoice(raw)
}

export const sendInvoice = async (id: string) => {
  const response = await api.post(`/api/billing/invoices/${id}/send`)
  return response.data?.data ?? response.data
}

export const recordInvoicePayment = async (
  id: string,
  data: { amount: number; paymentDate: string; paymentMethod: string }
) => {
  const response = await api.post(`/api/billing/invoices/${id}/payments`, data)
  return response.data?.data ?? response.data
}

export const cancelInvoice = async (id: string) => {
  const response = await api.post(`/api/billing/invoices/${id}/cancel`)
  return response.data?.data ?? response.data
}

export const getOverdueInvoices = async () => {
  const response = await api.get('/api/billing/invoices/overdue')
  return response.data?.data ?? response.data
}

// Procurement
function normaliseVendor(v: any) {
  if (!v) return v
  return {
    id: String(v.id),
    name: v.name ?? '',
    email: v.email ?? '',
    phone: v.phone ?? '',
    address: v.address ?? '',
    paymentTerms: v.paymentTerms ?? v.payment_terms ?? '',
    category: v.category ?? '',
    rating: v.rating != null ? Number(v.rating) : null,
    status: v.status ?? 'active',
  }
}

function normalisePO(p: any) {
  if (!p) return p
  return {
    id: String(p.id),
    poNumber: p.poNumber ?? p.po_number ?? '',
    vendorId: p.vendorId ?? p.vendor_id ?? '',
    orderDate: p.orderDate ?? p.order_date ?? '',
    expectedDeliveryDate: p.expectedDeliveryDate ?? p.expected_delivery_date ?? '',
    actualDeliveryDate: p.actualDeliveryDate ?? p.actual_delivery_date ?? '',
    subtotal: Number(p.subtotal ?? 0),
    tax: Number(p.tax ?? 0),
    totalAmount: Number(p.totalAmount ?? p.total ?? 0),
    status: p.status ?? 'draft',
    items: Array.isArray(p.items) ? p.items : [],
  }
}

export const getVendors = async () => {
  const response = await api.get('/api/procurement/vendors')
  const raw = response.data?.vendors ?? response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseVendor)
}

export const getVendor = async (id: string) => {
  const response = await api.get(`/api/procurement/vendors/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseVendor(raw)
}

export const createVendor = async (data: any) => {
  const response = await api.post('/api/procurement/vendors', data)
  const raw = response.data?.data ?? response.data
  return normaliseVendor(raw)
}

export const getVendorPerformance = async (id: string) => {
  const response = await api.get(`/api/procurement/vendors/${id}/performance`)
  return response.data?.data ?? response.data
}

export const getPurchaseOrders = async () => {
  const response = await api.get('/api/procurement/purchase-orders')
  const raw = response.data?.data ?? response.data?.purchaseOrders ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normalisePO)
}

export const getPurchaseOrder = async (id: string) => {
  const response = await api.get(`/api/procurement/purchase-orders/${id}`)
  const raw = response.data?.data ?? response.data
  return normalisePO(raw)
}

export const createPurchaseOrder = async (data: any) => {
  const response = await api.post('/api/procurement/purchase-orders', data)
  const raw = response.data?.data ?? response.data
  return normalisePO(raw)
}

export const approvePurchaseOrder = async (id: string) => {
  const response = await api.post(`/api/procurement/purchase-orders/${id}/approve`)
  return response.data?.data ?? response.data
}

export const placePurchaseOrder = async (id: string) => {
  const response = await api.post(`/api/procurement/purchase-orders/${id}/place`)
  return response.data?.data ?? response.data
}

export const receivePurchaseOrder = async (id: string) => {
  const response = await api.post(`/api/procurement/purchase-orders/${id}/receive`)
  return response.data?.data ?? response.data
}

export const cancelPurchaseOrder = async (id: string) => {
  const response = await api.post(`/api/procurement/purchase-orders/${id}/cancel`)
  return response.data?.data ?? response.data
}

// Supply Chain
function normaliseShipment(s: any) {
  if (!s) return s
  return {
    id: String(s.id),
    trackingNumber: s.trackingNumber ?? s.tracking_number ?? '',
    orderId: s.orderId ?? s.order_id ?? '',
    carrier: s.carrier ?? '',
    origin: s.origin ?? '',
    destination: s.destination ?? '',
    shipDate: s.shipDate ?? s.ship_date ?? '',
    estimatedDelivery: s.estimatedDelivery ?? s.estimated_delivery ?? s.estimatedDeliveryDate ?? '',
    actualDelivery: s.actualDelivery ?? s.actual_delivery ?? '',
    shippingCost: s.shippingCost != null ? Number(s.shippingCost) : null,
    totalWeight: s.totalWeight != null ? Number(s.totalWeight) : null,
    status: s.status ?? 'pending',
  }
}

export const getShipments = async () => {
  const response = await api.get('/api/supply-chain/shipments')
  const raw = response.data?.shipments ?? response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseShipment)
}

export const getShipment = async (id: string) => {
  const response = await api.get(`/api/supply-chain/shipments/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseShipment(raw)
}

export const createShipment = async (data: any) => {
  const response = await api.post('/api/supply-chain/shipments', data)
  const raw = response.data?.data ?? response.data
  return normaliseShipment(raw)
}

export const dispatchShipment = async (id: string) => {
  const response = await api.post(`/api/supply-chain/shipments/${id}/dispatch`)
  return response.data?.data ?? response.data
}

export const updateShipmentStatus = async (id: string, data: { status: string; location?: string }) => {
  const response = await api.put(`/api/supply-chain/shipments/${id}/status`, data)
  return response.data?.data ?? response.data
}

export const deliverShipment = async (id: string) => {
  const response = await api.post(`/api/supply-chain/shipments/${id}/deliver`)
  return response.data?.data ?? response.data
}

export const cancelShipment = async (id: string) => {
  const response = await api.post(`/api/supply-chain/shipments/${id}/cancel`)
  return response.data?.data ?? response.data
}

export const getCarrierPerformance = async () => {
  const response = await api.get('/api/supply-chain/carriers/performance')
  const raw = response.data?.carriers ?? response.data?.data ?? response.data
  return Array.isArray(raw) ? raw : []
}

export const getInboundSummary = async () => {
  const response = await api.get('/api/supply-chain/inbound/summary')
  return response.data?.data ?? response.data
}

export const getOutboundSummary = async () => {
  const response = await api.get('/api/supply-chain/outbound/summary')
  return response.data?.data ?? response.data
}

// Inventory
function normaliseInventoryItem(i: any) {
  if (!i) return i
  return {
    id: String(i.id),
    sku: i.sku ?? '',
    name: i.name ?? '',
    description: i.description ?? '',
    category: i.category ?? '',
    quantityOnHand: Number(i.quantityOnHand ?? i.quantity_on_hand ?? i.quantity ?? 0),
    availableQuantity: Number(i.availableQuantity ?? i.available_quantity ?? i.quantityOnHand ?? 0),
    reservedQuantity: Number(i.reservedQuantity ?? i.reserved_quantity ?? 0),
    reorderPoint: Number(i.reorderPoint ?? i.reorder_point ?? 0),
    reorderQuantity: Number(i.reorderQuantity ?? i.reorder_quantity ?? 0),
    unitPrice: Number(i.unitPrice ?? i.unit_price ?? 0),
    location: i.location ?? '',
    status: i.status ?? 'active',
  }
}

export const getInventoryItems = async () => {
  const response = await api.get('/api/inventory/items')
  const raw = response.data?.items ?? response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseInventoryItem)
}

export const getInventoryItem = async (id: string) => {
  const response = await api.get(`/api/inventory/items/${id}`)
  const raw = response.data?.data ?? response.data
  return normaliseInventoryItem(raw)
}

export const getInventoryItemBySku = async (sku: string) => {
  const response = await api.get(`/api/inventory/items/sku/${sku}`)
  const raw = response.data?.data ?? response.data
  return normaliseInventoryItem(raw)
}

export const createInventoryItem = async (data: any) => {
  const response = await api.post('/api/inventory/items', data)
  const raw = response.data?.data ?? response.data
  return normaliseInventoryItem(raw)
}

export const updateInventoryItem = async (id: string, data: any) => {
  const response = await api.put(`/api/inventory/items/${id}`, data)
  const raw = response.data?.data ?? response.data
  return normaliseInventoryItem(raw)
}

export const adjustStock = async (data: {
  itemId: string
  adjustmentType: 'increase' | 'decrease'
  quantity: number
  reason?: string
}) => {
  const response = await api.post('/api/inventory/stock/adjust', data)
  return response.data?.data ?? response.data
}

export const reserveStock = async (data: { itemId: string; quantity: number; orderId: string }) => {
  const response = await api.post('/api/inventory/stock/reserve', data)
  return response.data?.data ?? response.data
}

export const releaseReservedStock = async (data: { reservationId: string; itemId: string; quantity: number }) => {
  const response = await api.post('/api/inventory/stock/release', data)
  return response.data?.data ?? response.data
}

export const fulfillReservation = async (data: { reservationId: string; itemId: string; quantity: number }) => {
  const response = await api.post('/api/inventory/stock/fulfill', data)
  return response.data?.data ?? response.data
}

export const receiveStock = async (data: { itemId: string; quantity: number; purchaseOrderId?: string }) => {
  const response = await api.post('/api/inventory/stock/receive', data)
  return response.data?.data ?? response.data
}

export const getLowStockItems = async () => {
  const response = await api.get('/api/inventory/low-stock')
  const raw = response.data?.items ?? response.data?.data ?? response.data
  const list = Array.isArray(raw) ? raw : []
  return list.map(normaliseInventoryItem)
}

export const getInventoryValuation = async () => {
  const response = await api.get('/api/inventory/valuation')
  return response.data?.data ?? response.data
}

export const getInventoryCategories = async () => {
  const response = await api.get('/api/inventory/categories')
  const raw = response.data?.categories ?? response.data?.data ?? response.data
  return Array.isArray(raw) ? raw : []
}

export default api
