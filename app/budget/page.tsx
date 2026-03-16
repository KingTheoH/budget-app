'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  getBudgets, upsertBudget, deleteBudget, getCurrentMonthTransactions,
  formatCurrency, Budget, EXPENSE_CATEGORIES
} from '@/lib/store'

const card = 'bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm'
const inputCls = 'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
const labelCls = 'text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block'

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [limit, setLimit] = useState('')
  const [open, setOpen] = useState(false)
  const [currency, setCurrency] = useState('GBP')

  const load = () => {
    setBudgets(getBudgets())
    setCurrency(localStorage.getItem('currency') || 'GBP')
  }
  useEffect(() => {
    load()
    window.addEventListener('currency-change', load)
    return () => window.removeEventListener('currency-change', load)
  }, [])

  const txs = getCurrentMonthTransactions().filter(t => t.type === 'expense')
  const spentByCategory: Record<string, number> = {}
  txs.forEach(t => { spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + t.amount })
  const fmt = (n: number) => formatCurrency(n, currency)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!limit) return
    upsertBudget({ category, monthlyLimit: parseFloat(limit) })
    setLimit(''); setCategory(EXPENSE_CATEGORIES[0]); setOpen(false); load()
  }

  const unusedCategories = EXPENSE_CATEGORIES.filter(c => !budgets.find(b => b.category === c))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Budget</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{budgets.length} categories tracked</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Set Monthly Budget</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className={labelCls}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Monthly Limit</label>
                <input type="number" min="0" step="0.01" required value={limit}
                  onChange={e => setLimit(e.target.value)} className={inputCls} placeholder="0.00" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-sm">Save</button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-slate-400 dark:text-gray-500">No budgets set. Click &ldquo;Set Budget&rdquo; to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => {
            const spent = spentByCategory[b.category] ?? 0
            const pct = Math.min((spent / b.monthlyLimit) * 100, 100)
            const remaining = b.monthlyLimit - spent
            return (
              <div key={b.category} className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{b.category}</h3>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Limit: {fmt(b.monthlyLimit)}/mo</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${spent > b.monthlyLimit ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                        {fmt(spent)} spent
                      </p>
                      <p className={`text-xs font-medium ${remaining < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {remaining < 0 ? `${fmt(Math.abs(remaining))} over` : `${fmt(remaining)} left`}
                      </p>
                    </div>
                    <button onClick={() => { deleteBudget(b.category); load() }}
                      className="text-slate-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 dark:text-gray-500 mt-1.5">
                  <span>0%</span>
                  <span className={pct >= 100 ? 'text-red-500 font-semibold' : ''}>{pct.toFixed(0)}%</span>
                  <span>100%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {unusedCategories.length > 0 && budgets.length > 0 && (
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3">No budget set for</h3>
          <div className="flex flex-wrap gap-2">
            {unusedCategories.map(c => (
              <span key={c} className="px-3 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs text-slate-500 dark:text-gray-400">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
