import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiInfo, getHealth, getMockStats } from '../services/api'

interface Module {
  name: string
  path: string
  description: string
  calls: string[]
  calledBy: string[]
}

export default function Dashboard() {
  const [modules, setModules] = useState<Module[]>([])
  const [health, setHealth] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [apiInfo, healthData, mockStats] = await Promise.all([
        getApiInfo(),
        getHealth(),
        getMockStats()
      ])
      setModules(apiInfo.modules || [])
      setHealth(healthData)
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const moduleCards = [
    { name: 'Human Resources', path: '/hr', icon: '👥', color: 'from-green-400 to-green-600', count: stats ? `${stats.hr.activeEmployees} Active Employees` : 'Employees & Departments' },
    { name: 'Payroll', path: '/payroll', icon: '💰', color: 'from-yellow-400 to-yellow-600', count: stats ? `${stats.payroll.paid} Records Paid` : 'Salary Processing' },
    { name: 'Accounting', path: '/accounting', icon: '📚', color: 'from-indigo-400 to-indigo-600', count: stats ? `${stats.accounting.totalTransactions} Transactions` : 'Journal Entries' },
    { name: 'Finance', path: '/finance', icon: '📈', color: 'from-pink-400 to-pink-600', count: stats ? `${stats.finance.activeBudgets} Active Budgets` : 'Budgets & Reports' },
    { name: 'Billing', path: '/billing', icon: '🧾', color: 'from-orange-400 to-orange-600', count: stats ? `${stats.billing.totalCustomers} Customers` : 'Invoices & Customers' },
    { name: 'Procurement', path: '/procurement', icon: '🛒', color: 'from-teal-400 to-teal-600', count: stats ? `${stats.procurement.totalVendors} Vendors` : 'Purchase Orders' },
    { name: 'Supply Chain', path: '/supply-chain', icon: '🚚', color: 'from-cyan-400 to-cyan-600', count: stats ? `${stats.supplyChain.inTransit} In Transit` : 'Shipments & Logistics' },
    { name: 'Inventory', path: '/inventory', icon: '📦', color: 'from-red-400 to-red-600', count: stats ? `${stats.inventory.totalItems} Items` : 'Stock Management' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to the Monolithic ERP System
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-2xl font-bold text-gray-900">{health?.status || 'Unknown'}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="stat-card border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Architecture</p>
              <p className="text-2xl font-bold text-gray-900">Monolithic</p>
            </div>
            <div className="text-4xl">🏗️</div>
          </div>
        </div>

        <div className="stat-card border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Modules</p>
              <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {moduleCards.map((module) => (
            <Link
              key={module.path}
              to={module.path}
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`h-48 bg-gradient-to-br ${module.color} p-6 flex flex-col justify-between`}>
                <div className="text-6xl">{module.icon}</div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{module.name}</h3>
                  <p className="text-white/80 text-sm">{module.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Cross-Module Dependencies */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cross-Module Dependencies</h2>
        <p className="text-gray-600 mb-6">
          This monolithic architecture features tight coupling between modules through direct service calls
        </p>

        <div className="space-y-3">
          <DependencyItem from="Payroll" to="HR" description="Gets employee data for payroll processing" />
          <DependencyItem from="Payroll" to="Accounting" description="Creates journal entries for payroll expenses" />
          <DependencyItem from="Billing" to="Accounting" description="Records revenue from invoices" />
          <DependencyItem from="Procurement" to="Accounting" description="Records purchase expenses" />
          <DependencyItem from="Inventory" to="Procurement" description="Auto-creates purchase orders when stock is low" />
          <DependencyItem from="Finance" to="Accounting" description="Generates financial reports" />
        </div>

        <div className="mt-6">
          <Link
            to="/architecture"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            View Full Architecture Diagram
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

function DependencyItem({ from, to, description }: { from: string; to: string; description: string }) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 mt-1">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-gray-900">{from}</span>
          <span className="text-gray-400">→</span>
          <span className="font-semibold text-gray-900">{to}</span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
