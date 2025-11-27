import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'

interface PriceDisplayProps {
  price: number
  previousPrice?: number
  decimals?: number
  showSign?: boolean
  colorize?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PriceDisplay = ({
  price,
  previousPrice,
  decimals = 2,
  showSign = false,
  colorize = true,
  size = 'md',
  className
}: PriceDisplayProps) => {
  const change = previousPrice ? price - previousPrice : 0
  const isPositive = change >= 0

  const colorClass = colorize
    ? isPositive ? 'text-trading-green' : 'text-trading-red'
    : 'text-white'

  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold'
  }[size]

  return (
    <span className={cn(colorClass, sizeClass, className)}>
      {showSign && isPositive && '+'}
      {formatPrice(price)}
    </span>
  )
}
