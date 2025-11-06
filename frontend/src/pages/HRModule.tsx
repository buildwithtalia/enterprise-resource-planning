import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function HRModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.hr)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Human Resources"
      icon="👥"
      description="Employee and department management"
      calledBy={['Payroll']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Active Employees</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeEmployees || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Sample data</p>
        </div>

        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Departments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.departments || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Sample data</p>
        </div>

        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">On Leave</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.onLeave || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Sample data</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Module Features</h3>
        <div className="space-y-3">
          <Feature title="Employee Management" description="Create, update, and manage employee records" />
          <Feature title="Department Organization" description="Organize employees into departments with managers" />
          <Feature title="Employee Lifecycle" description="Track hiring, onboarding, and termination dates" />
          <Feature title="Employee Data" description="Store salary, contact info, bank details, and SSN" />
        </div>
      </div>

      <div className="card bg-yellow-50 border-2 border-yellow-200">
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
