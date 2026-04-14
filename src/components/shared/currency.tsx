import { formatCAD } from '@/lib/format'

interface CurrencyProps {
  amount: number | null | undefined
  className?: string
}

export function Currency({ amount, className }: CurrencyProps) {
  return <span className={className}>{formatCAD(amount)}</span>
}
