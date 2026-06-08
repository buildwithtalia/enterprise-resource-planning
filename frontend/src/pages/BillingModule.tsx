import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  getInvoices,
  getInvoice,
  createInvoice,
  sendInvoice,
  recordInvoicePayment,
  cancelInvoice,
} from '../services/api'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  creditLimit: number
  currentBalance: number
  paymentTerms: string
  status: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  issueDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  status: string
  items: any[]
}

export default function BillingModule() {
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices'>('customers')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: '',
    paymentTerms: 'Net 30',
  })

  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    issueDate: '',
    dueDate: '',
    subtotal: '',
    description: '',
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: '',
    paymentMethod: 'bank_transfer',
  })

  useEffect(() => {
    loadCustomers()
    loadInvoices()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await getCustomers()
      setCustomers(data)
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await getInvoices()
      setInvoices(data)
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const flashSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await createCustomer({
        ...customerForm,
        creditLimit: customerForm.creditLimit ? parseFloat(customerForm.creditLimit) : 0,
      })
      flashSuccess('Customer created successfully!')
      setShowCreateCustomer(false)
      setCustomerForm({ name: '', email: '', phone: '', address: '', creditLimit: '', paymentTerms: 'Net 30' })
      loadCustomers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCustomer = async (id: string) => {
    try {
      const data = await getCustomer(id)
      setSelectedCustomer(data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load customer details')
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const subtotal = parseFloat(invoiceForm.subtotal || '0')
      await createInvoice({
        customerId: invoiceForm.customerId,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        subtotal,
        items: invoiceForm.description
          ? [{ description: invoiceForm.description, quantity: 1, unitPrice: subtotal, total: subtotal }]
          : [],
      })
      flashSuccess('Invoice created successfully!')
      setShowCreateInvoice(false)
      setInvoiceForm({ customerId: '', issueDate: '', dueDate: '', subtotal: '', description: '' })
      loadInvoices()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleViewInvoice = async (id: string) => {
    try {
      const data = await getInvoice(id)
      setSelectedInvoice(data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load invoice details')
    }
  }

  const handleSendInvoice = async (id: string) => {
    try {
      setLoading(true)
      await sendInvoice(id)
      flashSuccess('Invoice sent to customer!')
      loadInvoices()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to send invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvoice = async (id: string) => {
    if (!confirm('Cancel this invoice? This cannot be undone.')) return
    try {
      setLoading(true)
      await cancelInvoice(id)
      flashSuccess('Invoice cancelled.')
      loadInvoices()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to cancel invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentForm({
      amount: invoice.balanceDue.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
    })
    setShowRecordPayment(true)
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return
    try {
      setLoading(true)
      await recordInvoicePayment(selectedInvoice.id, {
        amount: parseFloat(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
      })
      flashSuccess(`Payment of $${parseFloat(paymentForm.amount).toLocaleString()} recorded.`)
      setShowRecordPayment(false)
      setSelectedInvoice(null)
      loadInvoices()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const customerNameById = (id: string) => customers.find((c) => c.id === id)?.name || id

  const filteredInvoices = statusFilter
    ? invoices.filter((i) => i.status === statusFilter)
    : invoices

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-600',
      suspended: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0)
  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + i.balanceDue, 0)
  const paidCount = invoices.filter((i) => i.status === 'paid').length
  const sentCount = invoices.filter((i) => i.status === 'sent').length
  const today = new Date().toISOString().split('T')[0]
  const overdueCount = invoices.filter(
    (i) => i.status !== 'paid' && i.status !== 'cancelled' && i.dueDate && i.dueDate < today
  ).length

  return (
    <ModulePage
      title="Billing"
      icon="🧾"
      description="Invoicing and customer billing"
      calls={['Accounting']}
    >
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{customers.length}</p>
        </div>
        <div className="stat-card border-yellow-500">
          <p className="text-sm font-medium text-gray-600">Sent / Pending</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{sentCount}</p>
        </div>
        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{paidCount}</p>
        </div>
        <div className="stat-card border-red-500">
          <p className="text-sm font-medium text-gray-600">Overdue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{overdueCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invoices ({invoices.length})
          </button>
        </nav>
      </div>

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateCustomer(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Create Customer
            </button>
          </div>

          {showCreateCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Customer</h2>
                    <button
                      onClick={() => setShowCreateCustomer(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleCreateCustomer} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={customerForm.creditLimit}
                          onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                        <select
                          value={customerForm.paymentTerms}
                          onChange={(e) => setCustomerForm({ ...customerForm, paymentTerms: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Net 15</option>
                          <option>Net 30</option>
                          <option>Net 60</option>
                          <option>Due on receipt</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateCustomer(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create Customer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customers</h3>
            {loading && customers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Loading customers...</p>
            ) : customers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No customers found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${c.currentBalance.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${c.creditLimit.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleViewCustomer(c.id)} className="text-blue-600 hover:text-blue-900">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-500">Name</label><p className="text-base text-gray-900">{selectedCustomer.name}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-base text-gray-900">{selectedCustomer.email}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Phone</label><p className="text-base text-gray-900">{selectedCustomer.phone || '—'}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Address</label><p className="text-base text-gray-900">{selectedCustomer.address || '—'}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Current Balance</label><p className="text-base text-gray-900">${selectedCustomer.currentBalance.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Credit Limit</label><p className="text-base text-gray-900">${selectedCustomer.creditLimit.toLocaleString()}</p></div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="text-base">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(selectedCustomer.status)}`}>
                          {selectedCustomer.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Invoices</label>
                      <p className="text-base text-gray-900">
                        {invoices.filter((i) => i.customerId === selectedCustomer.id).length} on file
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 border-t mt-6">
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={() => {
                setInvoiceForm({
                  customerId: customers[0]?.id || '',
                  issueDate: new Date().toISOString().split('T')[0],
                  dueDate: '',
                  subtotal: '',
                  description: '',
                })
                setShowCreateInvoice(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Create Invoice
            </button>
          </div>

          {showCreateInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Invoice</h2>
                    <button
                      onClick={() => setShowCreateInvoice(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleCreateInvoice} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                      <select
                        required
                        value={invoiceForm.customerId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select customer</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                        <input
                          type="date"
                          required
                          value={invoiceForm.issueDate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                        <input
                          type="date"
                          required
                          value={invoiceForm.dueDate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={invoiceForm.subtotal}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tax (8%) is added automatically.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={invoiceForm.description}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                        placeholder="e.g., Q2 consulting services"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateInvoice(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create Invoice'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showRecordPayment && selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
                    <button
                      onClick={() => {
                        setShowRecordPayment(false)
                        setSelectedInvoice(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                    <p><strong>Customer:</strong> {customerNameById(selectedInvoice.customerId)}</p>
                    <p><strong>Balance Due:</strong> ${selectedInvoice.balanceDue.toLocaleString()}</p>
                  </div>
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                      <input
                        type="date"
                        required
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                      <select
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="check">Check</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="ach">ACH</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecordPayment(false)
                          setSelectedInvoice(null)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Recording...' : 'Record Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Invoices</h3>
            {loading && invoices.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Loading invoices...</p>
            ) : filteredInvoices.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No invoices found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue / Due</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((inv) => {
                      const isOverdue =
                        inv.status !== 'paid' && inv.status !== 'cancelled' && inv.dueDate && inv.dueDate < today
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customerNameById(inv.customerId)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {inv.issueDate} → {inv.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${inv.totalAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${inv.balanceDue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(isOverdue ? 'overdue' : inv.status)}`}>
                              {isOverdue ? 'overdue' : inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button onClick={() => handleViewInvoice(inv.id)} className="text-blue-600 hover:text-blue-900">
                              View
                            </button>
                            {inv.status === 'draft' && (
                              <button onClick={() => handleSendInvoice(inv.id)} className="text-indigo-600 hover:text-indigo-900">
                                Send
                              </button>
                            )}
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                              <button onClick={() => handleOpenPayment(inv)} className="text-green-600 hover:text-green-900">
                                Pay
                              </button>
                            )}
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                              <button onClick={() => handleCancelInvoice(inv.id)} className="text-red-600 hover:text-red-900">
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedInvoice && !showRecordPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Invoice #</label><p className="text-base text-gray-900">{selectedInvoice.invoiceNumber}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Customer</label><p className="text-base text-gray-900">{customerNameById(selectedInvoice.customerId)}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Issue Date</label><p className="text-base text-gray-900">{selectedInvoice.issueDate || '—'}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Due Date</label><p className="text-base text-gray-900">{selectedInvoice.dueDate || '—'}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Subtotal</label><p className="text-base text-gray-900">${selectedInvoice.subtotal.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Tax</label><p className="text-base text-gray-900">${selectedInvoice.taxAmount.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Total</label><p className="text-base font-semibold text-gray-900">${selectedInvoice.totalAmount.toLocaleString()}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Paid</label><p className="text-base text-gray-900">${selectedInvoice.paidAmount.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Balance Due</label><p className="text-base font-semibold text-gray-900">${selectedInvoice.balanceDue.toLocaleString()}</p></div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="text-base">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(selectedInvoice.status)}`}>
                          {selectedInvoice.status}
                        </span>
                      </p>
                    </div>
                    {selectedInvoice.items?.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Items</label>
                        <ul className="mt-1 list-disc list-inside text-sm text-gray-900">
                          {selectedInvoice.items.map((it: any, idx: number) => (
                            <li key={idx}>
                              {it.description || 'Item'} — qty {it.quantity ?? 1} @ ${Number(it.unitPrice ?? 0).toLocaleString()} = ${Number(it.total ?? 0).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedInvoice.status === 'draft' && (
                      <button
                        onClick={() => {
                          handleSendInvoice(selectedInvoice.id)
                          setSelectedInvoice(null)
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                      >
                        Send Invoice
                      </button>
                    )}
                    {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                      <button
                        onClick={() => handleOpenPayment(selectedInvoice)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cross-Coupling */}
      <div className="card bg-yellow-50 border-2 border-yellow-200 mt-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">Cross-Coupling</h3>
        <p className="text-sm text-yellow-800">
          Billing calls <code className="bg-yellow-100 px-2 py-1 rounded">AccountingService</code> to record revenue when invoices are paid.
        </p>
      </div>
    </ModulePage>
  )
}
