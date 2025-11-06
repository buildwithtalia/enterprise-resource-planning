import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function FinanceModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.finance)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Finance"
      icon="📈"
      description="Budgeting and financial reporting"
      calls={['Accounting']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Active Budgets</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeBudgets || 0}</p>
        </div>

        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.totalRevenue?.toLocaleString() || 0}</p>
        </div>

        <div className="stat-card border-red-500">
          <p className="text-sm font-medium text-gray-600">Total Expenses</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.totalExpenses?.toLocaleString() || 0}</p>
        </div>

        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">Net Income</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.netIncome?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Budget Management" description="Create and track departmental budgets by fiscal year" />
          <Feature title="Budget Utilization" description="Monitor spending against allocated budgets" />
          <Feature title="Financial Reports" description="Generate income statements and P&L reports" />
          <Feature title="Department Analysis" description="Budget summaries by department" />
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
