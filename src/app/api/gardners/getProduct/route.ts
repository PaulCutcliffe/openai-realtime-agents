import { Buffer } from 'buffer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ean = req.nextUrl.searchParams.get('ean');
  if (!ean) {
    return NextResponse.json({ error: 'Missing EAN parameter' }, { status: 400 });
  }
  const username = process.env.GARDNERS_API_USERNAME;
  const password = process.env.GARDNERS_API_PASSWORD;
  if (!username || !password) {
    return NextResponse.json({ error: 'Gardners API credentials not configured' }, { status: 500 });
  }
  const url = `https://gws.gardners.com/api/Product/GetProduct/?EAN=${ean}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching Gardners API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}