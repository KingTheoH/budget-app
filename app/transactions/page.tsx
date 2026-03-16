'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  getTransactions, addTransaction, deleteTransaction,
  formatCurrency, Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES
} from '@/lib/store'

const EMPTY = { date: '', amount: '', type: 'expense' as const, category: 'Food', note: '', isRecurring: false }

export default function Transactions() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [open, setOpen] = useState(false)

  const load = () => setTxs([...getTransactions()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  useEffect(load, [])

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.amount) return
    addTransaction({ ...form, amount: parseFloat(form.amount) })
    setForm({ ...EMPTY })
    setOpen(false)
    load()
  }

  const handleDelete = (id: string) => {
    deleteTransaction(id)
    load()
  }

  const visible = txs.filter(t => filter === 'all' || t.type === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
              ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Transaction</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'income' | 'expense', category: e.target.value === 'income' ? 'Salary' : 'Food' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Amount (£)</label>
                  <input type="number" min="0" step="0.01" required value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Date</label>
                  <input type="date" required value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note (optional)</label>
                <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Grocery run" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                  Add
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {visible.length === 0 ? (
          <p className="text-gray-500 text-sm p-6">No transactions found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Note / Category</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(t => (
                <tr key={t.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <p>{t.note || '—'}</p>
                    <p className="text-xs text-gray-500">{t.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
