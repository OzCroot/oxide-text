# Getting Started

## Prerequisites

<!-- SCAFFOLD: List required tools and minimum versions -->

- **Node.js** >= {{NODE_VERSION}}
- **{{BACKEND_FRAMEWORK}}** SDK
- **{{DATABASE}}** (local or remote instance)

## First Run

### 1. Install frontend dependencies

```bash
{{PACKAGE_MANAGER}} install
```

### 2. Start the backend

<!-- SCAFFOLD: Replace with your backend start command -->

```bash
# for example, dotnet run, npm run server, python manage.py runserver
```

### 3. Start the frontend dev server

```bash
{{PACKAGE_MANAGER}} run dev
```

### 4. Access the application

<!-- SCAFFOLD: Replace with your actual URLs -->

| Service | URL |
|---------|-----|
| Application | https://localhost:{{PORT}} |
| API | https://localhost:{{PORT}}/api |
| CMS admin | https://localhost:{{PORT}}/admin |

> Remove CMS row if not applicable.

## Project Structure at a Glance

<!-- SCAFFOLD: Replace with your actual top-level directory layout -->

```
src/                # Application source code
├── frontend/       # Frontend source (components, styles, services)
├── backend/        # Backend source (controllers, models, services)
└── shared/         # Shared types, utilities
public/             # Static assets
docs/              # agent knowledge base
```

## Next Steps

- Read [architecture.md](../engineering/architecture.md) for tech stack details
- Check [../engineering/standards/](../engineering/standards/) for code conventions
- Browse [../engineering/frontend/](../engineering/frontend/) or [../engineering/backend/](../engineering/backend/) for team-specific patterns
