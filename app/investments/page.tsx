'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from '@/lib/theme-context'
import {
  getInvestments, addInvestment, updateInvestment, deleteInvestment, saveInvestments,
  getPortfolioSnapshots, addPortfolioSnapshot,
  formatCurrency, Investment
} from '@/lib/store'

const card = 'bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm'
const inp = 'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
const lbl = 'text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block'

const EMPTY = { name: '', ticker: '', shares: '', buyPrice: '', currentPrice: '' }

export default function InvestmentsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [investments, setInvestments] = useState<Investment[]>([])
  const [snapshots, setSnapshots] = useState<{ date: string; value: number }[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [open, setOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')
  const [currency, setCurrency] = useState('GBP')

  const load = () => {
    const inv = getInvestments()
    setInvestments(inv)
    setSnapshots(getPortfolioSnapshots())
    setCurrency(localStorage.getItem('currency') || 'GBP')
    // Auto-snapshot today's value
    if (inv.length > 0) {
      const val = inv.reduce((s, i) => s + i.shares * i.currentPrice, 0)
      addPortfolioSnapshot(val)
      setSnapshots(getPortfolioSnapshots())
    }
  }

  useEffect(() => {
    load()
    window.addEventListener('currency-change', load)
    return () => window.removeEventListener('currency-change', load)
  }, [])

  const fmt = (n: number) => formatCurrency(n, currency)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.shares || !form.buyPrice) return
    addInvestment({
      name: form.name, ticker: form.ticker.toUpperCase(),
      shares: parseFloat(form.shares), buyPrice: parseFloat(form.buyPrice),
      currentPrice: form.currentPrice ? parseFloat(form.currentPrice) : parseFloat(form.buyPrice),
    })
    setForm({ ...EMPTY }); setOpen(false); load()
  }

  const handleRefreshPrices = async () => {
    const withTickers = investments.filter(i => i.ticker)
    if (withTickers.length === 0) { setRefreshMsg('No tickers to refresh. Add ticker symbols to your holdings.'); return }
    setRefreshing(true); setRefreshMsg('')
    let updated = 0
    const all = [...investments]
    for (const inv of withTickers) {
      try {
        const res = await fetch(`/api/stock-price?ticker=${encodeURIComponent(inv.ticker)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.price) {
            const idx = all.findIndex(i => i.id === inv.id)
            if (idx >= 0) { all[idx] = { ...all[idx], currentPrice: data.price }; updated++ }
          }
        }
      } catch { /* skip */ }
    }
    saveInvestments(all); load()
    setRefreshing(false)
    setRefreshMsg(`Updated ${updated} of ${withTickers.length} holdings`)
    setTimeout(() => setRefreshMsg(''), 4000)
  }

  const totalValue = investments.reduce((s, i) => s + i.shares * i.currentPrice, 0)
  const totalCost = investments.reduce((s, i) => s + i.shares * i.buyPrice, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const chartData = snapshots.map(s => ({ date: new Date(s.date).toLocaleDateString('default', { month: 'short', day: 'numeric' }), value: s.value }))
  const tooltipStyle = { background: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`, borderRadius: 8, color: isDark ? '#fff' : '#0f172a' }
  const axisColor = isDark ? '#6b7280' : '#94a3b8'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Investments</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{investments.length} holdings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefreshPrices} disabled={refreshing}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus size={16} /> Add Holding
          </button>
        </div>
      </div>

      {refreshMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          {refreshMsg}
        </div>
      )}

      {investments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Portfolio Value', value: fmt(totalValue), accent: 'text-slate-900 dark:text-white' },
            { label: 'Cost Basis', value: fmt(totalCost), accent: 'text-slate-900 dark:text-white' },
            { label: 'Total Gain/Loss', value: `${totalGain >= 0 ? '+' : ''}${fmt(totalGain)}`, sub: `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`, accent: totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' }
          ].map(s => (
            <div key={s.label} className={`${card} p-5`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              {s.sub && <p className={`text-xs mt-1 ${s.accent}`}>{s.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Portfolio net worth line chart */}
      {chartData.length > 1 && (
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4">Portfolio Net Worth Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f1f5f9'} />
              <XAxis dataKey="date" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={false} name="Value" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add Holding</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className={inp} placeholder="e.g. Apple Inc." />
                </div>
                <div>
                  <label className={lbl}>Ticker (for live prices)</label>
                  <input type="text" value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })}
                    className={inp} placeholder="e.g. AAPL" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Shares</label>
                  <input type="number" min="0" step="any" required value={form.shares}
                    onChange={e => setForm({ ...form, shares: e.target.value })} className={inp} placeholder="0" />
                </div>
                <div>
                  <label className={lbl}>Buy Price</label>
                  <input type="number" min="0" step="any" required value={form.buyPrice}
                    onChange={e => setForm({ ...form, buyPrice: e.target.value })} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={lbl}>Current Price</label>
                  <input type="number" min="0" step="any" value={form.currentPrice}
                    onChange={e => setForm({ ...form, currentPrice: e.target.value })} className={inp} placeholder="Optional" />
                </div>
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

      {investments.length === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-slate-400 dark:text-gray-500">No holdings yet. Add stocks, ETFs, crypto, or any investment.</p>
        </div>
      ) : (
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-400 dark:text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Asset</th>
                <th className="text-right px-5 py-3">Shares</th>
                <th className="text-right px-5 py-3">Buy Price</th>
                <th className="text-right px-5 py-3">Current</th>
                <th className="text-right px-5 py-3">Value</th>
                <th className="text-right px-5 py-3">Gain/Loss</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => {
                const value = inv.shares * inv.currentPrice
                const cost = inv.shares * inv.buyPrice
                const gain = value - cost
                const gainPct = cost > 0 ? (gain / cost) * 100 : 0
                return (
                  <tr key={inv.id} className="border-b border-slate-50 dark:border-gray-800 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-gray-200">{inv.name}</p>
                      {inv.ticker && <p className="text-xs text-slate-400 dark:text-gray-500 font-mono">{inv.ticker}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500 dark:text-gray-400">{inv.shares}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500 dark:text-gray-400">{fmt(inv.buyPrice)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-800 dark:text-gray-200 font-medium">{fmt(inv.currentPrice)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800 dark:text-gray-200">{fmt(value)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className={`flex items-center justify-end gap-1 ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {gain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="font-semibold">{gain >= 0 ? '+' : ''}{fmt(gain)}</span>
                      </div>
                      <p className={`text-xs ${gain >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => { deleteInvestment(inv.id); load() }}
                        className="text-slate-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
