# Service Pattern

## File Location

```
src/services/[serviceName].ts
```

## Singleton Pattern

<!-- SCAFFOLD: Replace this section with the service pattern (singleton, DI, module export, or similar). -->

```typescript
class ExampleService {
  private static instance: ExampleService

  private constructor() {}

  public static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService()
    }
    return ExampleService.instance
  }

  public init(): void {
    // Initialization logic
  }
}

export const exampleService = ExampleService.getInstance()
```

## Existing Services

<!-- SCAFFOLD: List the project's services as they are created -->

| Service | File | Purpose |
|---------|------|---------|
| <!-- for example, API client --> | `services/api.ts` | HTTP communication |
| <!-- for example, Auth --> | `services/auth.ts` | Authentication state |

## Service Communication

Services emit events or use a shared store. They do not couple directly with other services.
