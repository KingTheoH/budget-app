'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  getBudgets, upsertBudget, deleteBudget, getCurrentMonthTransactions,
  formatCurrency, Budget, EXPENSE_CATEGORIES
} from '@/lib/store'

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [limit, setLimit] = useState('')
  const [open, setOpen] = useState(false)

  const load = () => setBudgets(getBudgets())
  useEffect(load, [])

  const txs = getCurrentMonthTransactions().filter(t => t.type === 'expense')
  const spentByCategory: Record<string, number> = {}
  txs.forEach(t => { spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + t.amount })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!limit) return
    upsertBudget({ category, monthlyLimit: parseFloat(limit) })
    setLimit('')
    setCategory(EXPENSE_CATEGORIES[0])
    setOpen(false)
    load()
  }

  const unusedCategories = EXPENSE_CATEGORIES.filter(c => !budgets.find(b => b.category === c))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Budget</h2>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Set Monthly Budget</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                  {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Monthly Limit (£)</label>
                <input type="number" min="0" step="0.01" required value={limit}
                  onChange={e => setLimit(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                  Save
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

      {budgets.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No budgets set. Click &ldquo;Set Budget&rdquo; to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => {
            const spent = spentByCategory[b.category] ?? 0
            const pct = Math.min((spent / b.monthlyLimit) * 100, 100)
            const remaining = b.monthlyLimit - spent
            return (
              <div key={b.category} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{b.category}</h3>
                    <p className="text-xs text-gray-500">Monthly limit: {formatCurrency(b.monthlyLimit)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${spent > b.monthlyLimit ? 'text-red-400' : 'text-white'}`}>
                        {formatCurrency(spent)} spent
                      </p>
                      <p className={`text-xs ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
                      </p>
                    </div>
                    <button onClick={() => { deleteBudget(b.category); load() }}
                      className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className={pct >= 100 ? 'text-red-400 font-medium' : ''}>{pct.toFixed(0)}%</span>
                  <span>100%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {unusedCategories.length > 0 && budgets.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Categories without a budget</h3>
          <div className="flex flex-wrap gap-2">
            {unusedCategories.map(c => (
              <span key={c} className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
