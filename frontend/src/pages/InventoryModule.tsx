import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function InventoryModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.inventory)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Inventory"
      icon="📦"
      description="Stock management and automatic reordering"
      calls={['Procurement']}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total Items</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalItems || 0}</p>
        </div>

        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Total Value</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.totalValue?.toLocaleString() || 0}</p>
        </div>

        <div className="stat-card border-yellow-500">
          <p className="text-sm font-medium text-gray-600">Low Stock</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.lowStock || 0}</p>
        </div>

        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">On Order</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.onOrder || 0}</p>
        </div>
      </div>

      <div className="card bg-red-50 border-2 border-red-200">
        <h3 className="text-lg font-bold text-red-900 mb-3">Automatic Reordering</h3>
        <p className="text-sm text-red-800 mb-3">
          This module demonstrates tight coupling by automatically calling the Procurement module when inventory is low.
        </p>
        <div className="bg-red-100 rounded p-3 text-sm text-red-800">
          <p className="font-semibold mb-2">Automatic Process:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Monitor stock levels after each transaction</li>
            <li>When (quantity on hand - reserved) ≤ reorder point</li>
            <li>Automatically call <code className="bg-red-200 px-2 py-0.5 rounded">ProcurementService.createReorderPurchaseOrder()</code></li>
            <li>Purchase order created with reorder quantity</li>
            <li>Update "quantity on order" field</li>
          </ol>
          <p className="text-xs text-red-700 mt-3">
            This direct service call creates tight coupling between Inventory and Procurement modules.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Stock Management" description="Track quantity on hand, reserved, and on order" />
          <Feature title="Reorder Points" description="Set minimum stock levels and reorder quantities" />
          <Feature title="Auto Reordering" description="Automatically create POs when stock is low" />
          <Feature title="Inventory Valuation" description="Calculate total inventory value at cost" />
          <Feature title="Stock Adjustments" description="Adjust stock levels with audit trail" />
          <Feature title="Reservations" description="Reserve stock for pending orders" />
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
