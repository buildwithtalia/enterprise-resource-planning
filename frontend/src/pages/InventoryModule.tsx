import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  receiveStock,
  getLowStockItems,
  getInventoryValuation,
  getInventoryCategories,
} from '../services/api'

interface InventoryItem {
  id: string
  sku: string
  name: string
  description: string
  category: string
  quantityOnHand: number
  availableQuantity: number
  reservedQuantity: number
  reorderPoint: number
  reorderQuantity: number
  unitPrice: number
  location: string
  status: string
}

interface Valuation {
  totalValue: number
  totalItems: number
  averageValue: number
  valuationDate?: string
}

interface CategoryRow {
  name: string
  itemCount: number
  totalValue: number
}

export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState<'items' | 'lowstock' | 'categories'>('items')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [lowStock, setLowStock] = useState<InventoryItem[]>([])
  const [valuation, setValuation] = useState<Valuation | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [itemForm, setItemForm] = useState({
    sku: '', name: '', description: '', category: '', unitPrice: '', quantityOnHand: '', reorderPoint: '10', reorderQuantity: '50', location: '',
  })

  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: 'increase' as 'increase' | 'decrease',
    quantity: '',
    reason: '',
  })

  const [receiveForm, setReceiveForm] = useState({
    quantity: '',
    purchaseOrderId: '',
  })

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [its, low, val, cats] = await Promise.all([
        getInventoryItems(),
        getLowStockItems(),
        getInventoryValuation(),
        getInventoryCategories(),
      ])
      setItems(its)
      setLowStock(low)
      setValuation(val)
      setCategories(cats)
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await createInventoryItem({
        ...itemForm,
        unitPrice: parseFloat(itemForm.unitPrice),
        quantityOnHand: parseInt(itemForm.quantityOnHand || '0', 10),
        reorderPoint: parseInt(itemForm.reorderPoint || '0', 10),
        reorderQuantity: parseInt(itemForm.reorderQuantity || '0', 10),
      })
      flash('Inventory item created.')
      setShowCreate(false)
      setItemForm({ sku: '', name: '', description: '', category: '', unitPrice: '', quantityOnHand: '', reorderPoint: '10', reorderQuantity: '50', location: '' })
      loadAll()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to create item') }
    finally { setLoading(false) }
  }

  const handleView = async (id: string) => {
    try { setSelected(await getInventoryItem(id)) } catch (e: any) { setError(e.response?.data?.message || 'Failed to load item') }
  }

  const handleEdit = (item: InventoryItem) => {
    setSelected(item)
    setItemForm({
      sku: item.sku,
      name: item.name,
      description: item.description,
      category: item.category,
      unitPrice: item.unitPrice.toString(),
      quantityOnHand: item.quantityOnHand.toString(),
      reorderPoint: item.reorderPoint.toString(),
      reorderQuantity: item.reorderQuantity.toString(),
      location: item.location,
    })
    setShowUpdate(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      setLoading(true)
      await updateInventoryItem(selected.id, {
        name: itemForm.name,
        description: itemForm.description,
        category: itemForm.category,
        unitPrice: parseFloat(itemForm.unitPrice),
        reorderPoint: parseInt(itemForm.reorderPoint || '0', 10),
        reorderQuantity: parseInt(itemForm.reorderQuantity || '0', 10),
        location: itemForm.location,
      })
      flash('Inventory item updated.')
      setShowUpdate(false)
      setSelected(null)
      loadAll()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to update item') }
    finally { setLoading(false) }
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      setLoading(true)
      await adjustStock({
        itemId: selected.id,
        adjustmentType: adjustForm.adjustmentType,
        quantity: parseInt(adjustForm.quantity, 10),
        reason: adjustForm.reason,
      })
      flash('Stock adjusted.')
      setShowAdjust(false)
      setSelected(null)
      setAdjustForm({ adjustmentType: 'increase', quantity: '', reason: '' })
      loadAll()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to adjust stock') }
    finally { setLoading(false) }
  }

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      setLoading(true)
      await receiveStock({
        itemId: selected.id,
        quantity: parseInt(receiveForm.quantity, 10),
        purchaseOrderId: receiveForm.purchaseOrderId || undefined,
      })
      flash('Stock received.')
      setShowReceive(false)
      setSelected(null)
      setReceiveForm({ quantity: '', purchaseOrderId: '' })
      loadAll()
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to receive stock') }
    finally { setLoading(false) }
  }

  const filtered = categoryFilter ? items.filter((i) => i.category === categoryFilter) : items
  const allCategories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)))
  const lowStockCount = lowStock.length

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      discontinued: 'bg-gray-100 text-gray-600',
      out_of_stock: 'bg-red-100 text-red-800',
    }
    return map[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <ModulePage title="Inventory" icon="📦" description="Stock management and automatic reordering" calls={['Procurement']}>
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{success}</div>}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-blue-500"><p className="text-sm font-medium text-gray-600">Total Items</p><p className="text-3xl font-bold text-gray-900 mt-2">{valuation?.totalItems ?? items.length}</p></div>
        <div className="stat-card border-green-500"><p className="text-sm font-medium text-gray-600">Total Value</p><p className="text-2xl font-bold text-gray-900 mt-2">${(valuation?.totalValue ?? 0).toLocaleString()}</p></div>
        <div className="stat-card border-red-500"><p className="text-sm font-medium text-gray-600">Low Stock</p><p className="text-3xl font-bold text-gray-900 mt-2">{lowStockCount}</p></div>
        <div className="stat-card border-purple-500"><p className="text-sm font-medium text-gray-600">Categories</p><p className="text-3xl font-bold text-gray-900 mt-2">{categories.length || allCategories.length}</p></div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('items')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>All Items ({items.length})</button>
          <button onClick={() => setActiveTab('lowstock')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'lowstock' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Low Stock ({lowStockCount})</button>
          <button onClick={() => setActiveTab('categories')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'categories' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Categories</button>
        </nav>
      </div>

      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={() => { setItemForm({ sku: '', name: '', description: '', category: '', unitPrice: '', quantityOnHand: '', reorderPoint: '10', reorderQuantity: '50', location: '' }); setShowCreate(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">+ Create Item</button>
          </div>

          {(showCreate || showUpdate) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{showUpdate ? 'Update Item' : 'Create Item'}</h2>
                    <button onClick={() => { setShowCreate(false); setShowUpdate(false); if (showUpdate) setSelected(null) }} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <form onSubmit={showUpdate ? handleUpdate : handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label><input type="text" required disabled={showUpdate} value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input type="text" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="e.g., Electronics" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} placeholder="e.g., Warehouse A / Bin 12" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label><input type="number" required min="0" step="0.01" value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      {!showUpdate && (
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label><input type="number" min="0" value={itemForm.quantityOnHand} onChange={(e) => setItemForm({ ...itemForm, quantityOnHand: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label><input type="number" min="0" value={itemForm.reorderPoint} onChange={(e) => setItemForm({ ...itemForm, reorderPoint: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label><input type="number" min="0" value={itemForm.reorderQuantity} onChange={(e) => setItemForm({ ...itemForm, reorderQuantity: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => { setShowCreate(false); setShowUpdate(false); if (showUpdate) setSelected(null) }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? (showUpdate ? 'Updating...' : 'Creating...') : (showUpdate ? 'Update Item' : 'Create Item')}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showAdjust && selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Adjust Stock</h2>
                    <button onClick={() => { setShowAdjust(false); setAdjustForm({ adjustmentType: 'increase', quantity: '', reason: '' }) }} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{selected.name} — currently {selected.quantityOnHand} on hand</p>
                  <form onSubmit={handleAdjust} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
                      <select required value={adjustForm.adjustmentType} onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value as 'increase' | 'decrease' })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="increase">Increase</option>
                        <option value="decrease">Decrease</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label><input type="number" required min="1" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><input type="text" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="e.g., Stock count correction" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => { setShowAdjust(false); setAdjustForm({ adjustmentType: 'increase', quantity: '', reason: '' }) }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Adjusting...' : 'Adjust'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showReceive && selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Receive Stock</h2>
                    <button onClick={() => { setShowReceive(false); setReceiveForm({ quantity: '', purchaseOrderId: '' }) }} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{selected.name} — currently {selected.quantityOnHand} on hand</p>
                  <form onSubmit={handleReceive} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label><input type="number" required min="1" value={receiveForm.quantity} onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">PO ID (optional)</label><input type="text" value={receiveForm.purchaseOrderId} onChange={(e) => setReceiveForm({ ...receiveForm, purchaseOrderId: e.target.value })} placeholder="e.g., po-002" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => { setShowReceive(false); setReceiveForm({ quantity: '', purchaseOrderId: '' }) }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Receiving...' : 'Receive Stock'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Items</h3>
            {loading && items.length === 0 ? <p className="text-gray-600 text-center py-8">Loading...</p> : filtered.length === 0 ? <p className="text-gray-600 text-center py-8">No items found</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">On Hand</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder At</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((i) => {
                      const isLow = i.quantityOnHand < i.reorderPoint
                      return (
                        <tr key={i.id} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{i.sku}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{i.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{i.category || '—'}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isLow ? 'font-bold text-red-700' : 'text-gray-900'}`}>{i.quantityOnHand}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{i.availableQuantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">{i.reorderPoint}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${i.unitPrice.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleView(i.id)} className="text-blue-600 hover:text-blue-900">View</button>
                            <button onClick={() => handleEdit(i)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                            <button onClick={() => { setSelected(i); setShowAdjust(true) }} className="text-purple-600 hover:text-purple-900">Adjust</button>
                            <button onClick={() => { setSelected(i); setShowReceive(true) }} className="text-green-600 hover:text-green-900">Receive</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && !showUpdate && !showAdjust && !showReceive && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Inventory Item</h2>
                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">SKU</label><p className="text-base font-mono text-gray-900">{selected.sku}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Name</label><p className="text-base text-gray-900">{selected.name}</p></div>
                    </div>
                    <div><label className="text-sm font-medium text-gray-500">Description</label><p className="text-base text-gray-900">{selected.description || '—'}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Category</label><p className="text-base text-gray-900">{selected.category || '—'}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Location</label><p className="text-base text-gray-900">{selected.location || '—'}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">On Hand</label><p className="text-base font-semibold text-gray-900">{selected.quantityOnHand}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Available</label><p className="text-base text-gray-900">{selected.availableQuantity}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Reserved</label><p className="text-base text-gray-900">{selected.reservedQuantity}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Unit Price</label><p className="text-base text-gray-900">${selected.unitPrice.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Reorder Point</label><p className="text-base text-gray-900">{selected.reorderPoint}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Reorder Qty</label><p className="text-base text-gray-900">{selected.reorderQuantity}</p></div>
                    </div>
                    <div><label className="text-sm font-medium text-gray-500">Status</label><p className="text-base"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(selected.status)}`}>{selected.status}</span></p></div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                    <button onClick={() => handleEdit(selected)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium">Edit</button>
                    <button onClick={() => setShowAdjust(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium">Adjust Stock</button>
                    <button onClick={() => setShowReceive(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">Receive</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'lowstock' && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Items Below Reorder Point</h3>
          {lowStock.length === 0 ? <p className="text-gray-600 text-center py-8">All items are above their reorder point.</p> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">On Hand</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Suggested Reorder</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStock.map((i) => (
                  <tr key={i.id} className="bg-red-50 hover:bg-red-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{i.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{i.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-700">{i.quantityOnHand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">{i.reorderPoint}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{i.reorderQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => { setSelected(i); setShowReceive(true) }} className="text-green-600 hover:text-green-900">Receive Stock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
          {categories.length === 0 ? <p className="text-gray-600 text-center py-8">No category data</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{c.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Items</span><span className="font-medium text-gray-900">{c.itemCount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Total value</span><span className="font-medium text-gray-900">${c.totalValue.toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card bg-yellow-50 border-2 border-yellow-200 mt-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">Cross-Coupling</h3>
        <p className="text-sm text-yellow-800">
          Inventory calls <code className="bg-yellow-100 px-2 py-1 rounded">ProcurementService</code> to auto-create a reorder PO when an item drops below its reorder point.
        </p>
      </div>
    </ModulePage>
  )
}
