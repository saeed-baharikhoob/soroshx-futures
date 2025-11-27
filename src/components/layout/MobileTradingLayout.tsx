'use client'

import { useState } from 'react'
import { MarketInfoHeader } from '@/features/market-info'
import { TradingViewChart } from '@/features/chart'
import { Orderbook } from '@/features/orderbook'
import { PositionsTable } from '@/features/positions'
import { TradingForm } from '@/features/trading-form'
import { BottomSheet } from '@/components/shared/BottomSheet'

type MobileTab = 'chart' | 'orderbook' | 'positions'

export const MobileTradingLayout = () => {
    const [activeTab, setActiveTab] = useState<MobileTab>('chart')
    const [isTradeSheetOpen, setIsTradeSheetOpen] = useState(false)

    return (
        <div className="h-screen flex flex-col bg-background">
            <MarketInfoHeader />

            <div className="flex-1 overflow-hidden relative">
                <div
                    style={{ display: activeTab === 'chart' ? 'block' : 'none', height: '100%' }}
                >
                    <TradingViewChart />
                </div>
                <div
                    style={{ display: activeTab === 'orderbook' ? 'block' : 'none', height: '100%' }}
                >
                    <Orderbook />
                </div>
                <div
                    style={{ display: activeTab === 'positions' ? 'block' : 'none', height: '100%' }}
                >
                    <PositionsTable />
                </div>
            </div>

            <div className="flex absolute bottom-0 right-0 w-full border-t border-border bg-background-card">
                <button
                    onClick={() => setActiveTab('chart')}
                    className={`flex-1 py-3 text-sm ${
                        activeTab === 'chart' ? 'text-white border-t-2 border-blue-500' : 'text-gray-500'
                    }`}
                >
                    Chart
                </button>
                <button
                    onClick={() => setActiveTab('orderbook')}
                    className={`flex-1 py-3 text-sm ${
                        activeTab === 'orderbook' ? 'text-white border-t-2 border-blue-500' : 'text-gray-500'
                    }`}
                >
                    Orderbook
                </button>
                <button
                    onClick={() => setActiveTab('positions')}
                    className={`flex-1 py-3 text-sm ${
                        activeTab === 'positions' ? 'text-white border-t-2 border-blue-500' : 'text-gray-500'
                    }`}
                >
                    Positions
                </button>
                <button
                    onClick={() => setIsTradeSheetOpen(true)}
                    className="flex-1 py-3 text-sm bg-trading-buy text-white font-medium"
                >
                    Trade
                </button>
            </div>

            <BottomSheet
                isOpen={isTradeSheetOpen}
                onClose={() => setIsTradeSheetOpen(false)}
                title="Place Order"
            >
                <TradingForm onOrderComplete={() => setIsTradeSheetOpen(false)} />
            </BottomSheet>
        </div>
    )
}
