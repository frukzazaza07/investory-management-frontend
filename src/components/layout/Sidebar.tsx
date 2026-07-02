import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Webhook,
  Store,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogout, useMe } from '@/hooks/useAuth'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function Sidebar() {
  const { t } = useTranslation()
  const logout = useLogout()
  const { data: me } = useMe()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/suppliers', icon: Users, label: t('sidebar.suppliers') },
    { to: '/inventory', icon: Package, label: t('sidebar.inventory') },
    { to: '/products', icon: ShoppingCart, label: t('sidebar.products') },
    { to: '/purchase-orders', icon: FileText, label: t('sidebar.purchaseOrders') },
    { to: '/webhooks', icon: Webhook, label: t('sidebar.webhooks') },
    { to: '/pos', icon: Store, label: t('sidebar.posTerminal') },
  ]

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen bg-gray-900 text-white">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold">Investory</h1>
        <p className="text-xs text-gray-400 mt-0.5">{t('sidebar.brand')}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-700">
        <LanguageSwitcher />
        <div className="p-3 space-y-1">
          {me && (
            <p className="px-3 py-1 text-xs text-gray-400 truncate">{me.email}</p>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('sidebar.logout')}
          </button>
        </div>
      </div>
    </aside>
  )
}
