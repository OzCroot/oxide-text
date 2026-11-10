# Frontend Architecture

## Overview

<!-- SCAFFOLD: Describe the frontend architecture in 1-2 sentences. -->

{{FRONTEND_FRAMEWORK}}-based frontend with TypeScript.

## Directory Structure

<!-- SCAFFOLD: Replace this section with the actual frontend directory layout. -->

```
src/
├── main.ts                  # Entry point
├── components/              # UI components
├── services/                # Service layer (API clients, singletons)
├── models/                  # Type definitions, enums, constants
├── styles/                  # Global styles, design tokens
├── utils/                   # Shared utilities
├── assets/                  # Static assets (fonts, images)
└── types/                   # Ambient TypeScript declarations
```

## Component System

<!-- SCAFFOLD: Describe how components are structured and how they render. -->

1. How components are discovered / registered
2. How components receive data (props, context, DI)
3. Component lifecycle (mount, update, destroy)

## Service Layer

<!-- SCAFFOLD: Describe shared services and how the code accesses them. -->

Singleton or injected services for shared infrastructure:

- **API client** — HTTP communication
- **State store** — application state (if applicable)

## Data Flow

<!-- SCAFFOLD: Describe how data flows from the backend to the UI. -->

```
Backend API / CMS → Data layer → Components → DOM
```

## Style Architecture

<!-- SCAFFOLD: Describe the CSS strategy. -->

See [styles.md](./styles.md) and [../standards/frontend.md](../standards/frontend.md) for conventions.
