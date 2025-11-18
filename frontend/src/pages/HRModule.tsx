import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import {
  getMockStats,
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  promoteEmployee,
  getDepartments,
  createDepartment,
} from '../services/api'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  jobTitle: string
  salary: number
  hireDate: string
  terminationDate?: string
  status: string
  department?: {
    id: string
    name: string
  }
}

interface Department {
  id: string
  name: string
  description: string
  budgetAllocated?: number
}

export default function HRModule() {
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showCreateEmployee, setShowCreateEmployee] = useState(false)
  const [showUpdateEmployee, setShowUpdateEmployee] = useState(false)
  const [showPromoteEmployee, setShowPromoteEmployee] = useState(false)
  const [showCreateDepartment, setShowCreateDepartment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    jobTitle: '',
    salary: '',
    hireDate: '',
    departmentId: '',
  })

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    budgetAllocated: '',
  })

  const [promoteForm, setPromoteForm] = useState({
    title: '',
    salaryIncrease: '',
  })

  useEffect(() => {
    loadStats()
    loadEmployees()
    loadDepartments()
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [statusFilter])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.hr)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await getEmployees(statusFilter)
      setEmployees(data)
      setError(null)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const data = await getDepartments()
      setDepartments(data)
    } catch (error: any) {
      console.error('Failed to load departments:', error)
    }
  }

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await createEmployee({
        ...employeeForm,
        salary: parseFloat(employeeForm.salary),
      })
      setSuccess('Employee created successfully!')
      setShowCreateEmployee(false)
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        jobTitle: '',
        salary: '',
        hireDate: '',
        departmentId: '',
      })
      loadEmployees()
      loadStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return

    try {
      setLoading(true)
      await updateEmployee(selectedEmployee.id, {
        ...employeeForm,
        salary: parseFloat(employeeForm.salary),
      })
      setSuccess('Employee updated successfully!')
      setShowUpdateEmployee(false)
      setSelectedEmployee(null)
      loadEmployees()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update employee')
    } finally {
      setLoading(false)
    }
  }

  const handleTerminateEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to terminate this employee?')) return

    try {
      setLoading(true)
      const terminationDate = new Date().toISOString().split('T')[0]
      await terminateEmployee(employeeId, terminationDate)
      setSuccess('Employee terminated successfully!')
      loadEmployees()
      loadStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to terminate employee')
    } finally {
      setLoading(false)
    }
  }

  const handleViewEmployee = async (employeeId: string) => {
    try {
      setLoading(true)
      const data = await getEmployee(employeeId)
      setSelectedEmployee(data)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load employee details')
    } finally {
      setLoading(false)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEmployeeForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      jobTitle: employee.jobTitle,
      salary: employee.salary.toString(),
      hireDate: employee.hireDate.split('T')[0],
      departmentId: employee.department?.id || '',
    })
    setShowUpdateEmployee(true)
  }

  const handlePromoteEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return

    try {
      setLoading(true)
      const updatedEmployee = await promoteEmployee(selectedEmployee.id, {
        title: promoteForm.title,
        salaryIncrease: parseFloat(promoteForm.salaryIncrease),
      })
      setSuccess(`Employee promoted successfully! New title: ${updatedEmployee.jobTitle}, New salary: $${updatedEmployee.salary.toLocaleString()}`)
      setShowPromoteEmployee(false)
      setSelectedEmployee(null)
      setPromoteForm({
        title: '',
        salaryIncrease: '',
      })
      loadEmployees()
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to promote employee')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPromoteModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setPromoteForm({
      title: employee.jobTitle,
      salaryIncrease: '',
    })
    setShowPromoteEmployee(true)
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await createDepartment({
        ...departmentForm,
        budgetAllocated: departmentForm.budgetAllocated
          ? parseFloat(departmentForm.budgetAllocated)
          : undefined,
      })
      setSuccess('Department created successfully!')
      setShowCreateDepartment(false)
      setDepartmentForm({
        name: '',
        description: '',
        budgetAllocated: '',
      })
      loadDepartments()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create department')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModulePage
      title="Human Resources"
      icon="👥"
      description="Employee and department management"
      calledBy={['Payroll']}
    >
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Active Employees</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeEmployees || employees.filter(e => e.status === 'active').length}</p>
        </div>

        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Departments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{departments.length}</p>
        </div>

        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">Total Employees</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{employees.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'departments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Departments
          </button>
        </nav>
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Employee Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateEmployee(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Create Employee
            </button>
          </div>

          {/* Create Employee Modal */}
          {showCreateEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Employee</h2>
                    <button
                      onClick={() => setShowCreateEmployee(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateEmployee} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeForm.firstName}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, firstName: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeForm.lastName}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, lastName: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={employeeForm.email}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, email: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={employeeForm.phoneNumber}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, phoneNumber: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeForm.jobTitle}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, jobTitle: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department *
                      </label>
                      <select
                        required
                        value={employeeForm.departmentId}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, departmentId: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Salary *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={employeeForm.salary}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, salary: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hire Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={employeeForm.hireDate}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, hireDate: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateEmployee(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create Employee'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Update Employee Modal */}
          {showUpdateEmployee && selectedEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Update Employee</h2>
                    <button
                      onClick={() => {
                        setShowUpdateEmployee(false)
                        setSelectedEmployee(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleUpdateEmployee} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={employeeForm.firstName}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, firstName: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={employeeForm.lastName}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, lastName: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={employeeForm.jobTitle}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, jobTitle: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        value={employeeForm.departmentId}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, departmentId: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salary
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={employeeForm.salary}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, salary: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUpdateEmployee(false)
                          setSelectedEmployee(null)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Updating...' : 'Update Employee'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Promote Employee Modal */}
          {showPromoteEmployee && selectedEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Promote Employee</h2>
                    <button
                      onClick={() => {
                        setShowPromoteEmployee(false)
                        setSelectedEmployee(null)
                        setPromoteForm({ title: '', salaryIncrease: '' })
                      }}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Employee:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Current Title:</strong> {selectedEmployee.jobTitle}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Current Salary:</strong> ${selectedEmployee.salary.toLocaleString()}
                    </p>
                  </div>

                  <form onSubmit={handlePromoteEmployee} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={promoteForm.title}
                        onChange={(e) =>
                          setPromoteForm({ ...promoteForm, title: e.target.value })
                        }
                        placeholder="e.g., Senior Software Engineer"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salary Increase Amount *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={promoteForm.salaryIncrease}
                        onChange={(e) =>
                          setPromoteForm({ ...promoteForm, salaryIncrease: e.target.value })
                        }
                        placeholder="e.g., 5000"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {promoteForm.salaryIncrease && (
                        <p className="mt-2 text-sm text-gray-600">
                          New salary will be: ${(selectedEmployee.salary + parseFloat(promoteForm.salaryIncrease || '0')).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPromoteEmployee(false)
                          setSelectedEmployee(null)
                          setPromoteForm({ title: '', salaryIncrease: '' })
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Promoting...' : 'Promote Employee'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Employee List */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Employees</h3>
            {loading && employees.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Loading employees...</p>
            ) : employees.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No employees found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{employee.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.jobTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {employee.department?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              employee.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewEmployee(employee.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                          {employee.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleEditEmployee(employee)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleOpenPromoteModal(employee)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Promote
                              </button>
                              <button
                                onClick={() => handleTerminateEmployee(employee.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Terminate
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Employee Details Modal */}
          {selectedEmployee && !showUpdateEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">First Name</label>
                        <p className="text-base text-gray-900">{selectedEmployee.firstName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Name</label>
                        <p className="text-base text-gray-900">{selectedEmployee.lastName}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-base text-gray-900">{selectedEmployee.email}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-base text-gray-900">{selectedEmployee.phoneNumber}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Job Title</label>
                      <p className="text-base text-gray-900">{selectedEmployee.jobTitle}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-base text-gray-900">
                        {selectedEmployee.department?.name || 'N/A'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Salary</label>
                        <p className="text-base text-gray-900">
                          ${selectedEmployee.salary.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <p className="text-base">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              selectedEmployee.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {selectedEmployee.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Hire Date</label>
                        <p className="text-base text-gray-900">
                          {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedEmployee.terminationDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Termination Date
                          </label>
                          <p className="text-base text-gray-900">
                            {new Date(selectedEmployee.terminationDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedEmployee.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleEditEmployee(selectedEmployee)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                        >
                          Edit Employee
                        </button>
                        <button
                          onClick={() => handleOpenPromoteModal(selectedEmployee)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                        >
                          Promote Employee
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateDepartment(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Create Department
            </button>
          </div>

          {/* Create Department Modal */}
          {showCreateDepartment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Department</h2>
                    <button
                      onClick={() => setShowCreateDepartment(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateDepartment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={departmentForm.name}
                        onChange={(e) =>
                          setDepartmentForm({ ...departmentForm, name: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={departmentForm.description}
                        onChange={(e) =>
                          setDepartmentForm({ ...departmentForm, description: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Allocated
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={departmentForm.budgetAllocated}
                        onChange={(e) =>
                          setDepartmentForm({
                            ...departmentForm,
                            budgetAllocated: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateDepartment(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create Department'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Departments List */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Departments</h3>
            {departments.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No departments found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{dept.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{dept.description}</p>
                    {dept.budgetAllocated && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Budget:</span> $
                        {parseFloat(dept.budgetAllocated.toString()).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {employees.filter((e) => e.department?.id === dept.id).length} employees
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cross-Coupling Info */}
      <div className="card bg-yellow-50 border-2 border-yellow-200 mt-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">Cross-Coupling</h3>
        <p className="text-sm text-yellow-800">
          The Payroll module directly imports and calls <code className="bg-yellow-100 px-2 py-1 rounded">HRService</code> to retrieve employee data when processing payroll.
        </p>
        <p className="text-xs text-yellow-700 mt-2">
          See: <code>src/modules/payroll/payroll.service.ts:46</code>
        </p>
      </div>
    </ModulePage>
  )
}
