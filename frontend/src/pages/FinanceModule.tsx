import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import {
  getBudgets,
  getBudget,
  createBudget,
  closeBudget,
  getBudgetUtilization,
  getFinancialReport,
  getDepartments,
} from '../services/api'

interface Budget {
  id: string
  departmentId: string
  fiscalYear: number
  quarter: number | null
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  status: string
}

interface Department {
  id: string
  name: string
}

interface FinancialReport {
  reportType: string
  generatedAt: string
  data: { revenue: number; expenses: number; profit: number }
}

export default function FinanceModule() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [reportType, setReportType] = useState('summary')
  const [selected, setSelected] = useState<Budget | null>(null)
  const [utilization, setUtilization] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState<'budgets' | 'reports'>('budgets')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [budgetForm, setBudgetForm] = useState({
    departmentId: '',
    fiscalYear: new Date().getFullYear().toString(),
    quarter: '',
    allocatedAmount: '',
  })

  useEffect(() => {
    loadBudgets()
    loadDepartments()
    loadReport(reportType)
  }, [])

  useEffect(() => {
    loadReport(reportType)
  }, [reportType])

  const loadBudgets = async () => {
    try {
      setLoading(true)
      setBudgets(await getBudgets())
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try { setDepartments(await getDepartments()) } catch (e) { console.error(e) }
  }

  const loadReport = async (type: string) => {
    try { setReport(await getFinancialReport(type)) } catch (e) { console.error(e) }
  }

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name || id

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await createBudget({
        departmentId: budgetForm.departmentId,
        fiscalYear: parseInt(budgetForm.fiscalYear, 10),
        quarter: budgetForm.quarter ? parseInt(budgetForm.quarter, 10) : null,
        allocatedAmount: parseFloat(budgetForm.allocatedAmount),
      })
      flash('Budget created.')
      setShowCreate(false)
      setBudgetForm({ departmentId: '', fiscalYear: new Date().getFullYear().toString(), quarter: '', allocatedAmount: '' })
      loadBudgets()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create budget')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async (id: string) => {
    if (!confirm('Close this budget? It cannot be reopened.')) return
    try {
      setLoading(true)
      await closeBudget(id)
      flash('Budget closed.')
      loadBudgets()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to close budget')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (id: string) => {
    try {
      const [b, u] = await Promise.all([getBudget(id), getBudgetUtilization(id)])
      setSelected(b)
      setUtilization(u)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load budget')
    }
  }

  const filtered = statusFilter ? budgets.filter((b) => b.status === statusFilter) : budgets
  const active = budgets.filter((b) => b.status === 'active').length
  const totalAllocated = budgets.reduce((s, b) => s + b.allocatedAmount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0)
  const totalRemaining = budgets.reduce((s, b) => s + b.remainingAmount, 0)

  const statusBadge = (s: string) => s === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'

  return (
    <ModulePage title="Finance" icon="📈" description="Budgeting and financial reporting" calls={['Accounting']}>
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{success}</div>}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-green-500"><p className="text-sm font-medium text-gray-600">Active Budgets</p><p className="text-3xl font-bold text-gray-900 mt-2">{active}</p></div>
        <div className="stat-card border-blue-500"><p className="text-sm font-medium text-gray-600">Total Allocated</p><p className="text-2xl font-bold text-gray-900 mt-2">${totalAllocated.toLocaleString()}</p></div>
        <div className="stat-card border-purple-500"><p className="text-sm font-medium text-gray-600">Total Spent</p><p className="text-2xl font-bold text-gray-900 mt-2">${totalSpent.toLocaleString()}</p></div>
        <div className="stat-card border-yellow-500"><p className="text-sm font-medium text-gray-600">Remaining</p><p className="text-2xl font-bold text-gray-900 mt-2">${totalRemaining.toLocaleString()}</p></div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('budgets')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'budgets' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Budgets ({budgets.length})</button>
          <button onClick={() => setActiveTab('reports')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Reports</button>
        </nav>
      </div>

      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <button onClick={() => { setBudgetForm({ departmentId: departments[0]?.id || '', fiscalYear: new Date().getFullYear().toString(), quarter: '', allocatedAmount: '' }); setShowCreate(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">+ Create Budget</button>
          </div>

          {showCreate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Budget</h2>
                    <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <select required value={budgetForm.departmentId} onChange={(e) => setBudgetForm({ ...budgetForm, departmentId: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select department</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year *</label>
                        <input type="number" required min="2000" max="2100" value={budgetForm.fiscalYear} onChange={(e) => setBudgetForm({ ...budgetForm, fiscalYear: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                        <select value={budgetForm.quarter} onChange={(e) => setBudgetForm({ ...budgetForm, quarter: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Full year</option>
                          <option value="1">Q1</option>
                          <option value="2">Q2</option>
                          <option value="3">Q3</option>
                          <option value="4">Q4</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount *</label>
                      <input type="number" required min="0" step="0.01" value={budgetForm.allocatedAmount} onChange={(e) => setBudgetForm({ ...budgetForm, allocatedAmount: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Creating...' : 'Create Budget'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Budgets</h3>
            {loading && budgets.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No budgets found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">FY / Q</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allocated</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((b) => {
                      const pct = b.allocatedAmount > 0 ? Math.round((b.spentAmount / b.allocatedAmount) * 100) : 0
                      return (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deptName(b.departmentId)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.fiscalYear}{b.quarter ? ` / Q${b.quarter}` : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${b.allocatedAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${b.spentAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${b.remainingAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{pct}%</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(b.status)}`}>{b.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button onClick={() => handleView(b.id)} className="text-blue-600 hover:text-blue-900">View</button>
                            {b.status === 'active' && <button onClick={() => handleClose(b.id)} className="text-red-600 hover:text-red-900">Close</button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Budget Details</h2>
                    <button onClick={() => { setSelected(null); setUtilization(null) }} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-500">Department</label><p className="text-base text-gray-900">{deptName(selected.departmentId)}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Fiscal Year</label><p className="text-base text-gray-900">{selected.fiscalYear}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Quarter</label><p className="text-base text-gray-900">{selected.quarter || 'Full Year'}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Allocated</label><p className="text-base text-gray-900">${selected.allocatedAmount.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Spent</label><p className="text-base text-gray-900">${selected.spentAmount.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Remaining</label><p className="text-base font-semibold text-gray-900">${selected.remainingAmount.toLocaleString()}</p></div>
                    </div>
                    {utilization?.utilizationPercentage != null && (
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800"><strong>Utilization:</strong> {utilization.utilizationPercentage}%</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <button onClick={() => { setSelected(null); setUtilization(null) }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                    {selected.status === 'active' && (
                      <button onClick={() => { handleClose(selected.id); setSelected(null) }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium">Close Budget</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Report Type:</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="summary">Summary</option>
              <option value="profit-loss">Profit & Loss</option>
              <option value="balance-sheet">Balance Sheet</option>
              <option value="cash-flow">Cash Flow</option>
            </select>
          </div>
          {report && (
            <div className="card">
              <div className="flex justify-between items-baseline mb-4">
                <h3 className="text-lg font-bold text-gray-900 capitalize">{report.reportType} Report</h3>
                <p className="text-xs text-gray-500">Generated {new Date(report.generatedAt).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Revenue</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">${(report.data?.revenue || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-700">Expenses</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">${(report.data?.expenses || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">Profit</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">${(report.data?.profit || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ModulePage>
  )
}
