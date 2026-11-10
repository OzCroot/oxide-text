# Views / Template Layer

<!-- SCAFFOLD: If the project has no server-rendered views (API-only), document the API response structure here instead. Otherwise, remove this file. -->

## Template Hierarchy

<!-- SCAFFOLD: Replace this section with the view or template structure. -->

```
views/
├── layout.html           # Root layout (all pages inherit)
├── pages/                # Page templates
│   ├── home.html
│   └── about.html
├── partials/             # Reusable template fragments
│   ├── header.html
│   └── footer.html
└── components/           # Component-level partials
```

## Layout Template

The root layout provides:

- HTML document structure
- Asset loading (dev server or production bundles)
- Common meta tags
- Content insertion point

## Page Templates

<!-- SCAFFOLD: Describe how page templates work in the framework. -->

Each page type has a corresponding template that extends the layout.

## Partials / Components

<!-- SCAFFOLD: Describe how reusable template fragments work -->

## Adding a New View

<!-- SCAFFOLD: Describe the steps to add a new page or view. -->

1. Create the template file
2. Set the parent layout template
3. Define the route that serves this view
4. Add any required data model or context
