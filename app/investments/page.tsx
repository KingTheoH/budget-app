'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import {
  getInvestments, addInvestment, updateInvestment, deleteInvestment,
  formatCurrency, Investment
} from '@/lib/store'

const EMPTY = { name: '', ticker: '', shares: '', buyPrice: '', currentPrice: '' }

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [open, setOpen] = useState(false)
  const [editPrice, setEditPrice] = useState<{ id: string; price: string } | null>(null)

  const load = () => setInvestments(getInvestments())
  useEffect(load, [])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.shares || !form.buyPrice) return
    addInvestment({
      name: form.name,
      ticker: form.ticker.toUpperCase(),
      shares: parseFloat(form.shares),
      buyPrice: parseFloat(form.buyPrice),
      currentPrice: form.currentPrice ? parseFloat(form.currentPrice) : parseFloat(form.buyPrice),
    })
    setForm({ ...EMPTY })
    setOpen(false)
    load()
  }

  const handleUpdatePrice = (id: string, price: string) => {
    if (!price) return
    updateInvestment(id, { currentPrice: parseFloat(price) })
    setEditPrice(null)
    load()
  }

  const totalValue = investments.reduce((s, i) => s + i.shares * i.currentPrice, 0)
  const totalCost = investments.reduce((s, i) => s + i.shares * i.buyPrice, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Investments</h2>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Holding
        </button>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-gray-400 text-sm mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-gray-400 text-sm mb-1">Total Cost Basis</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalCost)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-gray-400 text-sm mb-1">Total Gain/Loss</p>
            <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
            </p>
            <p className={`text-xs mt-1 ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Holding</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Apple Inc." />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Ticker (optional)</label>
                  <input type="text" value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="e.g. AAPL" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Shares</label>
                  <input type="number" min="0" step="any" required value={form.shares}
                    onChange={e => setForm({ ...form, shares: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Buy Price (£)</label>
                  <input type="number" min="0" step="any" required value={form.buyPrice}
                    onChange={e => setForm({ ...form, buyPrice: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Current Price (£)</label>
                  <input type="number" min="0" step="any" value={form.currentPrice}
                    onChange={e => setForm({ ...form, currentPrice: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors">Add</button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {investments.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No holdings yet. Add stocks, ETFs, crypto, or any investment.</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Asset</th>
                <th className="text-right px-4 py-3">Shares</th>
                <th className="text-right px-4 py-3">Buy Price</th>
                <th className="text-right px-4 py-3">Current Price</th>
                <th className="text-right px-4 py-3">Value</th>
                <th className="text-right px-4 py-3">Gain/Loss</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => {
                const value = inv.shares * inv.currentPrice
                const cost = inv.shares * inv.buyPrice
                const gain = value - cost
                const gainPct = cost > 0 ? (gain / cost) * 100 : 0
                return (
                  <tr key={inv.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.name}</p>
                      {inv.ticker && <p className="text-xs text-gray-500">{inv.ticker}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{inv.shares}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(inv.buyPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      {editPrice?.id === inv.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input type="number" min="0" step="any" value={editPrice.price}
                            onChange={e => setEditPrice({ ...editPrice, price: e.target.value })}
                            className="w-24 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-right" />
                          <button onClick={() => handleUpdatePrice(inv.id, editPrice.price)}
                            className="text-xs bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-500">OK</button>
                          <button onClick={() => setEditPrice(null)}
                            className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditPrice({ id: inv.id, price: inv.currentPrice.toString() })}
                          className="text-gray-300 hover:text-white underline decoration-dashed underline-offset-2">
                          {formatCurrency(inv.currentPrice)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(value)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className={`flex items-center justify-end gap-1 ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="font-medium">{gain >= 0 ? '+' : ''}{formatCurrency(gain)}</span>
                      </div>
                      <p className={`text-xs ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { deleteInvestment(inv.id); load() }}
                        className="text-gray-600 hover:text-red-400 transition-colors">
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
