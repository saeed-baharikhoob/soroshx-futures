import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const type = searchParams.get('type')
  const size = searchParams.get('size') || '500'

  if (!symbol || !type) {
    return NextResponse.json({ error: 'Symbol and type are required' }, { status: 400 })
  }

  try {
    const intervalSeconds: Record<string, number> = {
      'minute1': 60,
      'minute5': 300,
      'minute15': 900,
      'minute30': 1800,
      'hour1': 3600,
      'hour4': 14400,
      'hour8': 28800,
      'day1': 86400,
      'week1': 604800,
    }

    const sizeNum = parseInt(size)
    const secondsPerCandle = intervalSeconds[type] || 3600
    const time = Math.floor(Date.now() / 1000) - (sizeNum * secondsPerCandle)

    const response = await fetch(
      `https://api.lbkex.com/v1/kline.do?symbol=${symbol}&size=${size}&type=${type}&time=${time}`
    )

    const data = await response.json()

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch kline' }, { status: 500 })
  }
}
