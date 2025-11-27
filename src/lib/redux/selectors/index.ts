import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { calculatePnl, calculatePnlPercent } from '@/lib/utils/trading-calculations'

const selectPositions = (state: RootState) => state.trading.positions
const selectOrders = (state: RootState) => state.trading.orders
const selectTicker = (state: RootState) => state.market.ticker
const selectCurrentPair = (state: RootState) => state.market.currentPair
const selectPairs = (state: RootState) => state.market.pairs
const selectFavorites = (state: RootState) => state.market.favorites

export const selectPositionsWithPnl = createSelector(
  [selectPositions, selectTicker],
  (positions, ticker) => {
    return positions.map(position => {
      const currentPrice = ticker?.symbol === position.symbol
        ? ticker.lastPrice
        : position.markPrice

      const unrealizedPnl = calculatePnl(
        position.side,
        position.entryPrice,
        currentPrice,
        position.size
      )
      const unrealizedPnlPercent = calculatePnlPercent(unrealizedPnl, position.margin)

      return {
        ...position,
        markPrice: currentPrice,
        unrealizedPnl,
        unrealizedPnlPercent
      }
    })
  }
)

export const selectFavoritePairs = createSelector(
  [selectPairs, selectFavorites],
  (pairs, favorites) => {
    return pairs.filter(pair => favorites.includes(pair.symbol))
  }
)

export const makeSelectFilteredPairs = () => {
  return createSelector(
    [
      selectPairs,
      selectFavorites,
      (_state: RootState, searchQuery: string) => searchQuery,
      (_state: RootState, _searchQuery: string, activeTab: string) => activeTab
    ],
    (pairs, favorites, searchQuery, activeTab) => {
      let filtered = pairs

      if (activeTab === 'favorites') {
        filtered = filtered.filter(pair => favorites.includes(pair.symbol))
      } else if (activeTab === 'usd') {
        filtered = filtered.filter(pair => pair.quoteAsset === 'USDT')
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(pair =>
          pair.symbol.toLowerCase().includes(query) ||
          pair.baseAsset.toLowerCase().includes(query)
        )
      }

      return filtered
    }
  )
}
