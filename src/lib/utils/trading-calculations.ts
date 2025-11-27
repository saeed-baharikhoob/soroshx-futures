export const calculatePnl = (
  side: 'long' | 'short',
  entryPrice: number,
  currentPrice: number,
  size: number
): number => {
  return side === 'long'
    ? (currentPrice - entryPrice) * size
    : (entryPrice - currentPrice) * size
}

export const calculatePnlPercent = (pnl: number, margin: number): number => {
  if (margin === 0) return 0
  return (pnl / margin) * 100
}

export const calculateLiquidationPrice = (
  side: 'long' | 'short',
  entryPrice: number,
  leverage: number,
  maintenanceMarginFactor: number = 0.9
): number => {
  if (side === 'long') {
    return entryPrice * (1 - (1 / leverage) * maintenanceMarginFactor)
  }
  return entryPrice * (1 + (1 / leverage) * maintenanceMarginFactor)
}
