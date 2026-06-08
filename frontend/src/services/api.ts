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
