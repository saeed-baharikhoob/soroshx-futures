import { memo } from 'react'
import { formatPrice, formatNumber } from '@/lib/utils'
import type { OrderbookEntry } from '@/types/trading'

interface OrderbookRowProps {
  entry: OrderbookEntry
  side: 'bid' | 'ask'
  percentageWidth: number
  onClick: (price: number) => void
  decimalPrecision?: number
}

export const OrderbookRow = memo(({
  entry,
  side,
  percentageWidth,
  onClick,
  decimalPrecision = 2
}: OrderbookRowProps) => {
  const isBid = side === 'bid'
  const formattedPrice = decimalPrecision !== undefined
    ? entry.price.toFixed(decimalPrecision)
    : formatPrice(entry.price)

  return (
    <div
      onClick={() => onClick(entry.price)}
      className="relative grid grid-cols-3 gap-2 px-4 py-1.5 text-xs hover:bg-background-elevated/20 cursor-pointer"
    >
      <div
        className={`absolute right-0 top-0 h-full ${isBid ? 'bg-trading-green/10' : 'bg-trading-red/10'}`}
        style={{
          width: `${percentageWidth}%`,
        }}
      />
      <div className={`relative z-10 ${isBid ? 'text-trading-green' : 'text-trading-red'}`}>
        {formattedPrice}
      </div>
      <div className="relative z-10 text-right text-foreground/80">
        {formatNumber(entry.amount, 6)}
      </div>
      <div className="relative z-10 text-right text-foreground/80">
        {formatNumber(entry.total, 4)}
      </div>
    </div>
  )
})

OrderbookRow.displayName = 'OrderbookRow'
