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
export const getEmployees = async () => {
  const response = await api.get('/api/hr/employees')
  return response.data
}

export const getDepartments = async () => {
  const response = await api.get('/api/hr/departments')
  return response.data
}

// Payroll
export const getPayrollRecords = async () => {
  const response = await api.get('/api/payroll')
  return response.data
}

// Accounting
export const getTransactions = async () => {
  const response = await api.get('/api/accounting/transactions')
  return response.data
}

export const getTrialBalance = async () => {
  const response = await api.get('/api/accounting/trial-balance')
  return response.data
}

// Finance
export const getBudgets = async () => {
  const response = await api.get('/api/finance/budgets')
  return response.data
}

// Billing
export const getInvoices = async () => {
  const response = await api.get('/api/billing/invoices')
  return response.data
}

export const getCustomers = async () => {
  const response = await api.get('/api/billing/customers')
  return response.data
}

// Procurement
export const getPurchaseOrders = async () => {
  const response = await api.get('/api/procurement/purchase-orders')
  return response.data
}

export const getVendors = async () => {
  const response = await api.get('/api/procurement/vendors')
  return response.data
}

// Supply Chain
export const getShipments = async () => {
  const response = await api.get('/api/supply-chain/shipments')
  return response.data
}

// Inventory
export const getInventoryItems = async () => {
  const response = await api.get('/api/inventory/items')
  return response.data
}

export const getInventoryValuation = async () => {
  const response = await api.get('/api/inventory/valuation')
  return response.data
}

export default api
