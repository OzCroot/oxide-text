# Media Management

## Media Types

<!-- SCAFFOLD: List the media types your CMS supports -->

| Type | Purpose |
|------|---------|
| Image | Image uploads (JPG, PNG, SVG, WebP) |
| File | Document uploads (PDF, DOCX, and so on) |
| Video | Video content (if applicable) |

## Media Storage

<!-- SCAFFOLD: Describe where the project stores media files. -->

- Storage location: <!-- for example, local filesystem, cloud storage (S3, Azure Blob) -->
- Served via: <!-- for example, static file middleware, CDN -->

## Accessing Media in Templates

<!-- SCAFFOLD: Show how to render media in your templates -->

```html
<!-- Replace with your template syntax -->
<img src="{{imageUrl}}" alt="{{imageAlt}}" />
```

## Image Processing

<!-- SCAFFOLD: Describe image crops, transforms, and how the project handles responsive images. -->

## Conventions

- Organise media in folders by content area or type
- Use descriptive filenames for SEO and accessibility
- Prefer modern formats (WebP, AVIF) when the browser supports them
- Always provide alt text for images
