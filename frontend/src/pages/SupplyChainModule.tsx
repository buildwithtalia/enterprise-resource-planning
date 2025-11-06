import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import { getMockStats } from '../services/api'

export default function SupplyChainModule() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getMockStats()
      setStats(data.supplyChain)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <ModulePage
      title="Supply Chain"
      icon="🚚"
      description="Shipments, logistics, and distribution"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="stat-card border-yellow-500">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pending || 0}</p>
        </div>

        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">In Transit</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.inTransit || 0}</p>
        </div>

        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Delivered</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.delivered || 0}</p>
        </div>

        <div className="stat-card border-red-500">
          <p className="text-sm font-medium text-gray-600">Delayed</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.delayed || 0}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Shipment Tracking" description="Track inbound and outbound shipments with carriers" />
          <Feature title="Delivery Management" description="Monitor estimated and actual delivery dates" />
          <Feature title="Carrier Performance" description="Analyze carrier on-time delivery rates" />
          <Feature title="Cost Tracking" description="Track shipping costs per shipment" />
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
