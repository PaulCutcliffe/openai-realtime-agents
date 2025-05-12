import { NextResponse } from 'next/server';

// Helper function to construct Basic Auth header
function getAuthHeader(username: string, password_DO_NOT_LOG: string): string {
  const credentials = Buffer.from(`${username}:${password_DO_NOT_LOG}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const password_DO_NOT_LOG = searchParams.get('password'); // IMPORTANT: Do not log this password

  const keyword = searchParams.get('keyword');
  const author = searchParams.get('author');
  const productTypeParam = searchParams.get('productType');

  if (!username || !password_DO_NOT_LOG) {
    return NextResponse.json({ error: 'Missing Gardners API credentials' }, { status: 400 });
  }

  if (!keyword && !author && !productTypeParam) {
    return NextResponse.json({ error: 'At least one search criterion (keyword, author, productType) must be provided' }, { status: 400 });
  }

  const searchPayload: any = {
    ItemsPerPage: 10, // Defaulting to 10, can be made configurable
    PageNumber: 1,   // Defaulting to page 1
  };

  if (keyword) {
    searchPayload.Keyword = keyword;
  }
  if (author) {
    searchPayload.Author = author;
  }
  if (productTypeParam) {
    const productType = parseInt(productTypeParam, 10);
    if (isNaN(productType)) {
      return NextResponse.json({ error: 'Invalid ProductType. Must be an integer.' }, { status: 400 });
    }
    searchPayload.ProductType = productType;
  }

  try {
    const gardnersResponse = await fetch('https://gws.gardners.com/api/Search/Results/1', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(username, password_DO_NOT_LOG),
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(searchPayload),
    });

    if (!gardnersResponse.ok) {
      // Try to get error details from Gardners response
      let errorBody = null;
      try {
        errorBody = await gardnersResponse.json();
      } catch (e) {
        // Ignore if error response is not JSON
      }
      console.error('Gardners API Error:', gardnersResponse.status, errorBody);
      return NextResponse.json(
        { 
          error: `Gardners API request failed with status ${gardnersResponse.status}`,
          details: errorBody 
        }, 
        { status: gardnersResponse.status }
      );
    }

    const data = await gardnersResponse.json();
    // The Gardners API returns { TotalCount: number, Items: [] }
    // We will return this structure directly.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error calling Gardners Search API:', error);
    return NextResponse.json({ error: 'Failed to call Gardners Search API', details: error.message }, { status: 500 });
  }
}
