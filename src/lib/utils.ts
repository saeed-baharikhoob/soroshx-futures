import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return formatNumber(price, 2)
  } else if (price >= 1) {
    return formatNumber(price, 4)
  } else {
    return formatNumber(price, 6)
  }
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(3)}B`
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`
  }
  return formatNumber(volume, 2)
}

export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(3)}T`
  } else if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(3)}B`
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  return `$${formatNumber(value, 2)}`
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${formatNumber(value, 2)}%`
}

export function toLBankSymbol(symbol: string): string {

  const normalized = symbol.toLowerCase()
  if (normalized.includes('usdt')) {
    return normalized.replace('usdt', '_usdt')
  }
  if (normalized.includes('usdc')) {
    return normalized.replace('usdc', '_usdc')
  }
  if (normalized.includes('eth')) {
    return normalized.replace('eth', '_eth')
  }
  return normalized
}

export function fromLBankSymbol(symbol: string): string {

  return symbol.replace('_', '').toUpperCase()
}

export function formatNumberInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '')

  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }

  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return parts.join('.')
}

export function parseNumberInput(value: string): number {
  const cleaned = value.replace(/,/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function isValidNumberInput(value: string): boolean {
  return /^[\d,]*\.?\d*$/.test(value)
}

export interface TpSlValidationParams {
  orderType: 'buy' | 'sell'
  entryPrice: number
  marketPrice: number
  takeProfitPrice: number | null
  stopLossPrice: number | null
}

export function validateTpSl(params: TpSlValidationParams): string | null {
  const { orderType, entryPrice, marketPrice, takeProfitPrice, stopLossPrice } = params

  if (orderType === 'buy') {
    if (takeProfitPrice && takeProfitPrice <= entryPrice) {
      return 'Take Profit must be higher than entry price for long positions'
    }
    if (stopLossPrice && stopLossPrice >= entryPrice) {
      return 'Stop Loss must be lower than entry price for long positions'
    }
  } else {
    if (takeProfitPrice && takeProfitPrice >= entryPrice) {
      return 'Take Profit must be lower than entry price for short positions'
    }
    if (stopLossPrice && stopLossPrice <= entryPrice) {
      return 'Stop Loss must be higher than entry price for short positions'
    }
  }

  if (takeProfitPrice) {
    const tpDeviation = Math.abs(takeProfitPrice - marketPrice) / marketPrice
    if (tpDeviation > 0.5) {
      return 'Take Profit is too far from market price. Maximum deviation is 50%.'
    }
  }
  if (stopLossPrice) {
    const slDeviation = Math.abs(stopLossPrice - marketPrice) / marketPrice
    if (slDeviation > 0.5) {
      return 'Stop Loss is too far from market price. Maximum deviation is 50%.'
    }
  }

  return null
}
