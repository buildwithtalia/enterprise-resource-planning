import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
}

interface NavItem {
  name: string
  path: string
  icon: string
  color: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: '📊', color: 'text-blue-600' },
  { name: 'Architecture', path: '/architecture', icon: '🏗️', color: 'text-purple-600' },
  { name: 'Human Resources', path: '/hr', icon: '👥', color: 'text-green-600' },
  { name: 'Payroll', path: '/payroll', icon: '💰', color: 'text-yellow-600' },
  { name: 'Accounting', path: '/accounting', icon: '📚', color: 'text-indigo-600' },
  { name: 'Finance', path: '/finance', icon: '📈', color: 'text-pink-600' },
  { name: 'Billing', path: '/billing', icon: '🧾', color: 'text-orange-600' },
  { name: 'Procurement', path: '/procurement', icon: '🛒', color: 'text-teal-600' },
  { name: 'Supply Chain', path: '/supply-chain', icon: '🚚', color: 'text-cyan-600' },
  { name: 'Inventory', path: '/inventory', icon: '📦', color: 'text-red-600' },
]

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation()

  if (!isOpen) return null

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        <div className="mb-4">
          <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Navigation
          </h2>
        </div>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 mt-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800 font-semibold mb-1">Monolithic Design</p>
          <p className="text-xs text-yellow-700">
            All modules share the same database and run in a single process
          </p>
        </div>
      </div>
    </aside>
  )
}
