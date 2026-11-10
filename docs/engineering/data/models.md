# Data Models

## Overview

<!-- SCAFFOLD: Describe the approach this project uses for its model and data layer. -->

Options:
- ORM-generated models (Entity Framework, Prisma, SQLAlchemy)
- CMS-generated models (Umbraco Models Builder, WordPress types)
- Manually-defined DTOs and entities
- Schema-first (GraphQL, OpenAPI codegen)

## Entity Models

<!-- SCAFFOLD: List each core data model when you create it. -->

| Model | File | Purpose |
|-------|------|---------|
| <!-- for example, User --> | `models/User.ts` | User account |
| <!-- for example, Post --> | `models/Post.ts` | Content item |

## DTOs (Data Transfer Objects)

<!-- SCAFFOLD: Describe your DTO pattern for API boundaries -->

```typescript
// Example request DTO
interface CreateItemRequest {
  name: string
  description?: string
}

// Example response DTO
interface ItemResponse {
  id: string
  name: string
  createdAt: string
}
```

## Adding New Models

<!-- SCAFFOLD: Describe how to add new data models. -->

1. Define the model / entity
2. Create or update the database migration
3. Add corresponding DTOs for API boundaries
4. Update this file with the new model reference

## CMS Models

<!-- SCAFFOLD: If the project uses a CMS, describe how the CMS generates content models. Remove this section if the project does not use a CMS. -->
