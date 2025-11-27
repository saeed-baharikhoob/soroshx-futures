'use client'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { setOrderType, setLeverage, addPosition, setSelectedPrice } from '@/lib/redux/slices/tradingSlice'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrderConfirmModal } from './OrderConfirmModal'
import { formatNumberInput, parseNumberInput, isValidNumberInput, formatNumber, formatPrice, validateTpSl } from '@/lib/utils'
import { calculateLiquidationPrice } from '@/lib/utils/trading-calculations'
import toast from 'react-hot-toast'
import { TpSlPriceType } from '@/types/trading'

interface TradingFormProps {
  onOrderComplete?: () => void
}

export const TradingForm = ({ onOrderComplete }: TradingFormProps = {}) => {
  const dispatch = useAppDispatch()
  const { currentPair } = useAppSelector((state) => state.market)
  const { orderType, leverage, availableBalance, selectedPrice } = useAppSelector((state) => state.trading)
  const { orderbook } = useAppSelector((state) => state.orderbook)
  const [price, setPrice] = useState('')
  const [marginPercent, setMarginPercent] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<{ type: 'buy' | 'sell' } | null>(null)
  const [tpslEnabled, setTpslEnabled] = useState(false)
  const [takeProfitPrice, setTakeProfitPrice] = useState('')
  const [stopLossPrice, setStopLossPrice] = useState('')
  const [tpPriceType, setTpPriceType] = useState<TpSlPriceType>('Last')
  const [slPriceType, setSlPriceType] = useState<TpSlPriceType>('Last')
  const [marginMode, setMarginMode] = useState<'cross' | 'isolated'>('cross')
  const [currentLeverage, setCurrentLeverage] = useState(10)
  const [marginCurrency, setMarginCurrency] = useState<'USDT' | 'BTC'>('USDT')
  const [showLeverageSelector, setShowLeverageSelector] = useState(false)

  const mockAvailableBalance = 2000

  const marginAmount = (mockAvailableBalance * marginPercent) / 100

  const marketPrice = currentPair?.lastPrice || 0
  const entryPrice = orderType === 'market' ? marketPrice : (price ? parseNumberInput(price) : marketPrice)


  const marginInBTC = entryPrice > 0 ? marginAmount / entryPrice : 0


  const notionalValue = marginAmount * currentLeverage


  const maxOpenLong = entryPrice > 0 ? notionalValue / entryPrice : 0
  const maxOpenShort = entryPrice > 0 ? notionalValue / entryPrice : 0


  const liquidationPriceLong = entryPrice > 0 ? calculateLiquidationPrice('long', entryPrice, currentLeverage) : 0
  const liquidationPriceShort = entryPrice > 0 ? calculateLiquidationPrice('short', entryPrice, currentLeverage) : 0


  const bboPrice = orderbook?.asks[0]?.price || marketPrice


  useEffect(() => {
    if (selectedPrice !== null) {
      setPrice(formatNumberInput(selectedPrice.toString()))

      dispatch(setSelectedPrice(null))
    }
  }, [selectedPrice, dispatch])


  useEffect(() => {
    if (currentPair && currentPair.lastPrice > 0) {
      setPrice(formatNumberInput(currentPair.lastPrice.toString()))
    }
  }, [currentPair?.symbol])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLeverageSelector) {
        setShowLeverageSelector(false)
      }
    }

    if (showLeverageSelector) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showLeverageSelector])

  const handleOrderTypeChange = (type: 'limit' | 'market') => {
    dispatch(setOrderType(type))
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || isValidNumberInput(value)) {
      setPrice(formatNumberInput(value))
    }
  }

  const handleMarginSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value)
    setMarginPercent(percent)
  }

  const validateOrder = (orderSide: 'buy' | 'sell'): string | null => {

    if (marginAmount <= 0) {
      return 'Please set a margin amount using the slider'
    }


    const priceValue = orderType === 'market' ? marketPrice : (price ? parseNumberInput(price) : marketPrice)


    if (orderType === 'limit') {
      if (!priceValue || priceValue <= 0) {
        return 'Please enter a valid price'
      }


      const priceDeviation = Math.abs(priceValue - marketPrice) / marketPrice
      if (priceDeviation > 0.2) {
        return `Price is too far from market price (${formatPrice(marketPrice)}). Maximum deviation is 20%.`
      }
    }


    if (tpslEnabled) {
      const tpPrice = takeProfitPrice ? parseNumberInput(takeProfitPrice) : null
      const slPrice = stopLossPrice ? parseNumberInput(stopLossPrice) : null

      const tpslError = validateTpSl({
        orderType: orderSide,
        entryPrice: priceValue,
        marketPrice,
        takeProfitPrice: tpPrice,
        stopLossPrice: slPrice,
      })

      if (tpslError) {
        return tpslError
      }
    }

    return null
  }

  const handleBuyLong = () => {

    if (!price && marketPrice > 0) {
      setPrice(formatNumberInput(marketPrice.toString()))
    }

    const error = validateOrder('buy')
    if (error) {
      toast.error(error)
      return
    }

    setPendingOrder({ type: 'buy' })
    setIsModalOpen(true)
  }

  const handleSellShort = () => {

    if (!price && marketPrice > 0) {
      setPrice(formatNumberInput(marketPrice.toString()))
    }

    const error = validateOrder('sell')
    if (error) {
      toast.error(error)
      return
    }

    setPendingOrder({ type: 'sell' })
    setIsModalOpen(true)
  }

  const handleConfirmOrder = () => {
    if (!currentPair || !pendingOrder) return

    const entryPrice = orderType === 'market' ? currentPair.lastPrice : (price ? parseNumberInput(price) : currentPair.lastPrice)
    const positionSize = pendingOrder.type === 'buy' ? maxOpenLong : maxOpenShort

    const newPosition = {
      id: `${currentPair.symbol}-${Date.now()}`,
      symbol: currentPair.symbol,
      side: pendingOrder.type === 'buy' ? ('long' as const) : ('short' as const),
      size: positionSize,
      entryPrice: entryPrice,
      markPrice: currentPair.lastPrice,
      leverage: currentLeverage,
      margin: marginAmount,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      liquidationPrice: pendingOrder.type === 'buy'
        ? liquidationPriceLong
        : liquidationPriceShort,

      ...(tpslEnabled && {
        takeProfitPrice: takeProfitPrice ? parseNumberInput(takeProfitPrice) : undefined,
        stopLossPrice: stopLossPrice ? parseNumberInput(stopLossPrice) : undefined,
        tpPriceType: tpPriceType,
        slPriceType: slPriceType,
      }),
    }

    dispatch(addPosition(newPosition))


    toast.success(`${pendingOrder.type === 'buy' ? 'Long' : 'Short'} position opened successfully!`)


    setMarginPercent(0)
    setPrice('')
    setTakeProfitPrice('')
    setStopLossPrice('')
    setTpslEnabled(false)
    setPendingOrder(null)
    setIsModalOpen(false)


    if (onOrderComplete) {
      onOrderComplete()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-gray-800 relative">

      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 relative flex-shrink-0">
        <button
          onClick={() => {
            setMarginMode('cross')
            setShowLeverageSelector(false)
          }}
          className={`px-3 py-1 text-xs rounded hover:bg-gray-700 transition-colors ${
            marginMode === 'cross' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Cross
        </button>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowLeverageSelector(!showLeverageSelector)
            }}
            className="px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            {currentLeverage}X
          </button>
          {showLeverageSelector && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full mt-1 left-0 bg-gray-900 border border-gray-700 rounded shadow-lg p-2 z-50 grid grid-cols-4 gap-1 min-w-[160px]"
            >
              {[1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125].map((lev) => (
                <button
                  key={lev}
                  onClick={() => {
                    setCurrentLeverage(lev)
                    dispatch(setLeverage(lev))
                    setShowLeverageSelector(false)
                  }}
                  className={`px-2 py-1 text-xs rounded hover:bg-gray-700 transition-colors ${
                    currentLeverage === lev ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {lev}X
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setMarginMode('isolated')
            setShowLeverageSelector(false)
          }}
          className={`px-3 py-1 text-xs rounded hover:bg-gray-700 transition-colors ${
            marginMode === 'isolated' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          S
        </button>
      </div>


      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <Select value={orderType} onValueChange={handleOrderTypeChange}>
          <SelectTrigger className="w-24 h-7 bg-transparent border-none text-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-white">
            <SelectItem value="limit">Limit</SelectItem>
            <SelectItem value="market">Market</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-gray-400">BBO</span>
      </div>

      <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto custom-scrollbar">


      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Price</span>
          <span className="text-xs text-gray-400">BBO</span>
        </div>
        {orderType === 'market' ? (
          <div className="bg-background-card border border-gray-800 text-white text-sm h-9 rounded-md flex items-center justify-center">
            Market
          </div>
        ) : (
          <Input
            type="text"
            value={price}
            onChange={handlePriceChange}
            placeholder={currentPair?.lastPrice.toLocaleString() || '0.00'}
            className="bg-background-card border-gray-800 text-white text-sm h-9"
          />
        )}
      </div>


      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Margin</span>
          <Select
            value={marginCurrency}
            onValueChange={(value) => {
              if (value === 'USDT' || value === 'BTC') {
                setMarginCurrency(value)
              }
            }}
          >
            <SelectTrigger className="w-16 h-6 bg-transparent border-none text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-white">
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="BTC">BTC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Input
            type="text"
            value={marginCurrency === 'USDT'
              ? formatNumberInput(marginAmount.toFixed(2))
              : formatNumber(marginInBTC, 8)
            }
            placeholder="0.00"
            className="bg-background-card border-gray-800 text-white text-sm h-9 pr-32"
            readOnly
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
            {marginCurrency === 'USDT'
              ? `${formatNumber(marginInBTC, 8)} / ${formatNumber(mockAvailableBalance / marketPrice, 8)} BTC`
              : `${formatNumberInput(marginAmount.toFixed(2))} / ${formatNumberInput(mockAvailableBalance.toFixed(2))} USDT`
            }
          </div>
        </div>

        <div className="relative pt-3 pb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={marginPercent}
            onChange={handleMarginSliderChange}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #ff9b7a 0%, #ff9b7a ${marginPercent}%, #374151 ${marginPercent}%, #374151 100%)`
            }}
          />
          <div className="absolute -top-2 bg-trading-buy text-white text-xs font-semibold px-2 py-0.5 rounded"
               style={{left: `calc(${marginPercent}% - 18px)`}}>
            {marginPercent}%
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Margin</span>
            <span className="text-white">
              {formatNumberInput(marginAmount.toFixed(2))} / <span className="text-red-500">{formatNumberInput(mockAvailableBalance.toFixed(2))}</span>
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Est. Liq. Price (Long)</span>
              <span className="text-green-500">{formatPrice(liquidationPriceLong)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Est. Liq. Price (Short)</span>
              <span className="text-red-500">{formatPrice(liquidationPriceShort)}</span>
            </div>
          </div>
        </div>
      </div>


      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="tpsl"
            checked={tpslEnabled}
            onChange={(e) => setTpslEnabled(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-gray-900 border-gray-700"
          />
          <label htmlFor="tpsl" className="text-xs text-white">
            TP/SL
          </label>
        </div>
        {tpslEnabled && (
          <button className="text-xs text-blue-500 hover:text-blue-400">
            Advanced →
          </button>
        )}
      </div>


      {tpslEnabled && (
        <div className="space-y-3 bg-background-card p-3 rounded border border-gray-800">

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">TP Trigger Price (USDT)</label>
            <div className="relative">
              <input
                type="text"
                value={takeProfitPrice}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || isValidNumberInput(value)) {
                    setTakeProfitPrice(formatNumberInput(value))
                  }
                }}
                placeholder="0.00"
                className="w-full h-9 bg-background-card border border-gray-700 rounded px-3 text-sm text-white focus:outline-none focus:border-gray-600"
              />
              <div className="absolute right-0 top-0 h-full flex items-center">
                <Select value={tpPriceType} onValueChange={(value: TpSlPriceType) => setTpPriceType(value)}>
                  <SelectTrigger className="h-9 w-20 border-0 border-l border-gray-700 rounded-none rounded-r bg-transparent text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Last">Last</SelectItem>
                    <SelectItem value="Mark">Mark</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-col border-l border-gray-700 h-full">
                  <button
                    onClick={() => {
                      const currentPrice = parseNumberInput(takeProfitPrice) || 0
                      setTakeProfitPrice(formatNumberInput((currentPrice + (marketPrice * 0.001)).toFixed(2)))
                    }}
                    className="flex-1 px-1.5 hover:bg-gray-700 text-gray-400 hover:text-white text-xs"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => {
                      const currentPrice = parseNumberInput(takeProfitPrice) || 0
                      if (currentPrice > 0) {
                        setTakeProfitPrice(formatNumberInput(Math.max(0, currentPrice - (marketPrice * 0.001)).toFixed(2)))
                      }
                    }}
                    className="flex-1 px-1.5 hover:bg-gray-700 text-gray-400 hover:text-white text-xs border-t border-gray-700"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>


          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">SL Trigger Price (USDT)</label>
            <div className="relative">
              <input
                type="text"
                value={stopLossPrice}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || isValidNumberInput(value)) {
                    setStopLossPrice(formatNumberInput(value))
                  }
                }}
                placeholder="0.00"
                className="w-full h-9 bg-background-card border border-gray-700 rounded px-3 text-sm text-white focus:outline-none focus:border-gray-600"
              />
              <div className="absolute right-0 top-0 h-full flex items-center">
                <Select value={slPriceType} onValueChange={(value: TpSlPriceType) => setSlPriceType(value)}>
                  <SelectTrigger className="h-9 w-20 border-0 border-l border-gray-700 rounded-none rounded-r bg-transparent text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Last">Last</SelectItem>
                    <SelectItem value="Mark">Mark</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-col border-l border-gray-700 h-full">
                  <button
                    onClick={() => {
                      const currentPrice = parseNumberInput(stopLossPrice) || 0
                      setStopLossPrice(formatNumberInput((currentPrice + (marketPrice * 0.001)).toFixed(2)))
                    }}
                    className="flex-1 px-1.5 hover:bg-gray-700 text-gray-400 hover:text-white text-xs"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => {
                      const currentPrice = parseNumberInput(stopLossPrice) || 0
                      if (currentPrice > 0) {
                        setStopLossPrice(formatNumberInput(Math.max(0, currentPrice - (marketPrice * 0.001)).toFixed(2)))
                      }
                    }}
                    className="flex-1 px-1.5 hover:bg-gray-700 text-gray-400 hover:text-white text-xs border-t border-gray-700"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Available</span>
        <span className="text-white flex items-center gap-1">
          {formatNumberInput(mockAvailableBalance.toFixed(2))} USDT
          <svg className="w-3.5 h-3.5 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </div>


      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Max Open</span>
          <span className="text-green-500">{formatNumber(maxOpenLong, 4)} BTC</span>
        </div>
      </div>


      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Max Open</span>
        <span className="text-red-500">{formatNumber(maxOpenShort, 4)} BTC</span>
      </div>


      <div className="space-y-2.5 pt-2">
        <button
          onClick={handleBuyLong}
          className="w-full h-12 text-base font-medium bg-trading-buy hover:bg-trading-buy-hover text-white rounded transition-colors"
        >
          Buy/long
        </button>
        <button
          onClick={handleSellShort}
          className="w-full h-12 text-base font-medium bg-trading-sell hover:bg-trading-sell-hover text-white rounded transition-colors"
        >
          Sell/short
        </button>


        <div className="pt-2">
          <div className="text-center text-xs text-gray-400 mb-2">
            Available Funds <span className="text-white">{formatNumberInput(mockAvailableBalance.toFixed(2))} USDT</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-background-card border border-gray-800 hover:bg-background-elevated text-white text-xs py-2 rounded transition-colors">
              Deposite
            </button>
            <button className="bg-background-card border border-gray-800 hover:bg-background-elevated text-white text-xs py-2 rounded transition-colors">
              Transfer
            </button>
          </div>
        </div>
      </div>


      {marginAmount > 0 && (
        <div className="bg-background-card p-2.5 rounded border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Trading Fee ({orderType === 'limit' ? 'Maker' : 'Taker'})</span>
            <span className="text-white">
              ~${formatNumber((notionalValue * (orderType === 'limit' ? 0.0002 : 0.0005)), 2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Est. Slippage</span>
            <span className="text-white">
              ~${formatNumber((notionalValue * 0.0001), 2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-700">
            <span className="text-gray-400 font-medium">Total Cost</span>
            <span className="text-white font-medium">
              ~${formatNumber((notionalValue * (orderType === 'limit' ? 0.0002 : 0.0005)) + (notionalValue * 0.0001), 2)}
            </span>
          </div>
        </div>
      )}
      </div>


      {pendingOrder && currentPair && (
        <OrderConfirmModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onConfirm={handleConfirmOrder}
          orderType={pendingOrder.type}
          price={price ? parseNumberInput(price) : currentPair.lastPrice}
          amount={pendingOrder.type === 'buy' ? maxOpenLong : maxOpenShort}
          leverage={currentLeverage}
          symbol={currentPair.displayName}
          orderMode={orderType}
        />
      )}
    </div>
  )
}
