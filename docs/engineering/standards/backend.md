# Backend Coding Standards

<!-- SCAFFOLD: Replace all sections with your backend language and framework conventions -->

## Language & Framework

- **{{BACKEND_FRAMEWORK}}** with {{BACKEND_LANGUAGE}}
- PascalCase for classes, methods, properties
- camelCase for local variables and parameters

## View / Template Layer

<!-- SCAFFOLD: Replace with your template engine conventions, or remove if API-only -->

- Keep logic minimal in templates. Use partials for reusable blocks.
- Use strongly-typed models where the template engine supports it

## API Controllers / Routes

- RESTful route patterns
- Return appropriate status codes (see [../data/api.md](../data/api.md))
- Keep controllers and handlers thin. Delegate business logic to services.

## Project Structure

<!-- SCAFFOLD: Replace with your actual backend structure -->

```
src/
├── controllers/        # Route handlers / API controllers
├── services/           # Business logic
├── models/             # Data models, DTOs
├── middleware/          # Request pipeline middleware
├── config/             # Configuration files
└── tests/              # Test files
```
