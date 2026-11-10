# API Schemas

This file defines the frontend data contracts for HTTP communication.

## HTTP Methods

<!-- SCAFFOLD: Document your HTTP method constants if you define them -->

This project uses these standard methods:

| Method | Usage |
|--------|-------|
| GET | Retrieve data |
| POST | Create new resource |
| PUT | Full update |
| PATCH | Partial update |
| DELETE | Remove resource |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Request Pattern

<!-- SCAFFOLD: Replace this example with the pattern this project uses to fetch data. -->

```typescript
async function fetchData<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) return await response.json()
    return null
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}
```

## API Endpoints Registry

<!-- SCAFFOLD: List each API endpoint when you create it. -->

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/items` | List items |
| POST | `/api/items` | Create item |
| GET | `/api/items/:id` | Get single item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
