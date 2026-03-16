'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  getTransactions, addTransaction, deleteTransaction,
  formatCurrency, Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES
} from '@/lib/store'

// light/dark shared styles
const card = 'bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm'
const input = 'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
const label = 'text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block'

const EMPTY = { date: '', amount: '', type: 'expense' as const, category: 'Food', note: '', isRecurring: false }

export default function Transactions() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [open, setOpen] = useState(false)
  const [currency, setCurrency] = useState('GBP')

  const load = () => {
    setTxs([...getTransactions()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    setCurrency(localStorage.getItem('currency') || 'GBP')
  }
  useEffect(() => {
    load()
    window.addEventListener('currency-change', load)
    return () => window.removeEventListener('currency-change', load)
  }, [])

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const fmt = (n: number) => formatCurrency(n, currency)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.amount) return
    addTransaction({ ...form, amount: parseFloat(form.amount) })
    setForm({ ...EMPTY })
    setOpen(false)
    load()
  }

  const visible = txs.filter(t => filter === 'all' || t.type === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{txs.length} total</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all
              ${filter === f ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700 hover:text-slate-900 dark:hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">New Transaction</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'income' | 'expense', category: e.target.value === 'income' ? 'Salary' : 'Food' })}
                    className={input}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={input}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Amount</label>
                  <input type="number" min="0" step="0.01" required value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className={input} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" required value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} className={input} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Note (optional)</label>
                <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                  className={input} placeholder="e.g. Grocery run" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">Add</button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        {visible.length === 0 ? (
          <p className="text-slate-400 dark:text-gray-500 text-sm p-6">No transactions found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-400 dark:text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Note / Category</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(t => (
                <tr key={t.id} className="border-b border-slate-50 dark:border-gray-800 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400 dark:text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-800 dark:text-gray-200 font-medium">{t.note || '—'}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">{t.category}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => { deleteTransaction(t.id); load() }} className="text-slate-300 dark:text-gray-600 hover:text-red-500 transition-colors">
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
