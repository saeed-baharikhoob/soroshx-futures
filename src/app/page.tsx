'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/lib/redux/hooks'
import { setCurrentPair, setPairs } from '@/lib/redux/slices/marketSlice'
import { setPositions, setOrders, setAvailableBalance } from '@/lib/redux/slices/tradingSlice'
import { getLBankAPI } from '@/lib/api/lbankApi'
import { TradingPair } from '@/types/trading'
import { DesktopTradingLayout } from '@/components/layout/DesktopTradingLayout'
import { MobileTradingLayout } from '@/components/layout/MobileTradingLayout'

export default function TradingPage() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTradingPairs = async (isInitial: boolean = false) => {
      try {
        const api = getLBankAPI()
        const tickers = await api.getAllTickers()

        const calculateFundingRate = (symbol: string, priceChange: number, lastPrice: number): number => {
          const baseFundingRate = 0.0001

          const volatility = Math.abs(priceChange / lastPrice)

          const volatilityAdjustment = volatility * 0.2
          const fundingRate = baseFundingRate + (priceChange > 0 ? volatilityAdjustment : -volatilityAdjustment)

          return Math.max(-0.0003, Math.min(0.0003, fundingRate))
        }

        const tradingPairs: TradingPair[] = tickers
          .filter((ticker) => ticker.symbol.includes('_usdt'))
          .map((ticker) => {
            const [base, quote] = ticker.symbol.split('_')
            const lastPrice = parseFloat(ticker.ticker.latest)
            const change = parseFloat(ticker.ticker.change)
            const symbol = ticker.symbol.replace('_', '').toUpperCase()

            return {
              symbol,
              baseAsset: base.toUpperCase(),
              quoteAsset: quote.toUpperCase(),
              displayName: `${base.toUpperCase()}/${quote.toUpperCase()}`,
              lastPrice,
              priceChange24h: change,
              priceChangePercent24h: (change / (lastPrice - change)) * 100,
              high24h: parseFloat(ticker.ticker.high),
              low24h: parseFloat(ticker.ticker.low),
              volume24h: parseFloat(ticker.ticker.vol),
              quoteVolume24h: parseFloat(ticker.ticker.turnover),
              fundingRate: calculateFundingRate(symbol, change, lastPrice),
              nextFundingTime: '04:37:00',
            }
          })
          .sort((a, b) => {
            const majorCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'AVAX']
            const aIndex = majorCoins.indexOf(a.baseAsset)
            const bIndex = majorCoins.indexOf(b.baseAsset)

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
            if (aIndex !== -1) return -1
            if (bIndex !== -1) return 1

            return b.quoteVolume24h - a.quoteVolume24h
          })
          .slice(0, 100)

        if (tradingPairs.length > 0) {
          dispatch(setPairs(tradingPairs))
          if (isInitial) {
            const btcPair = tradingPairs.find(p => p.symbol === 'BTCUSDT')
            dispatch(setCurrentPair(btcPair || tradingPairs[0]))
          }
        }

        if (isInitial) {
          dispatch(setPositions([]))
          dispatch(setOrders([]))
          dispatch(setAvailableBalance(0))
        }
      } catch (error) {
        console.error('Error fetching trading pairs:', error)
      } finally {
        if (isInitial) {
          setIsLoading(false)
        }
      }
    }

    fetchTradingPairs(true)

    const intervalId = setInterval(() => {
      fetchTradingPairs(false)
    }, 30000)

    return () => clearInterval(intervalId)
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="trading-page h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-2">SoroshX</div>
          <div className="text-gray-400">Loading market data...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="md:hidden">
        <MobileTradingLayout />
      </div>

      <div className="hidden md:block">
        <DesktopTradingLayout />
      </div>
    </>
  )
}
