import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppHeader } from '@/components/layout/app-header'
import { InventoryPage } from '@/pages/inventory-page'
import { VehiclePage } from '@/pages/vehicle-page'
import { WatchlistPage } from '@/pages/watchlist-page'

const queryClient = new QueryClient()

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
