const LBANK_API_BASE = '/api/lbank'

export interface LBankTicker {
  symbol: string
  ticker: {
    high: string
    vol: string
    low: string
    change: string
    turnover: string
    latest: string
    timestamp: number
  }
}

export interface LBankDepth {
  asks: [string, string][]
  bids: [string, string][]
  timestamp: number
}

export interface LBankKline {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export class LBankAPI {
  private baseUrl: string

  constructor(baseUrl: string = LBANK_API_BASE) {
    this.baseUrl = baseUrl
  }

  async getTicker(symbol: string): Promise<LBankTicker> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ticker?symbol=${symbol.toLowerCase()}`
      )
      const data = await response.json()

      if (data && data.data && data.data.length > 0) {
        return data.data[0]
      }

      throw new Error('Invalid ticker data')
    } catch (error) {
      console.error('Error fetching ticker:', error)
      throw error
    }
  }

  async getDepth(symbol: string, size: number = 60): Promise<LBankDepth> {
    try {
      const response = await fetch(
        `${this.baseUrl}/depth?symbol=${symbol.toLowerCase()}&size=${size}`
      )
      const data = await response.json()

      if (data && data.data) {
        return {
          asks: data.data.asks || [],
          bids: data.data.bids || [],
          timestamp: Date.now(),
        }
      }

      throw new Error('Invalid depth data')
    } catch (error) {
      console.error('Error fetching depth:', error)
      throw error
    }
  }

  async getKlines(
    symbol: string,
    interval: string,
    limit: number = 500
  ): Promise<LBankKline[]> {
    try {
      const intervalMap: Record<string, string> = {
        '1m': 'minute1',
        '3m': 'minute5',
        '5m': 'minute5',
        '15m': 'minute15',
        '30m': 'minute30',
        '1h': 'hour1',
        '4h': 'hour4',
        '1d': 'day1',
        '1w': 'week1',
      }

      const lbankInterval = intervalMap[interval] || 'hour1'

      const response = await fetch(
        `${this.baseUrl}/kline?symbol=${symbol.toLowerCase()}&size=${limit}&type=${lbankInterval}`
      )
      const data = await response.json()

      if (data && data.data) {
        return data.data.map((k: any) => ({
          time: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        }))
      }

      return []
    } catch (error) {
      console.error('Error fetching klines:', error)
      return []
    }
  }

  async getAllTickers(): Promise<LBankTicker[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker?all=true`)
      const data = await response.json()

      if (data && data.data) {
        return data.data
      }

      return []
    } catch (error) {
      console.error('Error fetching all tickers:', error)
      return []
    }
  }
}

let lbankApi: LBankAPI | null = null

export const getLBankAPI = (): LBankAPI => {
  if (!lbankApi) {
    lbankApi = new LBankAPI()
  }
  return lbankApi
}
