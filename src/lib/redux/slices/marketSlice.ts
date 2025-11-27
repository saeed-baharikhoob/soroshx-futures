import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TradingPair, Ticker } from '@/types/trading'

interface MarketState {
  currentPair: TradingPair | null
  pairs: TradingPair[]
  ticker: Ticker | null
  favorites: string[]
}

const initialState: MarketState = {
  currentPair: null,
  pairs: [],
  ticker: null,
  favorites: [],
}

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setCurrentPair: (state, action: PayloadAction<TradingPair>) => {
      state.currentPair = action.payload
    },
    setPairs: (state, action: PayloadAction<TradingPair[]>) => {
      state.pairs = action.payload
    },
    setTicker: (state, action: PayloadAction<Ticker>) => {
      state.ticker = action.payload
    },
    updateTicker: (state, action: PayloadAction<Partial<Ticker>>) => {
      if (state.ticker) {
        state.ticker = { ...state.ticker, ...action.payload }
      } else {
        state.ticker = action.payload as Ticker
      }
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const symbol = action.payload
      const index = state.favorites.indexOf(symbol)
      if (index > -1) {
        state.favorites.splice(index, 1)
      } else {
        state.favorites.push(symbol)
      }
    },
    setFavorites: (state, action: PayloadAction<string[]>) => {
      state.favorites = action.payload
    },
  },
})

export const {
  setCurrentPair,
  setPairs,
  setTicker,
  updateTicker,
  toggleFavorite,
  setFavorites,
} = marketSlice.actions

export default marketSlice.reducer
