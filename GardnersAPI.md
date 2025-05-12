## Overview

The Gardners Books API exposes a search endpoint at:

```
POST https://gws.gardners.com/api/Search/Results/1
```

You authenticate via HTTP Basic, send a JSON payload describing your search criteria (e.g. keyword, author), and receive a JSON response containing `TotalCount` and an array of matching items. Below is basic documentation to help you integrate this into your application.

---

## 1. Authentication

All requests must include an `Authorization` header using Basic authentication. Store your credentials in environment variables (as in your tests):

```bash
export GARDNERS_USER='yourUsername'
export GARDNERS_PASS='yourPassword'
```

In code, construct the header:

```js
const credentials = Buffer.from(`${process.env.GARDNERS_USER}:${process.env.GARDNERS_PASS}`).toString('base64');
const headers = {
  'Authorization': `Basic ${credentials}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json; charset=utf-8'
};
```

---

## 2. Search Endpoint

```
POST https://gws.gardners.com/api/Search/Results/1
```

* **Method:** `POST`
* **URL path:** `/api/Search/Results/1`
* **Protocol:** HTTPS

---

## 3. Request Format

### Headers

| Header        | Value                             |
| ------------- | --------------------------------- |
| Accept        | `application/json`                |
| Content-Type  | `application/json; charset=utf-8` |
| Authorization | `Basic <base64-credentials>`      |

### JSON Body

The body must be a JSON object specifying your search parameters. The only required fields are `ItemsPerPage` and `PageNumber`. You supply one or more filtering keys:

| Field        | Type    | Description                             |
| ------------ | ------- | --------------------------------------- |
| Keyword      | string  | Full-text search term (title, keywords) |
| Author       | string  | Author name filter                      |
| ProductType  | integer | Numeric code for product category       |
| ItemsPerPage | integer | Maximum results per page (e.g. 100)     |
| PageNumber   | integer | Page index (starts at 1)                |

#### Example Bodies

* **Keyword-only search**

  ```json
  {
    "Keyword": "Harry Potter",
    "ItemsPerPage": 100,
    "PageNumber": 1
  }
  ```

* **Filtered search (author + type)**

  ```json
  {
    "Author": "Richard Dawkins",
    "ProductType": 2,
    "ItemsPerPage": 100,
    "PageNumber": 1
  }
  ```

---

## 4. Example Requests

### JavaScript (using `fetch`)

```js
import fetch from 'node-fetch';

export async function searchGardners({ keyword, author, productType }) {
  const credentials = Buffer.from(
    `${process.env.GARDNERS_USER}:${process.env.GARDNERS_PASS}`
  ).toString('base64');

  const body = {
    ItemsPerPage: 100,
    PageNumber: 1,
    ...(keyword && { Keyword: keyword }),
    ...(author && { Author: author }),
    ...(productType && { ProductType: productType })
  };

  const response = await fetch(
    'https://gws.gardners.com/api/Search/Results/1',
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
```

### cURL

```bash
curl -X POST "https://gws.gardners.com/api/Search/Results/1" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Authorization: Basic $(printf '%s:%s' "$GARDNERS_USER" "$GARDNERS_PASS" | base64)" \
  -d '{
        "Keyword": "Your search term",
        "ItemsPerPage": 100,
        "PageNumber": 1
      }'
```

---

## 5. Response Format

A successful response returns HTTP 200 with JSON:

```json
{
  "TotalCount": 123,
  "Items": [
    {
      "EAN": "9780439708180",
      "Title": "Harry Potter and the Sorcerer's Stone",
      "Author": "J.K. Rowling",
      "ProductType": 1,
      // …other fields…
    },
    // …more items…
  ]
}
```

* **`TotalCount`**: total number of matching records
* **`Items`**: array of result objects with EAN, Title, Author, etc.

---

## 6. Integrating into Your Application

1. **Environment**
   Set `GARDNERS_USER` and `GARDNERS_PASS` in your environment or a `.env` file.
2. **Function**
   Use the `searchGardners` function (shown above) wherever you need to perform searches.
3. **Error Handling**
   Catch network or API errors and handle non-200 statuses gracefully.
4. **Pagination**
   Increase `PageNumber` to retrieve subsequent pages; respect `TotalCount` for maximum pages.

---
