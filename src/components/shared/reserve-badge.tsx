import type { ReserveStatus } from '@/lib/vehicles'
import { cn } from '@/lib/utils'
import { Check, AlertTriangle, Tag } from 'lucide-react'

const config: Record<ReserveStatus, { label: string; style: string; icon: React.ReactNode }> = {
  'no-reserve': {
    label: 'No Reserve',
    style: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    icon: <Tag size={10} />,
  },
  'not-met': {
    label: 'Reserve Not Met',
    style: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    icon: <AlertTriangle size={10} />,
  },
  met: {
    label: 'Reserve Met',
    style: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    icon: <Check size={10} />,
  },
}

export function ReserveBadge({ status }: { status: ReserveStatus }) {
  const { label, style, icon } = config[status]
  return (
    <span className={cn('badge border gap-1', style)}>
      {icon}
      {label}
    </span>
  )
}
