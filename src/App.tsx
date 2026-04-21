import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppHeader } from '@/components/layout/app-header'
import { InventoryPage } from '@/pages/inventory-page'
import { VehiclePage } from '@/pages/vehicle-page'
import { WatchlistPage } from '@/pages/watchlist-page'

// Vehicle data is static seed JSON — never goes stale within a session and is
// cheap to keep in memory. Locking the defaults here keeps any future query
// aligned with the intended caching policy.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface-0)' }}>
          <AppHeader />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<InventoryPage />} />
              <Route path="/vehicles/:id" element={<VehiclePage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
