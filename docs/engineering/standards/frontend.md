# Frontend Coding Standards

## TypeScript

- **Strict mode** enabled
- No implicit `any`. All types must be explicit.
- Prefix unused parameters with `_`

<!-- SCAFFOLD: Add your project's specific TS conventions -->

## Linting

<!-- SCAFFOLD: Replace with your linting setup -->

Config: `eslint.config.ts`

- Type-aware linting enabled
- Framework-specific rules active
- Run: `npx eslint .`

## Formatting

<!-- SCAFFOLD: Replace with your Prettier / formatter config -->

Config: `.prettierrc.json`

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Styles

<!-- SCAFFOLD: Replace with your CSS/SCSS approach -->

- {{CSS_APPROACH}} for styling
- CSS custom properties for component-level values
- Max nesting depth: 2-3 levels
- Mobile-first responsive approach

## Import Aliases

<!-- SCAFFOLD: Replace with your path aliases -->

| Alias | Path |
|-------|------|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@styles/*` | `src/styles/*` |
| `@assets/*` | `src/assets/*` |
