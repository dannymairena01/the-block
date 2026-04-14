import { useBidStore } from '@/stores/bid-store'
import { formatCAD, relativeTime } from '@/lib/format'
import { History, TrendingUp, Tag } from 'lucide-react'

interface BidHistoryProps {
  vehicleId: string
}

export function BidHistory({ vehicleId }: BidHistoryProps) {
  const getHistory = useBidStore(s => s.getHistory)
  const history = getHistory(vehicleId)

  if (history.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
        <History size={14} />
        Your Bid History
      </h2>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-surface-border)' }}>
        {history.map((record, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2.5 text-sm"
            style={{
              borderBottom: i < history.length - 1 ? '1px solid var(--color-surface-border)' : 'none',
              background: 'var(--color-surface-2)',
            }}
          >
            <div className="flex items-center gap-2">
              {record.type === 'buy-now'
                ? <Tag size={13} style={{ color: 'var(--color-brand-400)' }} />
                : <TrendingUp size={13} style={{ color: 'var(--color-emerald-400)' }} />
              }
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {record.type === 'buy-now' ? 'Buy Now' : 'Bid'}
              </span>
            </div>
            <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {formatCAD(record.amount)}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {relativeTime(record.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
