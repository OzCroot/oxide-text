# Frontend Testing

## Current Status

<!-- SCAFFOLD: Describe the current testing setup, or note that it is pending. -->

No frontend testing framework is currently configured.

## Recommended Setup

<!-- SCAFFOLD: Replace this section with the chosen testing framework. -->

Options:
- **Vitest** — fast, Vite-native test runner
- **Jest** — widely adopted, rich ecosystem
- **Playwright / Cypress** — E2E testing

### Test File Convention

<!-- SCAFFOLD: Define the location of test files. -->

```
src/components/ComponentName/
├── ComponentName.tsx
├── ComponentName.styles.css
└── ComponentName.test.ts
```

### Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## What to Test

- Component rendering and DOM output
- User interactions (click, input, submit)
- State changes and side effects
- Service and utility logic
- API integration (mocked)
