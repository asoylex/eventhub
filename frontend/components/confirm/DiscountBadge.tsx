import { cn } from '@/lib/utils'

interface DiscountBadgeProps {
  label: string
  discount: number
  className?: string
}

export default function DiscountBadge({ label, discount, className }: DiscountBadgeProps) {
  if (discount === 0) return null

  return (
    <div className={cn(
      'flex flex-col items-center rounded-lg px-3 py-2',
      discount >= 5 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
      className
    )}>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-lg font-bold">{discount}%</span>
      <span className="text-xs">descuento</span>
    </div>
  )
}