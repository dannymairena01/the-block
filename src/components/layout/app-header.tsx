import { Link, useLocation } from 'react-router-dom'
import { useWatchlistStore } from '@/stores/watchlist-store'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Bookmark, LayoutGrid } from 'lucide-react'

export function AppHeader() {
  const count = useWatchlistStore(s => s.count())
  const location = useLocation()

  const isInventory = location.pathname === '/' || location.pathname.startsWith('/vehicles')
  const isWatchlist = location.pathname === '/watchlist'

  return (
    <header
      className="h-[60px] flex items-center justify-between px-4 sticky top-0 z-30"
      style={{
        background: 'var(--color-surface-1)',
        borderBottom: '1px solid var(--color-surface-border)',
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2.5 font-bold text-lg"
        style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-black"
          style={{ background: 'var(--color-brand-500)' }}
        >
          B
        </div>
        <span>The Block</span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded border hidden sm:inline"
          style={{
            color: 'var(--color-text-muted)',
            borderColor: 'var(--color-surface-border)',
            background: 'var(--color-surface-2)',
          }}
        >
          by OPENLANE
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        <Link
          id="nav-inventory"
          to="/"
          className={`btn btn-ghost btn-sm gap-1.5 ${isInventory ? 'text-[var(--color-brand-400)]' : ''}`}
          style={{ textDecoration: 'none' }}
          aria-current={isInventory ? 'page' : undefined}
        >
          <LayoutGrid size={15} />
          <span className="hidden sm:inline">Inventory</span>
        </Link>

        <Link
          id="nav-watchlist"
          to="/watchlist"
          className={`btn btn-ghost btn-sm gap-1.5 relative ${isWatchlist ? 'text-[var(--color-brand-400)]' : ''}`}
          style={{ textDecoration: 'none' }}
          aria-current={isWatchlist ? 'page' : undefined}
        >
          <Bookmark size={15} />
          <span className="hidden sm:inline">Watchlist</span>
          {count > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{ background: 'var(--color-brand-500)' }}
            >
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Link>

        <ThemeToggle />
      </nav>
    </header>
  )
}
