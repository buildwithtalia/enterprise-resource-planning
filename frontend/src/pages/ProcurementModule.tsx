import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function ProcurementModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.procurement)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Procurement"
      icon="🛒"
      description="Purchase orders and vendor management"
      calls={['Accounting']}
      calledBy={['Inventory']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total Vendors</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalVendors || 0}</p>
        </div>

        <div className="stat-card border-yellow-500">
          <p className="text-sm font-medium text-gray-600">Pending POs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingPOs || 0}</p>
        </div>

        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Ordered</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.orderedPOs || 0}</p>
        </div>

        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">Received</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.receivedPOs || 0}</p>
        </div>
      </div>

      <div className="card bg-teal-50 border-2 border-teal-200">
        <h3 className="text-lg font-bold text-teal-900 mb-3">Cross-Coupling with Inventory</h3>
        <p className="text-sm text-teal-800 mb-3">
          The Inventory module can automatically call this module to create purchase orders when stock levels are low.
        </p>
        <div className="bg-teal-100 rounded p-3 text-sm text-teal-800">
          <p className="font-semibold mb-1">Auto-Reorder Flow:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Inventory detects stock at or below reorder point</li>
            <li>Calls <code className="bg-teal-200 px-2 py-0.5 rounded">ProcurementService.createReorderPurchaseOrder()</code></li>
            <li>Purchase order automatically created with preferred vendor</li>
          </ol>
          <p className="text-xs text-teal-700 mt-2">File: src/modules/inventory/inventory.service.ts:186</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Vendor Management" description="Track vendor information, payment terms, and discounts" />
          <Feature title="Purchase Orders" description="Create and manage purchase orders with approval workflow" />
          <Feature title="Vendor Performance" description="Track on-time delivery rates and spending by vendor" />
          <Feature title="Automatic Reordering" description="Integration with Inventory for automatic PO creation" />
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
