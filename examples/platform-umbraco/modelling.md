# Content Modelling

## Principles

- **One content type per purpose** — avoid catch-all page types
- **Composition over inheritance** — share property groups across types via mixins/compositions
- **Semantic property names** — name properties by what they represent, not how they display

## Type Hierarchy

<!-- SCAFFOLD: Replace with your content type structure -->

```
Content Types
├── Pages
│   ├── HomePage           # Homepage (single instance)
│   └── ContentPage        # Generic content page
└── Blocks / Components
    ├── Grid blocks        # Layout-positioned components
    └── List blocks        # Sequential components
```

## Property / Field Guidelines

| Data type | Editor / Widget | Notes |
|-----------|----------------|-------|
| Short text | Text input | Max 250 chars |
| Long text | Textarea | Plain text, no formatting |
| Rich text | WYSIWYG editor | HTML content |
| Image | Media picker | Single or multiple images |
| Link | URL picker | Internal/external links |
| Structured | Block editor | Nested content components |

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Content type alias | PascalCase | `ContentPage` |
| Property / field alias | camelCase | `heroTitle` |
| Tab / group name | Title Case | `Hero Section` |

## When to Create a New Content Type

- New page layout with distinct template requirements
- New block/component type
- New media type with custom properties

## Compositions / Mixins

Use compositions to share common property groups across multiple content types. This avoids duplication for fields such as SEO, social sharing, and navigation settings.
