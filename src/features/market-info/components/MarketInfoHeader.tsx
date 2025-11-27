'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { formatPrice, formatVolume, formatPercentage, formatMarketCap, toLBankSymbol } from '@/lib/utils'
import { parseTickerData } from '@/lib/utils/ticker-utils'
import { TickerSwitcherModal } from './TickerSwitcherModal'
import { updateTicker } from '@/lib/redux/slices/marketSlice'
import { getLBankAPI } from '@/lib/api/lbankApi'
import { getLBankWebSocket } from '@/lib/websocket/lbankWebSocket'

export const MarketInfoHeader = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fundingCountdown, setFundingCountdown] = useState('')
  const triggerRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const { currentPair, ticker } = useAppSelector((state) => state.market)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const nowUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      )

      const fundingHours = [0, 8, 16]
      const currentHour = now.getUTCHours()

      let nextFundingHour = fundingHours.find(h => h > currentHour)
      if (!nextFundingHour) {
        nextFundingHour = 24 // Next day 00:00
      }

      const nextFunding = new Date(now)
      nextFunding.setUTCHours(nextFundingHour === 24 ? 0 : nextFundingHour, 0, 0, 0)
      if (nextFundingHour === 24) {
        nextFunding.setUTCDate(nextFunding.getUTCDate() + 1)
      }

      const diff = nextFunding.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setFundingCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!currentPair) return

    const fetchInitialTicker = async () => {
      try {
        const api = getLBankAPI()
        const lbankSymbol = toLBankSymbol(currentPair.symbol)
        const tickerData = await api.getTicker(lbankSymbol)

        dispatch(updateTicker(parseTickerData(tickerData.ticker, currentPair.symbol)))
      } catch (error) {
        console.error('Error fetching initial ticker:', error)
      }
    }

    fetchInitialTicker()

    const ws = getLBankWebSocket()
    const lbankSymbol = toLBankSymbol(currentPair.symbol)
    const channel = `tick.${lbankSymbol}`

    const handleTickerUpdate = (data: any) => {
      if (data.tick) {
        dispatch(updateTicker(parseTickerData(data.tick, currentPair.symbol)))
      }
    }

    ws.subscribe(channel, handleTickerUpdate)

    return () => {
      ws.unsubscribe(channel, handleTickerUpdate)
    }
  }, [currentPair, dispatch])

  if (!currentPair) return null

  const isPriceUp = (ticker?.priceChangePercent || currentPair.priceChangePercent24h) >= 0

  const calculateFundingRate = () => {
    const lastPrice = ticker?.lastPrice || currentPair.lastPrice
    const priceChange = ticker?.priceChange || currentPair.priceChange24h

    const baseFundingRate = 0.0001
    const volatility = Math.abs(priceChange / lastPrice)
    const volatilityAdjustment = volatility * 0.2
    const fundingRate = baseFundingRate + (priceChange > 0 ? volatilityAdjustment : -volatilityAdjustment)
    return Math.max(-0.0003, Math.min(0.0003, fundingRate))
  }

  const fundingRate = calculateFundingRate()

  return (
    <>
      <div className="flex items-center justify-between bg-background border-b border px-2 md:px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-3 md:gap-6 lg:gap-8">
          <div
            ref={triggerRef}
            className="flex items-center gap-2 cursor-pointer hover:bg-background-elevated/50 px-2 py-1 rounded transition-colors"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">
              ₿
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold text-md md:text-xl">
                {currentPair.baseAsset}/{currentPair.quoteAsset}
              </span>

              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex flex-col min-w-fit md:min-w-[150px]">
            <span className={`text-md md:text-xl lg:text-2xl font-bold ${isPriceUp ? 'text-trading-green' : 'text-trading-red'}`}>
              ${formatPrice(ticker?.lastPrice || currentPair.lastPrice)}
            </span>
            <span className="text-xs text-muted-foreground">Mark Price</span>
          </div>

          <div className="flex flex-col min-w-fit">
            <div className="text-xs md:text-sm text-muted-foreground">24h Change</div>
            <div className={`text-xs md:text-sm font-semibold ${isPriceUp ? 'text-trading-green' : 'text-trading-red'}`}>
              {formatPercentage(ticker?.priceChangePercent || currentPair.priceChangePercent24h)}
            </div>
          </div>

          <div className="hidden md:flex flex-col min-w-fit">
            <div className="text-xs md:text-sm text-muted-foreground">24h High</div>
            <div className="text-xs md:text-sm font-semibold text-white">
              {formatPrice(ticker?.high || currentPair.high24h)}
            </div>
          </div>

          <div className="hidden md:flex flex-col min-w-fit">
            <div className="text-xs md:text-sm text-muted-foreground">24h Low</div>
            <div className="text-xs md:text-sm font-semibold text-white">
              {formatPrice(ticker?.low || currentPair.low24h)}
            </div>
          </div>

          <div className="hidden lg:flex flex-col min-w-fit">
            <div className="text-sm text-muted-foreground">24h Volume({currentPair.baseAsset})</div>
            <div className="text-sm font-semibold text-white">
              {formatVolume(ticker?.volume || currentPair.volume24h)}
            </div>
          </div>

          <div className="hidden lg:flex flex-col min-w-fit">
            <div className="text-sm text-muted-foreground">24h Volume({currentPair.quoteAsset})</div>
            <div className="text-sm font-semibold text-white">
              {formatVolume(ticker?.quoteVolume || currentPair.quoteVolume24h)}
            </div>
          </div>

          <div className="hidden xl:flex flex-col min-w-fit">
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="text-sm font-semibold text-white">
              {formatMarketCap((ticker?.lastPrice || currentPair.lastPrice) * (ticker?.volume || currentPair.volume24h) * 1000)}
            </div>
          </div>

          <div className="hidden xl:flex flex-col min-w-fit">
            <div className="text-sm text-muted-foreground">Funding/Countdown</div>
            <div className={`text-sm font-semibold ${fundingRate >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
              {fundingRate >= 0 ? '+' : ''}{(fundingRate * 100).toFixed(4)}% / {fundingCountdown}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-trading-green font-semibold">2.33%</span>
          </div>
          <button className="p-2 hover:bg-background-elevated rounded">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <TickerSwitcherModal open={isModalOpen} onOpenChange={setIsModalOpen} triggerRef={triggerRef} />
    </>
  )
}
