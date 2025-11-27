export interface TradingPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  displayName: string
  lastPrice: number
  priceChange24h: number
  priceChangePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  quoteVolume24h: number
  fundingRate?: number
  nextFundingTime?: string
  isFavorite?: boolean
}

export interface OrderbookEntry {
  price: number
  amount: number
  total: number
}

export interface Orderbook {
  symbol: string
  bids: OrderbookEntry[]
  asks: OrderbookEntry[]
  lastUpdateId: number
}

export interface Ticker {
  symbol: string
  lastPrice: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
  quoteVolume: number
  openTime: number
  closeTime: number
}

export interface Trade {
  id: string
  price: number
  quantity: number
  time: number
  isBuyerMaker: boolean
}

export interface Position {
  id: string
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  markPrice: number
  liquidationPrice: number
  margin: number
  leverage: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  takeProfitPrice?: number
  stopLossPrice?: number
  tpPriceType?: 'Last' | 'Mark'
  slPriceType?: 'Last' | 'Mark'
}

export type TpSlPriceType = 'Last' | 'Mark'

export interface Order {
  id: string
  symbol: string
  type: 'limit' | 'market'
  side: 'buy' | 'sell'
  price: number
  quantity: number
  filled: number
  status: 'open' | 'filled' | 'cancelled'
  timestamp: number
}
