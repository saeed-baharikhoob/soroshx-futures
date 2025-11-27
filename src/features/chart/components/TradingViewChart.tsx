'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useAppSelector } from '@/lib/redux/hooks'

const TIMEFRAMES = [
  { label: 'Time', value: 'time', tvInterval: '1' },
  { label: '1m', value: '1m', tvInterval: '1' },
  { label: '3m', value: '3m', tvInterval: '3' },
  { label: '5m', value: '5m', tvInterval: '5' },
  { label: '1H', value: '1h', tvInterval: '60' },
  { label: '4H', value: '4h', tvInterval: '240' },
  { label: '1D', value: '1d', tvInterval: 'D' },
  { label: '1W', value: '1w', tvInterval: 'W' },
]

declare global {
  interface Window {
    TradingView: any
  }
}

export const TradingViewChart = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d')
  const [containerId] = useState(`tradingview_${Math.random().toString(36).substr(2, 9)}`)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const { currentPair } = useAppSelector((state) => state.market)

  useEffect(() => {
    return () => {
      if (widgetRef.current) {
        try {
          const iframe = widgetRef.current.iframe
          if (iframe && iframe.parentNode) {
            widgetRef.current.remove()
          }
        } catch (error) {
          console.debug('Chart cleanup error (expected on tab switch):', error)
        }
        widgetRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (scriptLoaded && window.TradingView && currentPair) {
      initWidget()
    }
  }, [scriptLoaded, currentPair, selectedTimeframe])

  useEffect(() => {
    const handleResize = () => {
      if (widgetRef.current && containerRef.current) {
        if (window.TradingView && currentPair) {
          initWidget()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentPair, selectedTimeframe])

  const initWidget = () => {
    if (!containerRef.current || !window.TradingView || !currentPair) return

    if (widgetRef.current) {
      try {
        const iframe = widgetRef.current.iframe
        if (iframe && iframe.parentNode) {
          widgetRef.current.remove()
        }
      } catch (error) {
        console.debug('Chart widget removal error:', error)
      }
      widgetRef.current = null
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }

    const timeframe = TIMEFRAMES.find(tf => tf.value === selectedTimeframe)

    const height = containerRef.current.clientHeight - 50
    const width = containerRef.current.clientWidth

    widgetRef.current = new window.TradingView.widget({
      width: width,
      height: height,
      fullscreen: false,
      autosize: false,
      symbol: `BINANCE:${currentPair.symbol}`,
      interval: timeframe?.tvInterval || 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#0a0a0f',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: containerId,
      backgroundColor: '#0a0a0f',
      gridColor: '#1f2937',
      hide_side_toolbar: false,
      allow_symbol_change: false,
      studies: [],
      overrides: {
        'paneProperties.background': '#0a0a0f',
        'paneProperties.backgroundType': 'solid',
        'scalesProperties.textColor': '#d1d5db',
        'scalesProperties.lineColor': '#1f2937',
      },
      disabled_features: [
        'header_symbol_search',
        'header_compare',
        'header_undo_redo',
        'header_screenshot',
        'header_saveload',
      ],
      enabled_features: [
        'hide_left_toolbar_by_default',
      ],
      show_popup_button: false,
      popup_width: '1000',
      popup_height: '650',
      time_frames: [
        { text: "1m", resolution: "1" },
        { text: "5m", resolution: "5" },
        { text: "1h", resolution: "60" },
        { text: "1d", resolution: "D" },
      ],
    })
  }

  return (
    <>
      <Script
        src="https://s3.tradingview.com/tv.js"
        strategy="lazyOnload"
        onLoad={() => {
          setScriptLoaded(true)
          if (window.TradingView && currentPair) {
            initWidget()
          }
        }}
      />
      <div className="flex flex-col h-full bg-background ">
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 flex-shrink-0">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setSelectedTimeframe(tf.value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedTimeframe === tf.value
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div
          ref={containerRef}
          id={containerId}
          className="flex-1 relative"
          style={{ minHeight: 0, paddingBottom: '40px' }}
        />
      </div>
    </>
  )
}
