import { useEffect, useState } from 'react'
import * as Sentry from '@sentry/react'
import ModulePage from '../components/ModulePage'
import {
  getVendors,
  getVendor,
  createVendor,
  getVendorPerformance,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  approvePurchaseOrder,
  placePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from '../services/api'

function extractApiErrorMessage(e: any, fallback: string): string {
  const data = e?.response?.data
  return (
    data?.error?.message ||
    data?.message ||
    data?.error ||
    e?.message ||
    fallback
  )
}

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  paymentTerms: string
  category: string
  rating: number | null
  status: string
}

interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  orderDate: string
  expectedDeliveryDate: string
  actualDeliveryDate?: string
  subtotal: number
  tax: number
  totalAmount: number
  status: string
  items: any[]
}

export default function ProcurementModule() {
  const [activeTab, setActiveTab] = useState<'vendors' | 'pos'>('vendors')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [pos, setPOs] = useState<PurchaseOrder[]>([])
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [vendorPerf, setVendorPerf] = useState<any>(null)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [showCreateVendor, setShowCreateVendor] = useState(false)
  const [showCreatePO, setShowCreatePO] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [vendorForm, setVendorForm] = useState({
    name: '', email: '', phone: '', address: '', paymentTerms: 'Net 30', category: '',
  })

  const [poForm, setPOForm] = useState({
    vendorId: '', orderDate: '', expectedDeliveryDate: '', totalAmount: '', description: '',
  })

  useEffect(() => {
    loadVendors()
    loadPOs()
  }, [])

  const loadVendors = async () => {
    try { setLoading(true); setVendors(await getVendors()); setError(null) }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to load vendors') }
    finally { setLoading(false) }
  }

  const loadPOs = async () => {
    try { setPOs(await getPurchaseOrders()) }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to load POs') }
  }

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name || id

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await createVendor(vendorForm)
      flash('Vendor created.')
      setShowCreateVendor(false)
      setVendorForm({ name: '', email: '', phone: '', address: '', paymentTerms: 'Net 30', category: '' })
      loadVendors()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to create vendor') }
    finally { setLoading(false) }
  }

  const handleViewVendor = async (id: string) => {
    try {
      const [v, perf] = await Promise.all([getVendor(id), getVendorPerformance(id)])
      setSelectedVendor(v)
      setVendorPerf(perf)
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to load vendor') }
  }

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const total = parseFloat(poForm.totalAmount || '0')
      await createPurchaseOrder({
        vendorId: poForm.vendorId,
        orderDate: poForm.orderDate,
        expectedDeliveryDate: poForm.expectedDeliveryDate,
        totalAmount: total,
        items: poForm.description ? [{ description: poForm.description, quantity: 1, unitPrice: total }] : [],
      })
      flash('Purchase order created.')
      setShowCreatePO(false)
      setPOForm({ vendorId: '', orderDate: '', expectedDeliveryDate: '', totalAmount: '', description: '' })
      loadPOs()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to create PO') }
    finally { setLoading(false) }
  }

  const handleViewPO = async (id: string) => {
    try { setSelectedPO(await getPurchaseOrder(id)) }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to load PO') }
  }

  const doPOAction = async (
    id: string,
    fn: (id: string) => Promise<any>,
    msg: string,
    actionLabel: string,
  ) => {
    try {
      setLoading(true)
      await fn(id)
      flash(msg)
      loadPOs()
    } catch (e: any) {
      const status = e?.response?.status
      const detail = extractApiErrorMessage(e, 'Action failed')
      setError(`${actionLabel} failed${status ? ` (HTTP ${status})` : ''}: ${detail}`)
      Sentry.captureException(e, {
        tags: { module: 'procurement', action: actionLabel },
        extra: { poId: id, httpStatus: status, responseBody: e?.response?.data },
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPOs = statusFilter ? pos.filter((p) => p.status === statusFilter) : pos
  const totalSpend = pos.reduce((s, p) => s + p.totalAmount, 0)
  const activeVendors = vendors.filter((v) => v.status === 'active').length
  const pendingPOs = pos.filter((p) => p.status === 'draft' || p.status === 'pending_approval').length
  const placedPOs = pos.filter((p) => p.status === 'placed' || p.status === 'approved').length
  const receivedPOs = pos.filter((p) => p.status === 'received').length

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      placed: 'bg-indigo-100 text-indigo-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-600',
      suspended: 'bg-red-100 text-red-800',
    }
    return map[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <ModulePage title="Procurement" icon="🛒" description="Purchase orders and vendor management" calls={['Accounting']} calledBy={['Inventory']}>
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{success}</div>}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-blue-500"><p className="text-sm font-medium text-gray-600">Active Vendors</p><p className="text-3xl font-bold text-gray-900 mt-2">{activeVendors}</p></div>
        <div className="stat-card border-yellow-500"><p className="text-sm font-medium text-gray-600">Pending POs</p><p className="text-3xl font-bold text-gray-900 mt-2">{pendingPOs}</p></div>
        <div className="stat-card border-indigo-500"><p className="text-sm font-medium text-gray-600">Placed / Approved</p><p className="text-3xl font-bold text-gray-900 mt-2">{placedPOs}</p></div>
        <div className="stat-card border-green-500"><p className="text-sm font-medium text-gray-600">Received</p><p className="text-3xl font-bold text-gray-900 mt-2">{receivedPOs}</p></div>
      </div>

      <div className="card mb-6">
        <p className="text-sm font-medium text-gray-600">Total Spend (all POs)</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">${totalSpend.toLocaleString()}</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('vendors')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vendors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Vendors ({vendors.length})</button>
          <button onClick={() => setActiveTab('pos')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Purchase Orders ({pos.length})</button>
        </nav>
      </div>

      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateVendor(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">+ Create Vendor</button>
          </div>

          {showCreateVendor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Vendor</h2>
                    <button onClick={() => setShowCreateVendor(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <form onSubmit={handleCreateVendor} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" required value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" required value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input type="text" value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} placeholder="e.g., Hardware" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                        <select value={vendorForm.paymentTerms} onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Net 15</option><option>Net 30</option><option>Net 60</option><option>Due on receipt</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => setShowCreateVendor(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Creating...' : 'Create Vendor'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vendors</h3>
            {loading && vendors.length === 0 ? <p className="text-gray-600 text-center py-8">Loading...</p> : vendors.length === 0 ? <p className="text-gray-600 text-center py-8">No vendors found</p> : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.paymentTerms}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(v.status)}`}>{v.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleViewVendor(v.id)} className="text-blue-600 hover:text-blue-900">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedVendor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
                    <button onClick={() => { setSelectedVendor(null); setVendorPerf(null) }} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-500">Name</label><p className="text-base text-gray-900">{selectedVendor.name}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-base text-gray-900">{selectedVendor.email}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Phone</label><p className="text-base text-gray-900">{selectedVendor.phone || '—'}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Address</label><p className="text-base text-gray-900">{selectedVendor.address || '—'}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Category</label><p className="text-base text-gray-900">{selectedVendor.category || '—'}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Payment Terms</label><p className="text-base text-gray-900">{selectedVendor.paymentTerms}</p></div>
                    </div>
                    {vendorPerf && (
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-800 mb-2">Performance</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-blue-900">
                          <div>On-time delivery: <strong>{vendorPerf.onTimeDeliveryRate}%</strong></div>
                          <div>Quality score: <strong>{vendorPerf.qualityScore}/5</strong></div>
                          <div>Total orders: <strong>{vendorPerf.totalOrders}</strong></div>
                          <div>Total spent: <strong>${(vendorPerf.totalSpent || 0).toLocaleString()}</strong></div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">POs on file</label>
                      <p className="text-base text-gray-900">{pos.filter((p) => p.vendorId === selectedVendor.id).length}</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 border-t mt-6">
                    <button onClick={() => { setSelectedVendor(null); setVendorPerf(null) }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="placed">Placed</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={() => { setPOForm({ vendorId: vendors[0]?.id || '', orderDate: new Date().toISOString().split('T')[0], expectedDeliveryDate: '', totalAmount: '', description: '' }); setShowCreatePO(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">+ Create PO</button>
          </div>

          {showCreatePO && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Purchase Order</h2>
                    <button onClick={() => setShowCreatePO(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <form onSubmit={handleCreatePO} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                      <select required value={poForm.vendorId} onChange={(e) => setPOForm({ ...poForm, vendorId: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select vendor</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label><input type="date" required value={poForm.orderDate} onChange={(e) => setPOForm({ ...poForm, orderDate: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label><input type="date" value={poForm.expectedDeliveryDate} onChange={(e) => setPOForm({ ...poForm, expectedDeliveryDate: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label><input type="number" required min="0" step="0.01" value={poForm.totalAmount} onChange={(e) => setPOForm({ ...poForm, totalAmount: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={poForm.description} onChange={(e) => setPOForm({ ...poForm, description: e.target.value })} placeholder="e.g., Q3 office supplies" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => setShowCreatePO(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Creating...' : 'Create PO'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Purchase Orders</h3>
            {loading && pos.length === 0 ? <p className="text-gray-600 text-center py-8">Loading...</p> : filteredPOs.length === 0 ? <p className="text-gray-600 text-center py-8">No POs found</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order / Expected</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPOs.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.poNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendorName(p.vendorId)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.orderDate}{p.expectedDeliveryDate ? ` → ${p.expectedDeliveryDate}` : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${p.totalAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(p.status)}`}>{p.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => handleViewPO(p.id)} className="text-blue-600 hover:text-blue-900">View</button>
                          {(p.status === 'draft' || p.status === 'pending_approval') && (
                            <button onClick={() => doPOAction(p.id, approvePurchaseOrder, 'PO approved.', 'Approve')} className="text-green-600 hover:text-green-900">Approve</button>
                          )}
                          {p.status === 'approved' && (
                            <button onClick={() => doPOAction(p.id, placePurchaseOrder, 'PO placed.', 'Place')} className="text-indigo-600 hover:text-indigo-900">Place</button>
                          )}
                          {p.status === 'placed' && (
                            <button onClick={() => doPOAction(p.id, receivePurchaseOrder, 'PO received.', 'Receive')} className="text-green-600 hover:text-green-900">Receive</button>
                          )}
                          {p.status !== 'received' && p.status !== 'cancelled' && (
                            <button onClick={() => { if (confirm('Cancel this PO?')) doPOAction(p.id, cancelPurchaseOrder, 'PO cancelled.', 'Cancel') }} className="text-red-600 hover:text-red-900">Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedPO && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Purchase Order</h2>
                    <button onClick={() => setSelectedPO(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">PO #</label><p className="text-base text-gray-900">{selectedPO.poNumber}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Vendor</label><p className="text-base text-gray-900">{vendorName(selectedPO.vendorId)}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Order Date</label><p className="text-base text-gray-900">{selectedPO.orderDate}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Expected</label><p className="text-base text-gray-900">{selectedPO.expectedDeliveryDate || '—'}</p></div>
                    </div>
                    <div><label className="text-sm font-medium text-gray-500">Total Amount</label><p className="text-base font-semibold text-gray-900">${selectedPO.totalAmount.toLocaleString()}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Status</label><p className="text-base"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(selectedPO.status)}`}>{selectedPO.status}</span></p></div>
                  </div>
                  <div className="flex justify-end pt-6 border-t mt-6">
                    <button onClick={() => setSelectedPO(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ModulePage>
  )
}
