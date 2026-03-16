import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'Missing ticker' }, { status: 400 })

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 }, // cache 5 min
    })

    if (!res.ok) return NextResponse.json({ error: `Yahoo Finance returned ${res.status}` }, { status: 502 })

    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (!price) return NextResponse.json({ error: 'Price not found' }, { status: 404 })

    return NextResponse.json({ ticker: ticker.toUpperCase(), price })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 })
  }
}
