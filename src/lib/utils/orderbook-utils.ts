import { OrderbookEntry } from '@/types/trading'

interface RawOrderbookEntry {
  bids: [string, string][]
  asks: [string, string][]
}

export const parseOrderbookEntries = (depth: RawOrderbookEntry, limit: number = 20) => {
  const bids: OrderbookEntry[] = depth.bids.slice(0, limit).map((bid) => ({
    price: parseFloat(bid[0]),
    amount: parseFloat(bid[1]),
    total: parseFloat(bid[0]) * parseFloat(bid[1]),
  }))

  const asks: OrderbookEntry[] = depth.asks
    .slice(0, limit)
    .map((ask) => ({
      price: parseFloat(ask[0]),
      amount: parseFloat(ask[1]),
      total: parseFloat(ask[0]) * parseFloat(ask[1]),
    }))
    .sort((a, b) => a.price - b.price)

  return { bids, asks }
}
