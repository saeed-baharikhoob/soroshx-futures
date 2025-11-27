export interface BaseWebSocketMessage {
  type: string
  pair: string
  timestamp?: number
}

export interface DepthUpdateMessage extends BaseWebSocketMessage {
  type: 'depth'
  asks: [string, string][]
  bids: [string, string][]
}

export interface TickerUpdateMessage extends BaseWebSocketMessage {
  type: 'tick'
  latest: string
  change: string
  high: string
  low: string
  vol: string
  turnover: string
}

export interface TradeUpdateMessage extends BaseWebSocketMessage {
  type: 'trade'
  price: string
  amount: string
  direction: 'buy' | 'sell'
  ts: number
}

export interface KlineUpdateMessage extends BaseWebSocketMessage {
  type: 'kline'
  kline: {
    time: number
    open: string
    high: string
    low: string
    close: string
    vol: string
  }
}

export type LBankWebSocketMessage =
  | DepthUpdateMessage
  | TickerUpdateMessage
  | TradeUpdateMessage
  | KlineUpdateMessage

