import { cn } from '@/lib/utils'

interface ConditionBadgeProps {
  grade: number
  size?: 'sm' | 'md' | 'lg'
}

function getConditionLabel(grade: number): string {
  if (grade >= 4.0) return 'Excellent'
  if (grade >= 3.5) return 'Good'
  if (grade >= 2.5) return 'Fair'
  return 'Poor'
}

function getConditionColor(grade: number) {
  if (grade >= 4.0) return { bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', text: 'text-emerald-400' }
  if (grade >= 3.5) return { bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', text: 'text-emerald-400' }
  if (grade >= 2.5) return { bg: 'bg-amber-400/15', border: 'border-amber-400/30', text: 'text-amber-400' }
  return { bg: 'bg-red-400/15', border: 'border-red-400/30', text: 'text-red-400' }
}

export function ConditionBadge({ grade, size = 'md' }: ConditionBadgeProps) {
  const label = getConditionLabel(grade)
  const { bg, border, text } = getConditionColor(grade)

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide',
        bg, border, text, sizeClasses[size]
      )}
    >
      <span className="font-mono">{grade.toFixed(1)}</span>
      <span className="opacity-75">·</span>
      <span>{label}</span>
    </span>
  )
}
