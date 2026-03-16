'use client'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  getCurrentMonthTransactions, getTransactions, getBudgets, getInvestments,
  formatCurrency, Transaction, Budget, Investment
} from '@/lib/store'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#14b8a6', '#a855f7', '#f97316']

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [allTxs, setAllTxs] = useState<Transaction[]>([])

  useEffect(() => {
    setTxs(getCurrentMonthTransactions())
    setBudgets(getBudgets())
    setInvestments(getInvestments())
    setAllTxs(getTransactions())
  }, [])

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = income - expenses

  const byCategory: Record<string, number> = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  })
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  const now = new Date()
  const last6: { month: string; income: number; expenses: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth(); const y = d.getFullYear()
    const monthTxs = allTxs.filter(t => {
      const td = new Date(t.date)
      return td.getMonth() === m && td.getFullYear() === y
    })
    last6.push({
      month: d.toLocaleString('default', { month: 'short' }),
      income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    })
  }

  const portfolioValue = investments.reduce((s, i) => s + i.shares * i.currentPrice, 0)
  const costBasis = investments.reduce((s, i) => s + i.shares * i.buyPrice, 0)
  const portfolioGain = portfolioValue - costBasis

  const recent = [...allTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="This Month Income" value={formatCurrency(income)} color="text-green-400" />
        <StatCard label="This Month Expenses" value={formatCurrency(expenses)} color="text-red-400" />
        <StatCard label="Net Balance" value={formatCurrency(net)} color={net >= 0 ? 'text-green-400' : 'text-red-400'} />
        <StatCard label="Portfolio Value" value={formatCurrency(portfolioValue)}
          sub={`${portfolioGain >= 0 ? '+' : ''}${formatCurrency(portfolioGain)} gain`}
          color={portfolioGain >= 0 ? 'text-green-400' : 'text-red-400'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Income vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6} barSize={16}>
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Spending by Category</h3>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-sm mt-10 text-center">No expenses this month</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                  formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {budgets.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Budget Progress</h3>
          <div className="space-y-3">
            {budgets.map(b => {
              const spent = byCategory[b.category] ?? 0
              const pct = Math.min((spent / b.monthlyLimit) * 100, 100)
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{b.category}</span>
                    <span className={spent > b.monthlyLimit ? 'text-red-400' : 'text-gray-400'}>
                      {formatCurrency(spent)} / {formatCurrency(b.monthlyLimit)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Recent Transactions</h3>
        {recent.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet. Add one in Transactions.</p>
        ) : (
          <div className="space-y-2">
            {recent.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.note || t.category}</p>
                  <p className="text-xs text-gray-500">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
