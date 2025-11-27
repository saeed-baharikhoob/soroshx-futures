'use client'

import { useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { removePosition, updatePosition, removeOrder, addPosition } from '@/lib/redux/slices/tradingSlice'
import { selectPositionsWithPnl } from '@/lib/redux/selectors'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatPrice, formatNumber, validateTpSl, parseNumberInput } from '@/lib/utils'
import { calculateLiquidationPrice } from '@/lib/utils/trading-calculations'
import { Position, TpSlPriceType } from '@/types/trading'
import toast from 'react-hot-toast'
import { PositionRow } from './PositionRow'
import { OrderRow } from './OrderRow'

export const PositionsTable = () => {
  const dispatch = useAppDispatch()
  const { orders } = useAppSelector((state) => state.trading)
  const { currentPair, ticker } = useAppSelector((state) => state.market)
  const positionsWithPnl = useAppSelector(selectPositionsWithPnl)
  const [hideOtherPairs, setHideOtherPairs] = useState(false)
  const [tpslDialogOpen, setTpslDialogOpen] = useState(false)
  const [reverseConfirmOpen, setReverseConfirmOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [takeProfitPrice, setTakeProfitPrice] = useState('')
  const [stopLossPrice, setStopLossPrice] = useState('')
  const [tpPriceType, setTpPriceType] = useState<TpSlPriceType>('Last')
  const [slPriceType, setSlPriceType] = useState<TpSlPriceType>('Last')

  const filteredPositions = hideOtherPairs && currentPair
    ? positionsWithPnl.filter(pos => pos.symbol === currentPair.symbol)
    : positionsWithPnl


  const handleCancelAllOrders = useCallback(() => {
    orders.forEach(order => {
      dispatch(removeOrder(order.id))
    })
    toast.success(`Cancelled ${orders.length} order(s)`)
  }, [orders, dispatch])

  const handleCancelOrder = useCallback((orderId: string) => {
    dispatch(removeOrder(orderId))
    toast.success('Order cancelled successfully')
  }, [dispatch])

  const handleClosePosition = useCallback((position: Position) => {
    dispatch(removePosition(position.id))
    toast.success('Position closed successfully')
  }, [dispatch])

  const handleOpenReverseConfirm = useCallback((position: Position) => {
    setSelectedPosition(position)
    setReverseConfirmOpen(true)
  }, [])

  const handleConfirmReverse = () => {
    if (!selectedPosition) return

    const currentMarketPrice = ticker?.symbol === selectedPosition.symbol
      ? ticker.lastPrice
      : (currentPair?.lastPrice || selectedPosition.markPrice)

    const newSide = selectedPosition.side === 'long' ? 'short' : 'long'
    const newEntryPrice = currentMarketPrice
    const leverage = selectedPosition.leverage


    const newLiquidationPrice = calculateLiquidationPrice(newSide, newEntryPrice, leverage)


    dispatch(removePosition(selectedPosition.id))


    const newPosition: Position = {
      ...selectedPosition,
      id: `${selectedPosition.symbol}-${Date.now()}`,
      side: newSide,
      entryPrice: newEntryPrice,
      markPrice: currentMarketPrice,
      liquidationPrice: newLiquidationPrice,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      takeProfitPrice: undefined,
      stopLossPrice: undefined,
    }

    dispatch(addPosition(newPosition))
    toast.success(`Position reversed to ${newPosition.side.toUpperCase()}`)
    setReverseConfirmOpen(false)
    setSelectedPosition(null)
  }

  const handleOpenTpSlDialog = useCallback((position: Position) => {
    setSelectedPosition(position)
    setTakeProfitPrice(position.takeProfitPrice?.toString() || '')
    setStopLossPrice(position.stopLossPrice?.toString() || '')
    setTpPriceType(position.tpPriceType || 'Last')
    setSlPriceType(position.slPriceType || 'Last')
    setTpslDialogOpen(true)
  }, [])

  const handleSaveTpSl = () => {
    if (!selectedPosition) return

    const tpPrice = takeProfitPrice ? parseNumberInput(takeProfitPrice) : null
    const slPrice = stopLossPrice ? parseNumberInput(stopLossPrice) : null


    if (tpPrice || slPrice) {
      const validationError = validateTpSl({
        orderType: selectedPosition.side === 'long' ? 'buy' : 'sell',
        entryPrice: selectedPosition.entryPrice,
        marketPrice: selectedPosition.markPrice,
        takeProfitPrice: tpPrice,
        stopLossPrice: slPrice,
      })

      if (validationError) {
        toast.error(validationError)
        return
      }
    }

    const updates: Partial<Position> = {
      takeProfitPrice: tpPrice || undefined,
      stopLossPrice: slPrice || undefined,
      tpPriceType,
      slPriceType,
    }

    dispatch(updatePosition({ id: selectedPosition.id, updates }))
    toast.success('TP/SL updated successfully')
    setTpslDialogOpen(false)
    setSelectedPosition(null)
  }

  return (
    <div className="bg-background border-t border h-full flex flex-col">
      <Tabs defaultValue="positions" className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between border-b border px-4 flex-shrink-0">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="positions"
              className="px-4 py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              Positions({positionsWithPnl.length})
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="px-4 py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              Orders({orders.length})
            </TabsTrigger>
            <TabsTrigger
              value="balances"
              className="px-4 py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              Balances
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="px-4 py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              History
            </TabsTrigger>
          </TabsList>

          <Button
            variant="ghost"
            size="sm"
            className="text-trading-red hover:text-trading-red/80 hover:bg-transparent"
            onClick={handleCancelAllOrders}
            disabled={orders.length === 0}
          >
            Cancel all
          </Button>
        </div>


        <TabsContent value="positions" className="mt-0 flex-1 overflow-hidden flex flex-col">
          <div className="px-4 pt-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <Switch
                id="hideOtherPairs"
                checked={hideOtherPairs}
                onCheckedChange={setHideOtherPairs}
              />
              <label htmlFor="hideOtherPairs" className="text-sm text-muted-foreground cursor-pointer">
                Hide other pairs
              </label>
            </div>
          </div>
          {filteredPositions.length > 0 ? (
              <div className="overflow-x-auto overflow-y-auto flex-1 px-4 pb-4 custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b border">
                    <tr>
                      <th className="text-left py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm">Pair</th>
                      <th className="text-left py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm">Size</th>
                      <th className="text-left py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm hidden sm:table-cell">Entry</th>
                      <th className="text-left py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm">Mark</th>
                      <th className="text-left py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm hidden lg:table-cell">Liq.</th>
                      <th className="text-left py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm">PNL</th>
                      <th className="text-left py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm hidden md:table-cell">TP/SL</th>
                      <th className="text-right py-2 px-2 md:py-3 md:px-4 font-normal text-xs md:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {filteredPositions.map((position, idx) => (
                      <PositionRow
                        key={idx}
                        position={position}
                        onClose={handleClosePosition}
                        onReverse={handleOpenReverseConfirm}
                        onEditTpSl={handleOpenTpSlDialog}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground flex-1 flex items-center justify-center">
              No open positions
            </div>
          )}
        </TabsContent>


        <TabsContent value="orders" className="mt-0 flex-1 overflow-hidden flex flex-col">
          {orders.length > 0 ? (
              <div className="overflow-x-auto overflow-y-auto flex-1 p-4 custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b border">
                    <tr>
                      <th className="text-left py-3 font-normal">Time</th>
                      <th className="text-left py-3 font-normal">Pair</th>
                      <th className="text-left py-3 font-normal">Type</th>
                      <th className="text-right py-3 font-normal">Side</th>
                      <th className="text-right py-3 font-normal">Price</th>
                      <th className="text-right py-3 font-normal">Amount</th>
                      <th className="text-right py-3 font-normal">Filled</th>
                      <th className="text-right py-3 font-normal">Status</th>
                      <th className="text-right py-3 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {orders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        onCancel={handleCancelOrder}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground flex-1 flex items-center justify-center">
              No open orders
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances" className="mt-0 flex-1 overflow-hidden">
          <div className="p-4 text-center py-12 text-muted-foreground">
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
          <div className="p-4 text-center py-12 text-muted-foreground">
          </div>
        </TabsContent>
      </Tabs>


      <Dialog open={tpslDialogOpen} onOpenChange={setTpslDialogOpen}>
        <DialogContent className="bg-background-card border text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Set Take Profit / Stop Loss</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPosition && (
              <div className="text-sm text-muted-foreground mb-4">
                Position: <span className="text-white font-semibold">{selectedPosition.symbol}</span> - {' '}
                <span className={selectedPosition.side === 'long' ? 'text-trading-green' : 'text-trading-red'}>
                  {selectedPosition.side.toUpperCase()}
                </span>
              </div>
            )}


            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Take Profit Price</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  className="flex-1 bg-background border text-white"
                />
                <Select value={tpPriceType} onValueChange={(value: TpSlPriceType) => setTpPriceType(value)}>
                  <SelectTrigger className="w-24 bg-background border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background-card border text-white">
                    <SelectItem value="Last">Last</SelectItem>
                    <SelectItem value="Mark">Mark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Stop Loss Price</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  className="flex-1 bg-background border text-white"
                />
                <Select value={slPriceType} onValueChange={(value: TpSlPriceType) => setSlPriceType(value)}>
                  <SelectTrigger className="w-24 bg-background border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background-card border text-white">
                    <SelectItem value="Last">Last</SelectItem>
                    <SelectItem value="Mark">Mark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPosition && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Entry Price: {formatPrice(selectedPosition.entryPrice)}</div>
                <div>Mark Price: {formatPrice(selectedPosition.markPrice)}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTpslDialogOpen(false)}
              className="bg-transparent border text-white hover:bg-background-elevated"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTpSl}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={reverseConfirmOpen} onOpenChange={setReverseConfirmOpen}>
        <DialogContent className="bg-background-card border text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Reverse Position</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedPosition && (
              <div className="space-y-4">
                <p className="text-foreground/80">
                  Are you sure you want to reverse this position?
                </p>
                <div className="bg-background-card p-4 rounded border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="text-white font-semibold">{selectedPosition.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Side:</span>
                    <span className={selectedPosition.side === 'long' ? 'text-trading-green' : 'text-trading-red'}>
                      {selectedPosition.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New Side:</span>
                    <span className={selectedPosition.side === 'long' ? 'text-trading-red' : 'text-trading-green'}>
                      {selectedPosition.side === 'long' ? 'SHORT' : 'LONG'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="text-white">{formatNumber(selectedPosition.size, 4)} BTC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entry Price:</span>
                    <span className="text-white">
                      {formatPrice(
                        ticker?.symbol === selectedPosition.symbol
                          ? ticker.lastPrice
                          : (currentPair?.lastPrice || selectedPosition.markPrice)
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will close your current position and open a new position in the opposite direction at the current market price.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReverseConfirmOpen(false)}
              className="bg-transparent border text-white hover:bg-background-elevated"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReverse}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm Reverse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
