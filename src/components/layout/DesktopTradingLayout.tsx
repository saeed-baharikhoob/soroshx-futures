import { MarketInfoHeader } from '@/features/market-info'
import { TradingForm } from '@/features/trading-form'
import { Orderbook } from '@/features/orderbook'
import { TradingViewChart } from '@/features/chart'
import { PositionsTable } from '@/features/positions'

export const DesktopTradingLayout = () => {
    return (
        <div className="h-screen flex flex-col bg-background">
            <MarketInfoHeader />

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="h-full grid grid-cols-[1fr_320px] lg:grid-cols-[1fr_320px]">
                    <div className="h-full ">
                        <div className="h-[680px] grid grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px]">
                            <div className="h-full">
                                <TradingViewChart />
                            </div>

                            <div className="h-full">
                                <Orderbook />
                            </div>
                        </div>

                        <div className="min-h-[300px] ">
                            <PositionsTable />
                        </div>
                    </div>

                    <div className="h-full overflow-hidden">
                        <TradingForm />
                    </div>
                </div>
            </div>
        </div>
    )
}