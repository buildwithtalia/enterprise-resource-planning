import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import {
  getShipments,
  getShipment,
  createShipment,
  dispatchShipment,
  deliverShipment,
  cancelShipment,
  updateShipmentStatus,
  getCarrierPerformance,
} from '../services/api'

interface Shipment {
  id: string
  trackingNumber: string
  orderId: string
  carrier: string
  origin: string
  destination: string
  shipDate: string
  estimatedDelivery: string
  actualDelivery?: string
  shippingCost: number | null
  totalWeight: number | null
  status: string
}

interface Carrier {
  name: string
  onTimeRate: number
  avgDeliveryTime: number
}

export default function SupplyChainModule() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'carriers'>('shipments')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [selected, setSelected] = useState<Shipment | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [shipmentForm, setShipmentForm] = useState({
    orderId: '', carrier: 'FedEx', origin: '', destination: '', shipDate: '', estimatedDelivery: '',
  })
  const [statusForm, setStatusForm] = useState({ status: '', location: '' })

  useEffect(() => {
    loadShipments()
    loadCarriers()
  }, [])

  const loadShipments = async () => {
    try { setLoading(true); setShipments(await getShipments()); setError(null) }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to load shipments') }
    finally { setLoading(false) }
  }

  const loadCarriers = async () => {
    try { setCarriers(await getCarrierPerformance()) } catch (e) { console.error(e) }
  }

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await createShipment(shipmentForm)
      flash('Shipment created.')
      setShowCreate(false)
      setShipmentForm({ orderId: '', carrier: 'FedEx', origin: '', destination: '', shipDate: '', estimatedDelivery: '' })
      loadShipments()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to create shipment') }
    finally { setLoading(false) }
  }

  const handleView = async (id: string) => {
    try { setSelected(await getShipment(id)) } catch (e: any) { setError(e.response?.data?.message || 'Failed to load shipment') }
  }

  const doAction = async (id: string, fn: (id: string) => Promise<any>, msg: string) => {
    try { setLoading(true); await fn(id); flash(msg); loadShipments() }
    catch (e: any) { setError(e.response?.data?.message || 'Action failed') }
    finally { setLoading(false) }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      setLoading(true)
      await updateShipmentStatus(selected.id, { status: statusForm.status, location: statusForm.location })
      flash('Status updated.')
      setShowUpdateStatus(false)
      setStatusForm({ status: '', location: '' })
      loadShipments()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to update status') }
    finally { setLoading(false) }
  }

  const filtered = statusFilter ? shipments.filter((s) => s.status === statusFilter) : shipments
  const pending = shipments.filter((s) => s.status === 'pending').length
  const dispatched = shipments.filter((s) => s.status === 'dispatched').length
  const inTransit = shipments.filter((s) => s.status === 'in_transit').length
  const delivered = shipments.filter((s) => s.status === 'delivered').length

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      dispatched: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <ModulePage title="Supply Chain" icon="🚚" description="Shipments and logistics">
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{success}</div>}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-yellow-500"><p className="text-sm font-medium text-gray-600">Pending</p><p className="text-3xl font-bold text-gray-900 mt-2">{pending}</p></div>
        <div className="stat-card border-indigo-500"><p className="text-sm font-medium text-gray-600">Dispatched</p><p className="text-3xl font-bold text-gray-900 mt-2">{dispatched}</p></div>
        <div className="stat-card border-blue-500"><p className="text-sm font-medium text-gray-600">In Transit</p><p className="text-3xl font-bold text-gray-900 mt-2">{inTransit}</p></div>
        <div className="stat-card border-green-500"><p className="text-sm font-medium text-gray-600">Delivered</p><p className="text-3xl font-bold text-gray-900 mt-2">{delivered}</p></div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('shipments')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'shipments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Shipments ({shipments.length})</button>
          <button onClick={() => setActiveTab('carriers')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'carriers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Carriers ({carriers.length})</button>
        </nav>
      </div>

      {activeTab === 'shipments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="dispatched">Dispatched</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={() => { setShipmentForm({ orderId: '', carrier: 'FedEx', origin: '', destination: '', shipDate: new Date().toISOString().split('T')[0], estimatedDelivery: '' }); setShowCreate(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">+ Create Shipment</button>
          </div>

          {showCreate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Shipment</h2>
                    <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label><input type="text" required value={shipmentForm.orderId} onChange={(e) => setShipmentForm({ ...shipmentForm, orderId: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Carrier *</label>
                        <select value={shipmentForm.carrier} onChange={(e) => setShipmentForm({ ...shipmentForm, carrier: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {carriers.length > 0 ? carriers.map((c) => <option key={c.name}>{c.name}</option>) : (<><option>FedEx</option><option>UPS</option><option>USPS</option><option>DHL</option></>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label><input type="text" required value={shipmentForm.origin} onChange={(e) => setShipmentForm({ ...shipmentForm, origin: e.target.value })} placeholder="e.g., Chicago, IL" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label><input type="text" required value={shipmentForm.destination} onChange={(e) => setShipmentForm({ ...shipmentForm, destination: e.target.value })} placeholder="e.g., Austin, TX" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Ship Date *</label><input type="date" required value={shipmentForm.shipDate} onChange={(e) => setShipmentForm({ ...shipmentForm, shipDate: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label><input type="date" value={shipmentForm.estimatedDelivery} onChange={(e) => setShipmentForm({ ...shipmentForm, estimatedDelivery: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Creating...' : 'Create Shipment'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showUpdateStatus && selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Update Status</h2>
                    <button onClick={() => { setShowUpdateStatus(false); setStatusForm({ status: '', location: '' }) }} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Shipment <strong>{selected.trackingNumber}</strong> (currently: {selected.status})</p>
                  <form onSubmit={handleUpdateStatus} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Status *</label>
                      <select required value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select status</option>
                        <option value="pending">Pending</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label><input type="text" value={statusForm.location} onChange={(e) => setStatusForm({ ...statusForm, location: e.target.value })} placeholder="e.g., Memphis, TN" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => { setShowUpdateStatus(false); setStatusForm({ status: '', location: '' }) }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Updating...' : 'Update'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Shipments</h3>
            {loading && shipments.length === 0 ? <p className="text-gray-600 text-center py-8">Loading...</p> : filtered.length === 0 ? <p className="text-gray-600 text-center py-8">No shipments found</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin → Destination</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ship / ETA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.trackingNumber || s.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.carrier}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.origin} → {s.destination}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.shipDate}{s.estimatedDelivery ? ` → ${s.estimatedDelivery}` : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(s.status)}`}>{s.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => handleView(s.id)} className="text-blue-600 hover:text-blue-900">View</button>
                          {s.status === 'pending' && (
                            <button onClick={() => doAction(s.id, dispatchShipment, 'Shipment dispatched.')} className="text-indigo-600 hover:text-indigo-900">Dispatch</button>
                          )}
                          {(s.status === 'dispatched' || s.status === 'in_transit') && (
                            <>
                              <button onClick={() => { setSelected(s); setStatusForm({ status: '', location: '' }); setShowUpdateStatus(true) }} className="text-purple-600 hover:text-purple-900">Status</button>
                              <button onClick={() => doAction(s.id, deliverShipment, 'Marked as delivered.')} className="text-green-600 hover:text-green-900">Deliver</button>
                            </>
                          )}
                          {s.status !== 'delivered' && s.status !== 'cancelled' && (
                            <button onClick={() => { if (confirm('Cancel this shipment?')) doAction(s.id, cancelShipment, 'Shipment cancelled.') }} className="text-red-600 hover:text-red-900">Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && !showUpdateStatus && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Shipment Details</h2>
                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-500">Tracking #</label><p className="text-base text-gray-900">{selected.trackingNumber || '—'}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Order ID</label><p className="text-base text-gray-900">{selected.orderId || '—'}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Carrier</label><p className="text-base text-gray-900">{selected.carrier}</p></div>
                    </div>
                    <div><label className="text-sm font-medium text-gray-500">Origin</label><p className="text-base text-gray-900">{selected.origin}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Destination</label><p className="text-base text-gray-900">{selected.destination}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Ship Date</label><p className="text-base text-gray-900">{selected.shipDate || '—'}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Estimated Delivery</label><p className="text-base text-gray-900">{selected.estimatedDelivery || '—'}</p></div>
                    </div>
                    {selected.actualDelivery && <div><label className="text-sm font-medium text-gray-500">Actual Delivery</label><p className="text-base text-gray-900">{selected.actualDelivery}</p></div>}
                    <div><label className="text-sm font-medium text-gray-500">Status</label><p className="text-base"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(selected.status)}`}>{selected.status}</span></p></div>
                  </div>
                  <div className="flex justify-end pt-6 border-t mt-6">
                    <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'carriers' && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Carrier Performance</h3>
          {carriers.length === 0 ? <p className="text-gray-600 text-center py-8">No carrier data</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carriers.map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{c.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">On-time rate</span><span className="font-medium text-gray-900">{c.onTimeRate}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Avg delivery time</span><span className="font-medium text-gray-900">{c.avgDeliveryTime} days</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Active shipments</span><span className="font-medium text-gray-900">{shipments.filter((s) => s.carrier === c.name && s.status !== 'delivered' && s.status !== 'cancelled').length}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ModulePage>
  )
}
