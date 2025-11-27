import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Position, Order } from '@/types/trading'

interface TradingState {
  positions: Position[]
  orders: Order[]
  leverage: number
  orderType: 'limit' | 'market'
  availableBalance: number
  selectedPrice: number | null
}

const initialState: TradingState = {
  positions: [],
  orders: [],
  leverage: 10,
  orderType: 'limit',
  availableBalance: 0,
  selectedPrice: null,
}

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setPositions: (state, action: PayloadAction<Position[]>) => {
      state.positions = action.payload
    },
    addPosition: (state, action: PayloadAction<Position>) => {
      state.positions.push(action.payload)
    },
    updatePosition: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Position> }>
    ) => {
      const position = state.positions.find((p) => p.id === action.payload.id)
      if (position) {
        Object.assign(position, action.payload.updates)
      }
    },
    removePosition: (state, action: PayloadAction<string>) => {
      state.positions = state.positions.filter((p) => p.id !== action.payload)
    },
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload
    },
    removeOrder: (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter((o) => o.id !== action.payload)
    },
    setLeverage: (state, action: PayloadAction<number>) => {
      state.leverage = action.payload
    },
    setOrderType: (state, action: PayloadAction<'limit' | 'market'>) => {
      state.orderType = action.payload
    },
    setAvailableBalance: (state, action: PayloadAction<number>) => {
      state.availableBalance = action.payload
    },
    setSelectedPrice: (state, action: PayloadAction<number | null>) => {
      state.selectedPrice = action.payload
    },
  },
})

export const {
  setPositions,
  addPosition,
  updatePosition,
  removePosition,
  setOrders,
  removeOrder,
  setLeverage,
  setOrderType,
  setAvailableBalance,
  setSelectedPrice,
} = tradingSlice.actions

export default tradingSlice.reducer
