import { configureStore } from '@reduxjs/toolkit'
import marketReducer from './slices/marketSlice'
import orderbookReducer from './slices/orderbookSlice'
import tradingReducer from './slices/tradingSlice'

export const store = configureStore({
  reducer: {
    market: marketReducer,
    orderbook: orderbookReducer,
    trading: tradingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
