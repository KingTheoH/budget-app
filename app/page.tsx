'use client'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { ResponsiveSankey } from '@nivo/sankey'
import { useTheme } from '@/lib/theme-context'
import {
  getCurrentMonthTransactions, getTransactions, getBudgets, getInvestments,
  formatCurrency, Transaction, Budget, Investment
} from '@/lib/store'

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#f43f5e', '#14b8a6', '#a855f7', '#f97316', '#84cc16']

const card = 'bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm'

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className={`${card} p-5`}>
      <p className="text-slate-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [txs, setTxs] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [allTxs, setAllTxs] = useState<Transaction[]>([])
  const [chartView, setChartView] = useState<'pie' | 'sankey'>('pie')
  const [currency, setCurrency] = useState('GBP')

  const load = () => {
    setTxs(getCurrentMonthTransactions())
    setBudgets(getBudgets())
    setInvestments(getInvestments())
    setAllTxs(getTransactions())
    setCurrency(localStorage.getItem('currency') || 'GBP')
  }

  useEffect(() => {
    load()
    window.addEventListener('currency-change', load)
    return () => window.removeEventListener('currency-change', load)
  }, [])

  const fmt = (n: number) => formatCurrency(n, currency)

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = income - expenses

  const byCategory: Record<string, number> = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  })
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  // Sankey data: Income → each expense category
  const sankeyData = pieData.length > 0 ? {
    nodes: [{ id: 'Income' }, ...pieData.map(d => ({ id: d.name }))],
    links: pieData.map(d => ({ source: 'Income', target: d.name, value: d.value }))
  } : null

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

  const tooltipStyle = { background: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`, borderRadius: 8, color: isDark ? '#fff' : '#0f172a' }
  const axisColor = isDark ? '#6b7280' : '#94a3b8'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Income" value={fmt(income)} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Expenses" value={fmt(expenses)} accent="text-red-500 dark:text-red-400" />
        <StatCard label="Net Balance" value={fmt(net)} accent={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'} />
        <StatCard label="Portfolio" value={fmt(portfolioValue)}
          sub={`${portfolioGain >= 0 ? '+' : ''}${fmt(portfolioGain)} gain`}
          accent={portfolioGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4">Income vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6} barSize={14}>
              <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 12 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie / Sankey toggle */}
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400">Spending by Category</h3>
            <div className="flex gap-1 bg-slate-100 dark:bg-gray-800 rounded-lg p-1">
              {(['pie', 'sankey'] as const).map(v => (
                <button key={v} onClick={() => setChartView(v)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize
                    ${chartView === v ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {pieData.length === 0 ? (
            <p className="text-slate-400 dark:text-gray-500 text-sm mt-10 text-center">No expenses this month</p>
          ) : chartView === 'pie' ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
              </PieChart>
            </ResponsiveContainer>
          ) : sankeyData ? (
            <div style={{ height: 220 }}>
              <ResponsiveSankey
                data={sankeyData}
                margin={{ top: 8, right: 80, bottom: 8, left: 40 }}
                align="justify"
                colors={PIE_COLORS}
                nodeOpacity={1}
                nodeThickness={14}
                nodeInnerPadding={3}
                nodeBorderRadius={3}
                nodeBorderWidth={0}
                linkOpacity={0.4}
                linkHoverOthersOpacity={0.1}
                enableLinkGradient
                labelPosition="outside"
                labelOrientation="horizontal"
                labelPadding={6}
                labelTextColor={isDark ? '#9ca3af' : '#64748b'}
                theme={{ tooltip: { container: tooltipStyle } }}
                valueFormat={v => fmt(v as number)}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Budget progress */}
      {budgets.length > 0 && (
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4">Budget Progress</h3>
          <div className="space-y-4">
            {budgets.map(b => {
              const spent = byCategory[b.category] ?? 0
              const pct = Math.min((spent / b.monthlyLimit) * 100, 100)
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-gray-300">{b.category}</span>
                    <span className={spent > b.monthlyLimit ? 'text-red-500 font-medium' : 'text-slate-400 dark:text-gray-500'}>
                      {fmt(spent)} / {fmt(b.monthlyLimit)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4">Recent Transactions</h3>
        {recent.length === 0 ? (
          <p className="text-slate-400 dark:text-gray-500 text-sm">No transactions yet. Add one in Transactions.</p>
        ) : (
          <div className="space-y-1">
            {recent.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                    ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {t.category[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-gray-200">{t.note || t.category}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
