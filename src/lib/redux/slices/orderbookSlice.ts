import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Orderbook, OrderbookEntry } from '@/types/trading'

interface OrderbookState {
  orderbook: Orderbook | null
  aggregation: number
  isLoading: boolean
}

const initialState: OrderbookState = {
  orderbook: null,
  aggregation: 0.01,
  isLoading: false,
}

const orderbookSlice = createSlice({
  name: 'orderbook',
  initialState,
  reducers: {
    setOrderbook: (state, action: PayloadAction<Orderbook>) => {
      state.orderbook = action.payload
      state.isLoading = false
    },
    updateOrderbook: (
      state,
      action: PayloadAction<{ bids?: OrderbookEntry[]; asks?: OrderbookEntry[] }>
    ) => {
      if (state.orderbook) {
        if (action.payload.bids) {
          state.orderbook.bids = action.payload.bids
        }
        if (action.payload.asks) {
          state.orderbook.asks = action.payload.asks
        }
      }
    },
    setAggregation: (state, action: PayloadAction<number>) => {
      state.aggregation = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    clearOrderbook: (state) => {
      state.orderbook = null
    },
  },
})

export const {
  setOrderbook,
  updateOrderbook,
  setAggregation,
  setLoading,
  clearOrderbook,
} = orderbookSlice.actions

export default orderbookSlice.reducer
