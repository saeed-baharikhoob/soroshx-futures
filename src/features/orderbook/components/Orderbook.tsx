'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { setOrderbook, updateOrderbook, setLoading } from '@/lib/redux/slices/orderbookSlice'
import { setSelectedPrice } from '@/lib/redux/slices/tradingSlice'
import { getLBankWebSocket } from '@/lib/websocket/lbankWebSocket'
import { getLBankAPI } from '@/lib/api/lbankApi'
import { formatPrice, formatNumber, toLBankSymbol } from '@/lib/utils'
import { parseOrderbookEntries } from '@/lib/utils/orderbook-utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrderbookEntry } from '@/types/trading'
import { OrderbookRow } from './OrderbookRow'

type ViewMode = 'both' | 'bid' | 'ask'

export const Orderbook = () => {
  const dispatch = useAppDispatch()
  const { currentPair } = useAppSelector((state) => state.market)
  const { orderbook, isLoading } = useAppSelector((state) => state.orderbook)
  const [activeTab, setActiveTab] = useState('orderbook')
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [decimalPrecision, setDecimalPrecision] = useState(1)


  const buySellRatio = useMemo(() => {
    if (!orderbook || orderbook.bids.length === 0 || orderbook.asks.length === 0) {
      return { buyPercent: 50, sellPercent: 50 }
    }


    const totalBidAmount = orderbook.bids.slice(0, 20).reduce((sum, bid) => sum + bid.amount, 0)
    const totalAskAmount = orderbook.asks.slice(0, 20).reduce((sum, ask) => sum + ask.amount, 0)
    const totalAmount = totalBidAmount + totalAskAmount

    if (totalAmount === 0) {
      return { buyPercent: 50, sellPercent: 50 }
    }

    const buyPercent = Math.round((totalBidAmount / totalAmount) * 100)
    const sellPercent = 100 - buyPercent

    return { buyPercent, sellPercent }
  }, [orderbook])

  useEffect(() => {
    if (!currentPair) return

    const fetchInitialOrderbook = async () => {
      dispatch(setLoading(true))
      try {
        const api = getLBankAPI()
        const lbankSymbol = toLBankSymbol(currentPair.symbol)
        const depth = await api.getDepth(lbankSymbol, 60)

        const { bids, asks } = parseOrderbookEntries(depth, 20)

        dispatch(
          setOrderbook({
            symbol: currentPair.symbol,
            bids,
            asks,
            lastUpdateId: depth.timestamp,
          })
        )
      } catch (error) {
        console.error('Error fetching orderbook:', error)
        dispatch(setLoading(false))
      }
    }


    fetchInitialOrderbook()


    const ws = getLBankWebSocket()

    const handleOrderbookUpdate = (data: any) => {
      if (data.depth) {
        const { bids, asks } = parseOrderbookEntries(data.depth, 20)

        dispatch(
          setOrderbook({
            symbol: currentPair.symbol,
            bids,
            asks,
            lastUpdateId: data.TS || Date.now(),
          })
        )
      }
    }


    const lbankSymbol = toLBankSymbol(currentPair.symbol)
    const channel = `depth.${lbankSymbol}`
    ws.subscribe(channel, handleOrderbookUpdate)

    return () => {
      ws.unsubscribe(channel, handleOrderbookUpdate)
    }
  }, [currentPair, dispatch])

  const handlePriceClick = useCallback((price: number) => {
    dispatch(setSelectedPrice(price))
  }, [dispatch])


  const formatOrderbookPrice = useCallback((price: number) => {
    return price.toFixed(decimalPrecision)
  }, [decimalPrecision])


  const itemsToShow = viewMode === 'both' ? 10 : 20

  const calculatePercentageBar = (total: number, maxTotal: number) => {
    if (maxTotal === 0) return 0
    return (total / maxTotal) * 100
  }

  const maxBidTotal = useMemo(() => {
    if (!orderbook || orderbook.bids.length === 0) return 0
    return Math.max(...orderbook.bids.map(bid => bid.total))
  }, [orderbook])

  const maxAskTotal = useMemo(() => {
    if (!orderbook || orderbook.asks.length === 0) return 0
    return Math.max(...orderbook.asks.map(ask => ask.total))
  }, [orderbook])

  const middlePrice = orderbook?.bids[0]?.price || currentPair?.lastPrice || 0

  return (
    <div className="flex flex-col h-full bg-background ">
      <div className="border-b border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between px-4 py-2">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="orderbook"
                className="px-3 py-1.5 text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-border-light rounded-none"
              >
                Order book
              </TabsTrigger>
              <TabsTrigger
                value="trades"
                className="px-3 py-1.5 text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-border-light rounded-none"
              >
                Trade history
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t border">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setViewMode('both')}
                    className={`w-6 h-6  flex flex-col gap-0.5 items-center justify-center transition-opacity ${
                        viewMode === 'both' ? 'opacity-100' : 'opacity-40 hover:opacity-60'
                    }`}
                >
                    <div className="w-full h-[25%] bg-trading-green "></div>
                    <div className="w-full h-[25%] bg-trading-red "></div>

                </button>

              <button
                onClick={() => setViewMode('ask')}
                className={`w-6 h-6  flex  flex-col gap-0.5 items-center justify-center transition-opacity ${
                  viewMode === 'ask' ? 'opacity-100' : 'opacity-40 hover:opacity-60'
                }`}
              >
                  <div className="w-full h-[25%] bg-trading-gray "></div>
                  <div className="w-full h-[25%] bg-trading-red "></div>
              </button>




              <button
                onClick={() => setViewMode('bid')}
                className={`w-6 h-6  flex flex-col gap-0.5 items-center justify-center transition-opacity ${
                  viewMode === 'bid' ? 'opacity-100' : 'opacity-40 hover:opacity-60'
                }`}
              >
                  <div className="w-full h-[25%] bg-trading-green "></div>
                  <div className="w-full h-[25%] bg-trading-gray "></div>
              </button>
            </div>
            <select
              value={decimalPrecision}
              onChange={(e) => setDecimalPrecision(Number(e.target.value))}
              className="bg-transparent text-white text-xs border-none focus:outline-none cursor-pointer [&>option]:bg-background [&>option]:text-white"
            >
              <option value="2" className="bg-background text-white">0.001</option>
              <option value="1" className="bg-background text-white">0.01</option>
              <option value="0" className="bg-background text-white">1</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-muted-foreground border-t border">
            <div>Price</div>
            <div className="text-right">Amount({currentPair?.baseAsset || 'BTC'})</div>
            <div className="text-right">Total ({currentPair?.baseAsset || 'BTC'})</div>
          </div>

          <TabsContent value="orderbook" className="mt-0 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-[calc(100vh-350px)] text-muted-foreground">
                Loading orderbook...
              </div>
            ) : !orderbook || (orderbook.bids.length === 0 && orderbook.asks.length === 0) ? (
              <div className="flex items-center justify-center h-[calc(100vh-350px)] text-muted-foreground">
                No orderbook data available
              </div>
            ) : (
              <div className="flex flex-col h-[calc(100vh-350px)]">

                {viewMode === 'ask' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col-reverse">
                      {orderbook.asks.slice(0, itemsToShow).map((ask, idx) => (
                        <OrderbookRow
                          key={`ask-${idx}`}
                          entry={ask}
                          side="ask"
                          percentageWidth={calculatePercentageBar(ask.total, maxAskTotal)}
                          onClick={handlePriceClick}
                          decimalPrecision={decimalPrecision}
                        />
                      ))}
                    </div>
                  </div>
                )}


                {viewMode === 'both' && (
                  <>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="flex flex-col-reverse">
                        {orderbook.asks.slice(0, itemsToShow).map((ask, idx) => (
                          <OrderbookRow
                            key={`ask-${idx}`}
                            entry={ask}
                            side="ask"
                            percentageWidth={calculatePercentageBar(ask.total, maxAskTotal)}
                            onClick={handlePriceClick}
                            decimalPrecision={decimalPrecision}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-3 bg-background-card/50 border-y border">
                      <div className="text-2xl font-bold text-trading-green">
                        {formatPrice(middlePrice)}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {orderbook.bids.slice(0, itemsToShow).map((bid, idx) => (
                        <OrderbookRow
                          key={`bid-${idx}`}
                          entry={bid}
                          side="bid"
                          percentageWidth={calculatePercentageBar(bid.total, maxBidTotal)}
                          onClick={handlePriceClick}
                          decimalPrecision={decimalPrecision}
                        />
                      ))}
                    </div>
                  </>
                )}


                {viewMode === 'bid' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {orderbook.bids.slice(0, itemsToShow).map((bid, idx) => (
                      <OrderbookRow
                        key={`bid-${idx}`}
                        entry={bid}
                        side="bid"
                        percentageWidth={calculatePercentageBar(bid.total, maxBidTotal)}
                        onClick={handlePriceClick}
                        decimalPrecision={decimalPrecision}
                      />
                    ))}
                  </div>
                )}

                <div className="px-4 py-2 border-t border">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-trading-red min-w-[32px]">{buySellRatio.sellPercent}%</span>
                    <div className="flex-1 h-2 bg-background-elevated rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-trading-red transition-all"
                        style={{ width: `${buySellRatio.sellPercent}%` }}
                      />
                      <div
                        className="h-full bg-trading-green transition-all"
                        style={{ width: `${buySellRatio.buyPercent}%` }}
                      />
                    </div>
                    <span className="text-trading-green min-w-[32px]">{buySellRatio.buyPercent}%</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trades" className="mt-0">
            <div className="px-4 py-8 text-center text-muted-foreground">
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
