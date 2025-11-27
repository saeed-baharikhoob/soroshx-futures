import { memo } from 'react'
import { PnlDisplay } from '@/components/shared/PnlDisplay'
import { formatNumber, formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Position } from '@/types/trading'

interface PositionRowProps {
  position: Position & {
    unrealizedPnl: number
    unrealizedPnlPercent: number
  }
  onClose: (position: Position) => void
  onReverse: (position: Position) => void
  onEditTpSl: (position: Position) => void
}

export const PositionRow = memo(({
  position,
  onClose,
  onReverse,
  onEditTpSl
}: PositionRowProps) => {
  return (
    <tr className="border-b border hover:bg-background-elevated/30 transition-colors">
      <td className="py-2 px-2 md:py-3 md:px-4">
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-white font-medium text-xs md:text-sm">{position.symbol}</span>
          <span className={cn(
            'text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded font-medium whitespace-nowrap',
            position.side === 'long'
              ? 'bg-trading-green/20 text-trading-green'
              : 'bg-trading-red/20 text-trading-red'
          )}>
            {position.side.toUpperCase()} {position.leverage}x
          </span>
        </div>
      </td>
      <td className="py-2 px-2 md:py-3 md:px-4 text-left text-white text-xs md:text-sm">{formatNumber(position.size, 4)}</td>
      <td className="py-2 px-2 md:py-3 md:px-4 text-left text-white text-xs md:text-sm hidden sm:table-cell">{formatPrice(position.entryPrice)}</td>
      <td className="py-2 px-2 md:py-3 md:px-4 text-left text-white text-xs md:text-sm">{formatPrice(position.markPrice)}</td>
      <td className="py-2 px-2 md:py-3 md:px-4 text-left text-trading-red text-xs md:text-sm hidden lg:table-cell">{formatPrice(position.liquidationPrice)}</td>
      <td className="py-2 px-2 md:py-3 md:px-4 text-left">
        <PnlDisplay
          pnl={position.unrealizedPnl}
          pnlPercent={position.unrealizedPnlPercent}
          showCurrency={true}
          currency="USDT"
          size="sm"
        />
      </td>
      <td className="py-2 px-2 md:py-3 md:px-4 text-left hidden md:table-cell">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>TP: {position.takeProfitPrice ? formatPrice(position.takeProfitPrice) : '--'}</div>
          <div>SL: {position.stopLossPrice ? formatPrice(position.stopLossPrice) : '--'}</div>
        </div>
      </td>
      <td className="text-right py-2 px-2 md:py-3 md:px-4">
        <div className="flex items-center justify-end gap-1 md:gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] md:text-xs px-2 h-7"
            onClick={() => onEditTpSl(position)}
          >
            TP/SL
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] md:text-xs px-2 h-7 hidden sm:inline-flex"
            onClick={() => onReverse(position)}
          >
            Reverse
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="text-[10px] md:text-xs px-2 h-7"
            onClick={() => onClose(position)}
          >
            Close
          </Button>
        </div>
      </td>
    </tr>
  )
})

PositionRow.displayName = 'PositionRow'
