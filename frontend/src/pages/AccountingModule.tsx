import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function AccountingModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.accounting)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Accounting"
      icon="📚"
      description="General ledger and financial transactions"
      calledBy={['Payroll', 'Billing', 'Procurement', 'Finance']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalTransactions || 0}</p>
        </div>

        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Total Debits</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.totalDebits?.toLocaleString() || 0}</p>
        </div>

        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">Total Credits</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.totalCredits?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="card bg-indigo-50 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-indigo-900 mb-3">Central Hub - Called by Multiple Modules</h3>
        <p className="text-sm text-indigo-800 mb-4">
          Accounting is the most frequently called module in this monolithic architecture, demonstrating tight coupling:
        </p>
        <div className="space-y-2 text-sm">
          <CallerInfo module="Payroll" method="recordPayrollExpense()" purpose="Records salary expenses and tax liabilities" />
          <CallerInfo module="Billing" method="recordRevenue()" purpose="Records revenue from customer invoices" />
          <CallerInfo module="Procurement" method="recordPurchase()" purpose="Records inventory purchases and payables" />
          <CallerInfo module="Finance" method="getAllTransactions()" purpose="Generates financial reports" />
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Double-Entry Bookkeeping" description="Validates that debits equal credits" />
          <Feature title="General Ledger" description="Complete transaction history by account" />
          <Feature title="Trial Balance" description="Summary of all account balances" />
          <Feature title="Journal Entries" description="Record financial transactions with references" />
        </div>
      </div>
    </ModulePage>
  )
}

function CallerInfo({ module, method, purpose }: { module: string; method: string; purpose: string }) {
  return (
    <div className="bg-indigo-100 rounded p-3">
      <div className="flex items-center space-x-2 mb-1">
        <span className="font-semibold text-indigo-900">{module}</span>
        <span className="text-indigo-600">→</span>
        <code className="bg-indigo-200 px-2 py-0.5 rounded text-xs">{method}</code>
      </div>
      <p className="text-indigo-700">{purpose}</p>
    </div>
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
