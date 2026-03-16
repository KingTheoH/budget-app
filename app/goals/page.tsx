'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Target } from 'lucide-react'
import { getGoals, addGoal, updateGoal, deleteGoal, formatCurrency, Goal } from '@/lib/store'

const card = 'bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm'
const inp = 'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
const lbl = 'text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block'

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#f43f5e', '#14b8a6', '#a855f7']
const EMPTY = { name: '', targetAmount: '', savedAmount: '', deadline: '', color: COLORS[0] }

function CircleProgress({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-slate-100 dark:text-gray-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editSaved, setEditSaved] = useState('')
  const [currency, setCurrency] = useState('GBP')

  const load = () => { setGoals(getGoals()); setCurrency(localStorage.getItem('currency') || 'GBP') }
  useEffect(() => {
    load()
    window.addEventListener('currency-change', load)
    return () => window.removeEventListener('currency-change', load)
  }, [])

  const fmt = (n: number) => formatCurrency(n, currency)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.targetAmount) return
    addGoal({ name: form.name, targetAmount: parseFloat(form.targetAmount), savedAmount: parseFloat(form.savedAmount) || 0, deadline: form.deadline || undefined, color: form.color })
    setForm({ ...EMPTY }); setOpen(false); load()
  }

  const handleUpdateSaved = (id: string) => {
    if (!editSaved) return
    updateGoal(id, { savedAmount: parseFloat(editSaved) })
    setEditId(null); load()
  }

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Goals</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{goals.length} goals · {fmt(totalSaved)} saved of {fmt(totalTarget)}</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">New Savings Goal</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className={lbl}>Goal Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inp} placeholder="e.g. Emergency Fund, Holiday, New Car" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Target Amount</label>
                  <input type="number" min="0" step="0.01" required value={form.targetAmount}
                    onChange={e => setForm({ ...form, targetAmount: e.target.value })} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={lbl}>Already Saved</label>
                  <input type="number" min="0" step="0.01" value={form.savedAmount}
                    onChange={e => setForm({ ...form, savedAmount: e.target.value })} className={inp} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className={lbl}>Target Date (optional)</label>
                <input type="date" value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Colour</label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : ''}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-sm">Add Goal</button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <Target size={40} className="mx-auto mb-4 text-slate-300 dark:text-gray-600" />
          <p className="text-slate-500 dark:text-gray-400 font-medium">No goals yet</p>
          <p className="text-slate-400 dark:text-gray-500 text-sm mt-1">Add a savings goal to start tracking your progress</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0
            const remaining = g.targetAmount - g.savedAmount
            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null
            return (
              <div key={g.id} className={`${card} p-5`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CircleProgress pct={pct} color={g.color} size={72} />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{g.name}</h3>
                      <p className="text-2xl font-bold mt-0.5" style={{ color: g.color }}>{pct.toFixed(0)}%</p>
                    </div>
                  </div>
                  <button onClick={() => { deleteGoal(g.id); load() }}
                    className="text-slate-300 dark:text-gray-600 hover:text-red-500 transition-colors mt-1">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">Saved</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{fmt(g.savedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">Target</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{fmt(g.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">Remaining</span>
                    <span className={`font-semibold ${remaining <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-gray-200'}`}>
                      {remaining <= 0 ? '🎉 Complete!' : fmt(remaining)}
                    </span>
                  </div>
                  {daysLeft !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400">Days left</span>
                      <span className={`font-semibold ${daysLeft < 0 ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-slate-700 dark:text-gray-300'}`}>
                        {daysLeft < 0 ? 'Overdue' : `${daysLeft}d`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Update saved amount inline */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                  {editId === g.id ? (
                    <div className="flex gap-2">
                      <input type="number" min="0" step="0.01" value={editSaved}
                        onChange={e => setEditSaved(e.target.value)}
                        className={inp} placeholder="New saved amount" autoFocus />
                      <button onClick={() => handleUpdateSaved(g.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-medium">Save</button>
                      <button onClick={() => setEditId(null)}
                        className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditId(g.id); setEditSaved(g.savedAmount.toString()) }}
                      className="w-full text-sm text-center text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white font-medium py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                      Update saved amount
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
