# Content API

<!-- SCAFFOLD: Rename to match your CMS's API terminology (for example, "REST API", "GraphQL API", "Content Delivery API") -->

## Overview

<!-- SCAFFOLD: Describe your CMS's content API and how the project enables it. -->

## Base URL

<!-- SCAFFOLD: Replace this example with the project's API base URL. -->

```
/api/content/
```

## Endpoints

<!-- SCAFFOLD: List your content API endpoints -->

```
GET /api/content              # List content items
GET /api/content/{id}         # Single item by ID
GET /api/content/by-path/{path}  # Single item by URL path
```

## Response Shape

<!-- SCAFFOLD: Define or link to your API response types -->

```typescript
interface ContentResponse {
  id: string
  name: string
  contentType: string
  properties: Record<string, unknown>
}
```

## Frontend Usage

<!-- SCAFFOLD: Show a fetch example for your content API -->

```typescript
async function getContent(path: string): Promise<ContentResponse | null> {
  try {
    const response = await fetch(`/api/content/by-path/${path}`)
    if (response.ok) return await response.json()
    return null
  } catch (error) {
    console.error('Content API error:', error)
    return null
  }
}
```

## Query Parameters

<!-- SCAFFOLD: Document common query options -->

- Filter: `?filter=contentType:page`
- Sort: `?sort=name:asc`
- Pagination: `?skip=0&take=10`
- Expand nested content: `?expand=all`
