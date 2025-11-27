'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { setCurrentPair, toggleFavorite } from '@/lib/redux/slices/marketSlice'
import { formatPrice, formatPercentage } from '@/lib/utils'
import { TradingPair } from '@/types/trading'

interface TickerSwitcherModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    triggerRef?: React.RefObject<HTMLDivElement | null>
}

export const TickerSwitcherModal = ({ open, onOpenChange, triggerRef }: TickerSwitcherModalProps) => {
    const dispatch = useAppDispatch()
    const { pairs, favorites } = useAppSelector((state) => state.market)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('USD⊖-M')
    const [isMobile, setIsMobile] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (open && !isMobile && triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left
            })
        }
    }, [open, isMobile])

    const filteredPairs = useMemo(() => {
        let result = pairs


        if (searchQuery) {
            result = result.filter((pair) =>
                pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pair.baseAsset.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }


        if (activeTab === 'Favorites') {
            result = result.filter((pair) => favorites.includes(pair.symbol))
        } else if (activeTab === 'USD⊖-M') {
            result = result.filter((pair) => pair.quoteAsset === 'USDT')
        }

        return result
    }, [pairs, searchQuery, activeTab, favorites])

    const handlePairSelect = (pair: TradingPair) => {
        dispatch(setCurrentPair(pair))
        onOpenChange(false)
    }

    const handleToggleFavorite = (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(toggleFavorite(symbol))
    }

    const dropdownRef = useRef<HTMLDivElement>(null)
    const scrollPositionRef = useRef<number>(0)
    const listContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (listContainerRef.current && scrollPositionRef.current > 0) {
            listContainerRef.current.scrollTop = scrollPositionRef.current
        }
    })

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        scrollPositionRef.current = e.currentTarget.scrollTop
    }

    useEffect(() => {
        if (isMobile || !open) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement

            if (dropdownRef.current?.contains(target)) {
                return
            }

            if (triggerRef?.current?.contains(target)) {
                return
            }

            onOpenChange(false)
        }

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 100)

        return () => {
            clearTimeout(timeoutId)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open, isMobile, onOpenChange])

    if (!open) return null

    if (isMobile) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="!fixed !bottom-0 !left-0 !right-0 !top-auto !translate-x-0 !translate-y-0 rounded-t-2xl border-t border-l border-r bg-background-card text-white p-0 max-h-[85vh] overflow-hidden !m-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
                    style={{
                        margin: 0,
                        maxWidth: '100%',
                        transform: 'translateX(0) translateY(0)'
                    }}
                >
                    <DialogHeader className="p-4 pb-2 border-b border-border">
                        <DialogTitle className="text-left text-lg font-semibold">Select Trading Pair</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[75vh]">
                        <div className="space-y-3 p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-background-elevated border text-white placeholder:text-muted-foreground"
                                />
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="bg-background w-full justify-start">
                                    <TabsTrigger value="Favorites">Favorites</TabsTrigger>
                                    <TabsTrigger value="USD⊖-M">USD⊖-M</TabsTrigger>
                                </TabsList>

                                <TabsContent value={activeTab} className="mt-3">
                                    <div className="space-y-1">
                                        {filteredPairs.map((pair) => {
                                            const isFavorite = favorites.includes(pair.symbol)
                                            const isPriceUp = pair.priceChangePercent24h >= 0

                                            return (
                                                <div
                                                    key={pair.symbol}
                                                    onClick={() => handlePairSelect(pair)}
                                                    className="pair-row-item flex items-center justify-between p-3 hover:bg-background-elevated cursor-pointer transition-colors rounded-lg"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <button
                                                            onClick={(e) => handleToggleFavorite(pair.symbol, e)}
                                                            className="hover:scale-110 transition-transform"
                                                        >
                                                            <Star
                                                                className={`w-4 h-4 ${
                                                                    isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                                                                }`}
                                                            />
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-base">{pair.symbol}</span>
                                                                <span className="text-xs text-muted-foreground bg-background-elevated px-1.5 py-0.5 rounded">Perp</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                Vol {formatPrice(pair.volume24h)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="font-semibold text-base">
                                                            {formatPrice(pair.lastPrice)}
                                                        </div>
                                                        <div className={`text-sm ${isPriceUp ? 'text-trading-green' : 'text-trading-red'}`}>
                                                            {formatPercentage(pair.priceChangePercent24h)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {filteredPairs.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No trading pairs found
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }


    return (
        <div
            ref={dropdownRef}
            className="fixed w-[600px] bg-background-card border border-border rounded-lg shadow-2xl p-4 h-[700px] overflow-hidden "
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                zIndex: 9999,
                pointerEvents: 'auto'
            }}
        >
            <div className="space-y-3">

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background-elevated border text-white placeholder:text-muted-foreground"
                    />
                </div>


                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-background border-b border-gray-800 w-full justify-start rounded-none p-0">
                        <TabsTrigger
                            value="Favorites"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 rounded-none"
                        >
                            Favorites
                        </TabsTrigger>
                        <TabsTrigger
                            value="USD⊖-M"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 rounded-none"
                        >
                            USD⊖-M
                        </TabsTrigger>
                    </TabsList>


                    <TabsContent value={activeTab} className="mt-0 pt-2">
                        <div
                            ref={listContainerRef}
                            onScroll={handleScroll}
                            className="space-y-0 max-h-[580px] overflow-y-auto custom-scrollbar"
                        >

                            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs text-muted-foreground sticky top-0 bg-background-card">
                                <div>Symbol ⚙ / Vol ⚙</div>
                                <div className="text-right">Last Price ⚙</div>
                                <div className="text-right">24h Chg ⚙</div>
                                <div className="text-right">Funding Rate ⚙</div>
                            </div>


                            {filteredPairs.map((pair) => {
                                const isFavorite = favorites.includes(pair.symbol)
                                const isPriceUp = pair.priceChangePercent24h >= 0

                                return (
                                    <div
                                        key={pair.symbol}
                                        onClick={() => handlePairSelect(pair)}
                                        className="pair-row-item grid grid-cols-4 gap-4 px-4 py-2.5 hover:bg-background-elevated cursor-pointer transition-colors items-center"
                                    >

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleToggleFavorite(pair.symbol, e)}
                                                className="hover:scale-110 transition-transform"
                                            >
                                                <Star
                                                    className={`w-4 h-4 ${
                                                        isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                                                    }`}
                                                />
                                            </button>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-sm">{pair.symbol}</span>
                                                    <span className="text-xs text-muted-foreground bg-background-elevated px-1.5 py-0.5 rounded">Perp</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Vol {formatPrice(pair.volume24h)}
                                                </div>
                                            </div>
                                        </div>


                                        <div className="text-right">
                                            {formatPrice(pair.lastPrice)}
                                        </div>


                                        <div className={`text-right ${isPriceUp ? 'text-trading-green' : 'text-trading-red'}`}>
                                            {formatPercentage(pair.priceChangePercent24h)}
                                        </div>


                                        <div className="text-right text-sm">
                                            {pair.fundingRate
                                                ? `${(pair.fundingRate * 100).toFixed(5)}%`
                                                : '0.00100%'}
                                        </div>
                                    </div>
                                )
                            })}

                            {filteredPairs.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    No trading pairs found
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
