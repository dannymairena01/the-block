import type { Vehicle } from '@/types/vehicle'
import { cn } from '@/lib/utils'

const styles: Record<Vehicle['title_status'], string> = {
  clean: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-400',
  rebuilt: 'bg-amber-400/10 border-amber-400/25 text-amber-400',
  salvage: 'bg-red-400/10 border-red-400/25 text-red-400',
}

const labels: Record<Vehicle['title_status'], string> = {
  clean: 'Clean Title',
  rebuilt: 'Rebuilt Title',
  salvage: 'Salvage Title',
}

export function TitleBadge({ status }: { status: Vehicle['title_status'] }) {
  return (
    <span className={cn('badge border', styles[status])}>
      {labels[status]}
    </span>
  )
}
