import { Buffer } from 'buffer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ean = req.nextUrl.searchParams.get('ean');
  const username = req.nextUrl.searchParams.get('username');
  const password = req.nextUrl.searchParams.get('password');

  if (!ean) {
    return NextResponse.json({ error: 'Missing EAN parameter' }, { status: 400 });
  }
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing Gardners API credentials in request' }, { status: 400 });
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