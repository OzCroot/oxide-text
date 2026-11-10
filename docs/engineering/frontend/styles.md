# Styling Patterns

## File Structure

<!-- SCAFFOLD: Replace this section with the component styling convention. -->

```
src/components/ComponentName/
├── ComponentName.tsx
└── ComponentName.styles.css
```

## Selector Strategy

<!-- SCAFFOLD: Describe the CSS selector approach. -->

### Naming Convention

**Do not use BEM naming (`block__element--modifier`).** Prefer flat, descriptive class names:

- Use simple, semantic class names (`.card-title` not `.card__title`)
- Use hyphen-case for multi-word names (`.search-input`, `.nav-link`)
- Scope styles through nesting or component-level encapsulation rather than name-encoding hierarchy
- Modifier states use standalone classes or data attributes (`.active`, `[data-variant="primary"]`)

```css
/* Preferred */
.card { }
.card-title { }
.card-body { }
.card.featured { }

/* Avoid */
.card__title { }
.card__body { }
.card--featured { }
```

### Approach Options

<!-- SCAFFOLD: Pick a CSS selector approach. Describe it. -->

- Utility classes (Tailwind)
- CSS Modules
- Scoped styles (Vue/Svelte)
- Attribute selectors

## Design Tokens

<!-- SCAFFOLD: Describe the design token system. -->

Define global tokens as CSS custom properties:

```css
:root {
  --font-family-body: system-ui, sans-serif;
  --font-family-heading: Georgia, serif;
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --surface-bg: #ffffff;
  --surface-border-color: #e2e8f0;
  --container-max-width: 1200px;
}
```

## Responsive Design

<!-- SCAFFOLD: Replace this section with the breakpoint system. -->

Mobile-first approach with breakpoints:

| Name | Min-width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `xxl` | 1536px |

## Nesting & Selector Depth

Keep nesting shallow (max 2-3 levels) regardless of methodology.

**Avoid deep selectors.** Long descendant chains are fragile and hard to override. They tightly couple styles to the DOM structure.

- Prefer direct class selectors over chained descendants
- If nesting needs more than two levels, add a dedicated class instead

```css
/* Preferred — shallow nesting with direct classes */
.nav {
  .nav-link {
    color: var(--color-primary);

    &.active {
      font-weight: 700;
    }
  }
}

/* Avoid — deep nesting that mirrors DOM structure */
.header {
  .nav {
    ul {
      li {
        a {
          color: var(--color-primary);

          &.active {
            font-weight: 700;
          }
        }
      }
    }
  }
}
```

## Example Component

<!-- SCAFFOLD: Replace this section with a representative styled component example. -->

```css
.card {
  --card-gap: 16px;

  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
  background: var(--surface-bg);
}
```
