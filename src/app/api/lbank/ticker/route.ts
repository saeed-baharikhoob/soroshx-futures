import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const all = searchParams.get('all')

  try {
    let url: string

    if (all === 'true') {
      url = 'https://www.lbkex.net/v2/ticker/24hr.do?symbol=all'
    } else if (symbol) {
      url = `https://www.lbkex.net/v2/ticker/24hr.do?symbol=${symbol}`
    } else {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 })
    }

    const response = await fetch(url)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ticker' }, { status: 500 })
  }
}
