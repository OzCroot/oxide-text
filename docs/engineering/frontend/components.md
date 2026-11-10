# Component Pattern

## File Location

<!-- SCAFFOLD: Replace this section with the component file location pattern. -->

```
src/components/[ComponentName]/
├── ComponentName.tsx          # Component logic
├── ComponentName.styles.css   # Component styles
└── ComponentName.test.ts      # Component tests
```

## Basic Structure

<!-- SCAFFOLD: Replace this section with the component boilerplate. -->

```typescript
// Example component structure — replace with your framework's pattern

export default class ExampleComponent {
  private element: HTMLElement

  constructor(element: HTMLElement) {
    this.element = element
    this.init()
  }

  private init(): void {
    this.bindEvents()
  }

  private bindEvents(): void {
    // Event listeners
  }

  public destroy(): void {
    // Cleanup
  }
}
```

## Conventions

<!-- SCAFFOLD: List the component conventions. -->

- One component per file
- Keep components self-contained, with their own styles
- Prefer composition over inheritance
- Keep components focused on a single responsibility

## State Management

<!-- SCAFFOLD: Describe how components manage state. -->

See [state.md](./state.md) for state management patterns.

## Events / Communication

<!-- SCAFFOLD: Describe how components communicate -->

See [events.md](./events.md) for inter-component communication patterns.
