import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import {
  getPayrollRecords,
  getPayrollRecord,
  processPayroll,
  approvePayroll,
  getEmployees,
} from '../services/api'

interface PayrollRecord {
  id: string
  employeeId: string
  payPeriodStart: string
  payPeriodEnd: string
  grossPay: number
  deductions: number
  taxWithheld: number
  netPay: number
  bonus: number
  overtime: number
  status: string
  processedAt?: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  position?: string
  salary?: number
}

export default function PayrollModule() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected] = useState<PayrollRecord | null>(null)
  const [showProcess, setShowProcess] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [processForm, setProcessForm] = useState({
    employeeId: '',
    payPeriodStart: '',
    payPeriodEnd: '',
    grossPay: '',
    deductions: '',
    bonus: '',
    overtime: '',
  })

  useEffect(() => {
    loadRecords()
    loadEmployees()
  }, [])

  const loadRecords = async () => {
    try {
      setLoading(true)
      setRecords(await getPayrollRecords())
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load payroll records')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      setEmployees(await getEmployees())
    } catch (e) {
      console.error('Failed to load employees:', e)
    }
  }

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const employeeName = (id: string) => {
    const e = employees.find((e) => e.id === id)
    return e ? `${e.firstName} ${e.lastName}` : id
  }

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await processPayroll({
        employeeId: processForm.employeeId,
        payPeriodStart: processForm.payPeriodStart,
        payPeriodEnd: processForm.payPeriodEnd,
        grossPay: processForm.grossPay ? parseFloat(processForm.grossPay) : undefined,
        deductions: processForm.deductions ? parseFloat(processForm.deductions) : undefined,
        bonus: processForm.bonus ? parseFloat(processForm.bonus) : undefined,
        overtime: processForm.overtime ? parseFloat(processForm.overtime) : undefined,
      })
      flash('Payroll record created.')
      setShowProcess(false)
      setProcessForm({ employeeId: '', payPeriodStart: '', payPeriodEnd: '', grossPay: '', deductions: '', bonus: '', overtime: '' })
      loadRecords()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process payroll')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setLoading(true)
      await approvePayroll(id)
      flash('Payroll approved.')
      loadRecords()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (id: string) => {
    try {
      setSelected(await getPayrollRecord(id))
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load record')
    }
  }

  const filtered = statusFilter ? records.filter((r) => r.status === statusFilter) : records
  const pending = records.filter((r) => r.status === 'pending').length
  const approved = records.filter((r) => r.status === 'approved').length
  const paid = records.filter((r) => r.status === 'paid').length
  const totalGross = records.reduce((s, r) => s + r.grossPay, 0)
  const totalNet = records.reduce((s, r) => s + r.netPay, 0)

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    }
    return map[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <ModulePage title="Payroll" icon="💰" description="Salary processing and tax calculations" calls={['HR', 'Accounting']}>
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{success}</div>}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-yellow-500">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{pending}</p>
        </div>
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Approved</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{approved}</p>
        </div>
        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Paid</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{paid}</p>
        </div>
        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">Total Records</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{records.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Gross Pay</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalGross.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Net Pay</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalNet.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <button
          onClick={() => {
            setProcessForm({
              employeeId: employees[0]?.id || '',
              payPeriodStart: '',
              payPeriodEnd: '',
              grossPay: '',
              deductions: '',
              bonus: '',
              overtime: '',
            })
            setShowProcess(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Process Payroll
        </button>
      </div>

      {showProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Process Payroll</h2>
                <button onClick={() => setShowProcess(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
              </div>
              <form onSubmit={handleProcess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    required
                    value={processForm.employeeId}
                    onChange={(e) => setProcessForm({ ...processForm, employeeId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} {e.position ? `— ${e.position}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Start *</label>
                    <input type="date" required value={processForm.payPeriodStart} onChange={(e) => setProcessForm({ ...processForm, payPeriodStart: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period End *</label>
                    <input type="date" required value={processForm.payPeriodEnd} onChange={(e) => setProcessForm({ ...processForm, payPeriodEnd: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gross Pay</label>
                    <input type="number" min="0" step="0.01" value={processForm.grossPay} onChange={(e) => setProcessForm({ ...processForm, grossPay: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="defaults to 6250" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                    <input type="number" min="0" step="0.01" value={processForm.deductions} onChange={(e) => setProcessForm({ ...processForm, deductions: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="defaults to 1000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
                    <input type="number" min="0" step="0.01" value={processForm.bonus} onChange={(e) => setProcessForm({ ...processForm, bonus: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overtime</label>
                    <input type="number" min="0" step="0.01" value={processForm.overtime} onChange={(e) => setProcessForm({ ...processForm, overtime: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowProcess(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Processing...' : 'Process Payroll'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Payroll Records</h3>
        {loading && records.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No payroll records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employeeName(r.employeeId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.payPeriodStart} → {r.payPeriodEnd}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${r.grossPay.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${r.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${r.taxWithheld.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">${r.netPay.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleView(r.id)} className="text-blue-600 hover:text-blue-900">View</button>
                      {r.status === 'pending' && (
                        <button onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-900">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payroll Record</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
              </div>
              <div className="space-y-3">
                <div><label className="text-sm font-medium text-gray-500">Employee</label><p className="text-base text-gray-900">{employeeName(selected.employeeId)}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-gray-500">Period Start</label><p className="text-base text-gray-900">{selected.payPeriodStart}</p></div>
                  <div><label className="text-sm font-medium text-gray-500">Period End</label><p className="text-base text-gray-900">{selected.payPeriodEnd}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-gray-500">Gross Pay</label><p className="text-base text-gray-900">${selected.grossPay.toLocaleString()}</p></div>
                  <div><label className="text-sm font-medium text-gray-500">Net Pay</label><p className="text-base font-semibold text-gray-900">${selected.netPay.toLocaleString()}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-sm font-medium text-gray-500">Deductions</label><p className="text-base text-gray-900">${selected.deductions.toLocaleString()}</p></div>
                  <div><label className="text-sm font-medium text-gray-500">Tax</label><p className="text-base text-gray-900">${selected.taxWithheld.toLocaleString()}</p></div>
                  <div><label className="text-sm font-medium text-gray-500">Bonus</label><p className="text-base text-gray-900">${selected.bonus.toLocaleString()}</p></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-base"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(selected.status)}`}>{selected.status}</span></p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                {selected.status === 'pending' && (
                  <button onClick={() => { handleApprove(selected.id); setSelected(null) }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">Approve</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-yellow-50 border-2 border-yellow-200 mt-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">Cross-Coupling</h3>
        <p className="text-sm text-yellow-800">
          Payroll calls <code className="bg-yellow-100 px-2 py-1 rounded">HRService</code> to load employee data and <code className="bg-yellow-100 px-2 py-1 rounded">AccountingService</code> to record the payroll expense.
        </p>
      </div>
    </ModulePage>
  )
}
