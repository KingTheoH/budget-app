'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, PiggyBank, RefreshCw, TrendingUp } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/recurring', label: 'Recurring', icon: RefreshCw },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-8 px-4 gap-2 shrink-0">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold text-white">💰 Budget</h1>
      </div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
