export const parseTickerData = (tickerData: any, symbol: string) => {
  return {
    symbol,
    lastPrice: parseFloat(tickerData.latest),
    priceChange: parseFloat(tickerData.change),
    priceChangePercent: (parseFloat(tickerData.change) / (parseFloat(tickerData.latest) - parseFloat(tickerData.change))) * 100,
    high: parseFloat(tickerData.high),
    low: parseFloat(tickerData.low),
    volume: parseFloat(tickerData.vol),
    quoteVolume: parseFloat(tickerData.turnover),
  }
}
