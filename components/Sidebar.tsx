'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ArrowLeftRight, PiggyBank, RefreshCw, TrendingUp, Target, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { getCurrency, saveCurrency, CURRENCIES } from '@/lib/store'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/recurring', label: 'Recurring', icon: RefreshCw },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/goals', label: 'Goals', icon: Target },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [currency, setCurrency] = useState('GBP')

  useEffect(() => { setCurrency(getCurrency()) }, [])

  const handleCurrencyChange = (code: string) => {
    saveCurrency(code)
    setCurrency(code)
    window.dispatchEvent(new Event('currency-change'))
  }

  return (
    <aside className="w-60 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col py-6 px-4 shrink-0 shadow-sm">
      {/* Logo */}
      <div className="mb-8 px-2 flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Budget</h1>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-800 space-y-3">
        {/* Currency selector */}
        <div>
          <label className="text-xs text-slate-400 dark:text-gray-500 font-medium px-1 mb-1 block">Currency</label>
          <select
            value={currency}
            onChange={e => handleCurrencyChange(e.target.value)}
            className="w-full bg-slate-100 dark:bg-gray-800 border-0 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}
