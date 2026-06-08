import { useEffect, useState } from 'react'
import ModulePage from '../components/ModulePage'
import {
  getTransactions,
  getTransaction,
  createJournalEntry,
  getGeneralLedger,
  getTrialBalance,
} from '../services/api'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: string
  accountCode?: string
  reference?: string
}

interface LedgerAccount {
  code: string
  name: string
  balance: number
}

interface TrialBalance {
  date: string
  totalDebits: number
  totalCredits: number
  balanced: boolean
}

interface JournalLine {
  accountCode: string
  debit: string
  credit: string
  description: string
}

export default function AccountingModule() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ledger, setLedger] = useState<LedgerAccount[]>([])
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [showJournal, setShowJournal] = useState(false)
  const [activeTab, setActiveTab] = useState<'transactions' | 'ledger' | 'trial'>('transactions')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    entries: [
      { accountCode: '', debit: '', credit: '', description: '' },
      { accountCode: '', debit: '', credit: '', description: '' },
    ] as JournalLine[],
  })

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [tx, gl, tb] = await Promise.all([
        getTransactions(),
        getGeneralLedger(),
        getTrialBalance(),
      ])
      setTransactions(tx)
      setLedger(gl?.accounts ?? [])
      setTrialBalance(tb)
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load accounting data')
    } finally {
      setLoading(false)
    }
  }

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleView = async (id: string) => {
    try {
      setSelected(await getTransaction(id))
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load transaction')
    }
  }

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const entries = journalForm.entries
        .filter((l) => l.accountCode)
        .map((l) => ({
          accountCode: l.accountCode,
          debit: l.debit ? parseFloat(l.debit) : 0,
          credit: l.credit ? parseFloat(l.credit) : 0,
          description: l.description,
        }))
      await createJournalEntry({
        date: journalForm.date,
        description: journalForm.description,
        entries,
      })
      flash('Journal entry posted.')
      setShowJournal(false)
      setJournalForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        entries: [
          { accountCode: '', debit: '', credit: '', description: '' },
          { accountCode: '', debit: '', credit: '', description: '' },
        ],
      })
      loadAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create journal entry')
    } finally {
      setLoading(false)
    }
  }

  const totalDebits = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const filteredTx = typeFilter ? transactions.filter((t) => t.type === typeFilter) : transactions

  const addJournalLine = () => {
    setJournalForm({
      ...journalForm,
      entries: [...journalForm.entries, { accountCode: '', debit: '', credit: '', description: '' }],
    })
  }
  const updateJournalLine = (idx: number, field: keyof JournalLine, value: string) => {
    const next = [...journalForm.entries]
    next[idx] = { ...next[idx], [field]: value }
    setJournalForm({ ...journalForm, entries: next })
  }
  const removeJournalLine = (idx: number) => {
    if (journalForm.entries.length <= 2) return
    setJournalForm({ ...journalForm, entries: journalForm.entries.filter((_, i) => i !== idx) })
  }

  const journalDebitTotal = journalForm.entries.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
  const journalCreditTotal = journalForm.entries.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)

  return (
    <ModulePage title="Accounting" icon="📊" description="General ledger and financial transactions" calledBy={['Payroll', 'Billing', 'Procurement']}>
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{success}</div>}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-blue-500">
          <p className="text-sm font-medium text-gray-600">Transactions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{transactions.length}</p>
        </div>
        <div className="stat-card border-purple-500">
          <p className="text-sm font-medium text-gray-600">Total Debits</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">${totalDebits.toLocaleString()}</p>
        </div>
        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Total Credits</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">${totalCredits.toLocaleString()}</p>
        </div>
        <div className={`stat-card ${trialBalance?.balanced ? 'border-green-500' : 'border-red-500'}`}>
          <p className="text-sm font-medium text-gray-600">Trial Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{trialBalance ? (trialBalance.balanced ? 'Balanced' : 'Unbalanced') : '—'}</p>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {(['transactions', 'ledger', 'trial'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'trial' ? 'Trial Balance' : tab === 'ledger' ? 'General Ledger' : 'Transactions'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <button onClick={() => setShowJournal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              + Create Journal Entry
            </button>
          </div>

          {showJournal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Journal Entry</h2>
                    <button onClick={() => setShowJournal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <form onSubmit={handleCreateJournal} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input type="date" required value={journalForm.date} onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <input type="text" required value={journalForm.description} onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })} placeholder="e.g., May payroll expense" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Lines</label>
                        <button type="button" onClick={addJournalLine} className="text-sm text-blue-600 hover:text-blue-800">+ Add Line</button>
                      </div>
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 text-xs uppercase">
                            <th className="text-left pb-2">Account</th>
                            <th className="text-right pb-2">Debit</th>
                            <th className="text-right pb-2">Credit</th>
                            <th className="text-left pb-2 pl-3">Memo</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {journalForm.entries.map((line, idx) => (
                            <tr key={idx}>
                              <td className="pr-2 py-1">
                                <input type="text" value={line.accountCode} onChange={(e) => updateJournalLine(idx, 'accountCode', e.target.value)} placeholder="e.g., 5000" className="w-full border border-gray-300 rounded px-2 py-1" />
                              </td>
                              <td className="pr-2 py-1">
                                <input type="number" min="0" step="0.01" value={line.debit} onChange={(e) => updateJournalLine(idx, 'debit', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-right" />
                              </td>
                              <td className="pr-2 py-1">
                                <input type="number" min="0" step="0.01" value={line.credit} onChange={(e) => updateJournalLine(idx, 'credit', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-right" />
                              </td>
                              <td className="pl-3 py-1">
                                <input type="text" value={line.description} onChange={(e) => updateJournalLine(idx, 'description', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                              </td>
                              <td className="pl-2 py-1">
                                {journalForm.entries.length > 2 && (
                                  <button type="button" onClick={() => removeJournalLine(idx)} className="text-red-600 hover:text-red-800 text-sm">✕</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t font-medium">
                            <td className="pt-2">Totals</td>
                            <td className="pt-2 text-right">${journalDebitTotal.toLocaleString()}</td>
                            <td className="pt-2 text-right">${journalCreditTotal.toLocaleString()}</td>
                            <td colSpan={2} className={`pt-2 pl-3 text-xs ${Math.abs(journalDebitTotal - journalCreditTotal) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.abs(journalDebitTotal - journalCreditTotal) < 0.01 ? 'Balanced' : `Off by $${Math.abs(journalDebitTotal - journalCreditTotal).toLocaleString()}`}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => setShowJournal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">{loading ? 'Posting...' : 'Post Entry'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transactions</h3>
            {loading && transactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Loading...</p>
            ) : filteredTx.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No transactions found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTx.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{t.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${t.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'debit' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleView(t.id)} className="text-blue-600 hover:text-blue-900">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Transaction</h2>
                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-500">Date</label><p className="text-base text-gray-900">{selected.date}</p></div>
                    <div><label className="text-sm font-medium text-gray-500">Description</label><p className="text-base text-gray-900">{selected.description}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium text-gray-500">Amount</label><p className="text-base text-gray-900">${selected.amount.toLocaleString()}</p></div>
                      <div><label className="text-sm font-medium text-gray-500">Type</label><p className="text-base text-gray-900 capitalize">{selected.type}</p></div>
                    </div>
                    {selected.accountCode && <div><label className="text-sm font-medium text-gray-500">Account</label><p className="text-base text-gray-900">{selected.accountCode}</p></div>}
                    {selected.reference && <div><label className="text-sm font-medium text-gray-500">Reference</label><p className="text-base text-gray-900">{selected.reference}</p></div>}
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

      {activeTab === 'ledger' && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">General Ledger</h3>
          {ledger.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No ledger accounts found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ledger.map((a) => (
                  <tr key={a.code}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{a.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${a.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'trial' && trialBalance && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Trial Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-700">Total Debits</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">${trialBalance.totalDebits.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-700">Total Credits</p>
              <p className="text-2xl font-bold text-green-900 mt-1">${trialBalance.totalCredits.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-lg ${trialBalance.balanced ? 'bg-blue-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${trialBalance.balanced ? 'text-blue-700' : 'text-red-700'}`}>Status</p>
              <p className={`text-2xl font-bold mt-1 ${trialBalance.balanced ? 'text-blue-900' : 'text-red-900'}`}>{trialBalance.balanced ? 'Balanced' : 'Unbalanced'}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">As of {new Date(trialBalance.date).toLocaleString()}</p>
        </div>
      )}
    </ModulePage>
  )
}
