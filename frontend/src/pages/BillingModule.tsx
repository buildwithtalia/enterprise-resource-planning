import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function BillingModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.billing)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Billing"
      icon="🧾"
      description="Invoicing and customer billing"
      calls={['Accounting']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCustomers || 0}</p>
        </div>

        <div className="stat-card border-yellow-500">
          <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingInvoices || 0}</p>
        </div>

        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.paidInvoices || 0}</p>
        </div>

        <div className="stat-card border-red-500">
          <p className="text-sm font-medium text-gray-600">Overdue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.overdueInvoices || 0}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Customer Management" description="Track customer information and credit limits" />
          <Feature title="Invoice Generation" description="Create invoices with automatic tax calculation" />
          <Feature title="Payment Tracking" description="Record partial and full payments" />
          <Feature title="Overdue Detection" description="Automatically flag overdue invoices" />
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
