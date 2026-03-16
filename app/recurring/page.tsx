'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import {
  getRecurring, addRecurring, deleteRecurring,
  formatCurrency, RecurringTransaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES
} from '@/lib/store'

const card = 'bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm'
const inp = 'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
const lbl = 'text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block'

const EMPTY = {
  name: '', amount: '', type: 'expense' as const,
  category: 'Housing', frequency: 'monthly' as const, nextDate: ''
}

const FREQ_LABEL: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly'
}

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [open, setOpen] = useState(false)
  const [currency, setCurrency] = useState('GBP')

  const load = () => { setItems(getRecurring()); setCurrency(localStorage.getItem('currency') || 'GBP') }
  useEffect(() => {
    load()
    window.addEventListener('currency-change', load)
    return () => window.removeEventListener('currency-change', load)
  }, [])

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const fmt = (n: number) => formatCurrency(n, currency)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.amount || !form.nextDate) return
    addRecurring({ ...form, amount: parseFloat(form.amount) })
    setForm({ ...EMPTY }); setOpen(false); load()
  }

  const monthlyTotal = items.reduce((s, r) => {
    const m = r.frequency === 'daily' ? r.amount * 30 : r.frequency === 'weekly' ? r.amount * 4.33
      : r.frequency === 'monthly' ? r.amount : r.amount / 12
    return r.type === 'expense' ? s + m : s
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recurring</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{items.length} items</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Add Recurring
        </button>
      </div>

      {items.length > 0 && (
        <div className={`${card} p-4`}>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Estimated monthly recurring expenses: <span className="text-red-500 dark:text-red-400 font-semibold">{fmt(monthlyTotal)}</span>
          </p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">New Recurring Transaction</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className={lbl}>Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inp} placeholder="e.g. Netflix, Rent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'income' | 'expense', category: e.target.value === 'income' ? 'Salary' : 'Housing' })} className={inp}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inp}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Amount</label>
                  <input type="number" min="0" step="0.01" required value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={lbl}>Frequency</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value as RecurringTransaction['frequency'] })} className={inp}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Next Date</label>
                <input type="date" required value={form.nextDate}
                  onChange={e => setForm({ ...form, nextDate: e.target.value })} className={inp} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-sm">Add</button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-slate-400 dark:text-gray-500">No recurring transactions. Add rent, subscriptions, salary, etc.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(r => (
            <div key={r.id} className={`${card} p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${r.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <RefreshCw size={16} className={r.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'} />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-gray-200">{r.name}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">{r.category} · {FREQ_LABEL[r.frequency]} · Next: {new Date(r.nextDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-semibold ${r.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                </span>
                <button onClick={() => { deleteRecurring(r.id); load() }}
                  className="text-slate-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
