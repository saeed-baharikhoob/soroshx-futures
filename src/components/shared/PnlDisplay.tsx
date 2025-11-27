import { formatNumber, cn } from '@/lib/utils'

interface PnlDisplayProps {
  pnl: number
  pnlPercent: number
  showCurrency?: boolean
  currency?: string
  size?: 'sm' | 'md' | 'lg'
}

export const PnlDisplay = ({
  pnl,
  pnlPercent,
  showCurrency = false,
  currency = 'USDT',
  size = 'md'
}: PnlDisplayProps) => {
  const isPositive = pnl >= 0
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={cn(
      sizeClasses[size],
      isPositive ? 'text-trading-green' : 'text-trading-red'
    )}>
      <div className="font-medium">
        {isPositive ? '+' : ''}{formatNumber(pnl, 2)} {showCurrency && currency}
      </div>
      <div className="text-xs opacity-80">
        ({isPositive ? '+' : ''}{formatNumber(pnlPercent, 2)}%)
      </div>
    </div>
  )
}
