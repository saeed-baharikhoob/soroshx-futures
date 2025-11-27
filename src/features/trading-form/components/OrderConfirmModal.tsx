'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPrice, formatNumber } from '@/lib/utils'

interface OrderConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  orderType: 'buy' | 'sell'
  price: number
  amount: number
  leverage: number
  symbol: string
  orderMode: 'limit' | 'market'
}

export const OrderConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  orderType,
  price,
  amount,
  leverage,
  symbol,
  orderMode,
}: OrderConfirmModalProps) => {
  const isBuy = orderType === 'buy'
  const totalValue = price * amount
  const margin = totalValue / leverage

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-card border text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Confirm Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between py-3 border-b border">
            <span className="text-muted-foreground">Order Type</span>
            <span className={`font-semibold ${isBuy ? 'text-trading-green' : 'text-trading-red'}`}>
              {isBuy ? 'Buy/Long' : 'Sell/Short'} ({orderMode.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Symbol</span>
            <span className="font-semibold">{symbol}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold">${formatPrice(price)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatNumber(amount, 4)} {symbol.split('/')[0]}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Leverage</span>
            <span className="font-semibold">{leverage}x</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-semibold">${formatPrice(totalValue)}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-t border">
            <span className="text-muted-foreground">Margin Required</span>
            <span className="font-semibold text-yellow-500">${formatPrice(margin)}</span>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-3 px-4 bg-background-elevated hover:bg-background-elevated/80 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 text-white rounded transition-colors font-semibold ${
                isBuy
                  ? 'bg-trading-buy hover:bg-trading-buy-hover'
                  : 'bg-trading-sell hover:bg-trading-sell-hover'
              }`}
            >
              Confirm {isBuy ? 'Buy' : 'Sell'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
