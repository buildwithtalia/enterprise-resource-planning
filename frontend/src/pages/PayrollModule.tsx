import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function PayrollModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.payroll)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Payroll"
      icon="💰"
      description="Salary processing and tax calculations"
      calls={['HR', 'Accounting']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pending || 0}</p>
        </div>

        <div className="stat-card border-yellow-500">
          <p className="text-sm font-medium text-gray-600">Processed</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.processed || 0}</p>
        </div>

        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Paid</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.paid || 0}</p>
        </div>

        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">Total Paid</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.totalPaid?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="card bg-blue-50 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Cross-Module Integration</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="bg-blue-100 rounded-lg p-3">
            <p className="font-semibold mb-1">Step 1: Get Employee Data from HR</p>
            <p>Directly calls <code className="bg-blue-200 px-2 py-1 rounded">HRService.getEmployeeById()</code> to retrieve salary and employee details</p>
            <p className="text-xs text-blue-700 mt-1">File: src/modules/payroll/payroll.service.ts:46</p>
          </div>

          <div className="bg-blue-100 rounded-lg p-3">
            <p className="font-semibold mb-1">Step 2: Calculate Payroll</p>
            <p>Calculates gross pay, taxes (federal, state, social security, medicare), and net pay</p>
          </div>

          <div className="bg-blue-100 rounded-lg p-3">
            <p className="font-semibold mb-1">Step 3: Record in Accounting</p>
            <p>Directly calls <code className="bg-blue-200 px-2 py-1 rounded">AccountingService.recordPayrollExpense()</code> to create journal entries</p>
            <p className="text-xs text-blue-700 mt-1">File: src/modules/payroll/payroll.service.ts:106</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Automatic Tax Calculation" description="Calculates federal, state, social security, and medicare taxes" />
          <Feature title="Batch Processing" description="Process payroll for all active employees at once" />
          <Feature title="Pay Period Management" description="Track bi-weekly pay periods" />
          <Feature title="Deductions Support" description="Handle custom deductions and benefits" />
        </div>
      </div>
    </ModulePage>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start space-x-3">
      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
