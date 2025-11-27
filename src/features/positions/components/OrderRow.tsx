import { memo } from 'react'
import { formatNumber, formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Order } from '@/types/trading'

interface OrderRowProps {
  order: Order
  onCancel: (orderId: string) => void
}

export const OrderRow = memo(({ order, onCancel }: OrderRowProps) => {
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      <td className="py-3 px-4">
        <span className="text-white font-medium">{order.symbol}</span>
      </td>
      <td className="py-3 px-4">
        <span className={cn(
          'font-medium',
          order.side === 'buy' ? 'text-trading-green' : 'text-trading-red'
        )}>
          {order.side.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-4 text-white capitalize">{order.type}</td>
      <td className="py-3 px-4 text-white">{formatPrice(order.price)}</td>
      <td className="py-3 px-4 text-white">{formatNumber(order.quantity, 4)}</td>
      <td className="py-3 px-4 text-gray-400">
        {formatNumber(order.filled, 4)} / {formatNumber(order.quantity, 4)}
      </td>
      <td className="text-right py-3 px-4">
        <Button
          size="sm"
          variant="destructive"
          className="text-xs"
          onClick={() => onCancel(order.id)}
        >
          Cancel
        </Button>
      </td>
    </tr>
  )
})

OrderRow.displayName = 'OrderRow'
