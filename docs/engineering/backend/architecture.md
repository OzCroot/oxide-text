# Backend Architecture

## Overview

<!-- SCAFFOLD: Describe the backend in 1-2 sentences. -->

{{BACKEND_FRAMEWORK}} application with {{BACKEND_LANGUAGE}}.

## Project Structure

<!-- SCAFFOLD: Replace this section with the actual backend directory layout. -->

```
src/
├── Program.cs / index.ts / app.py    # Entry point
├── controllers/                       # Route handlers
├── services/                          # Business logic
├── models/                            # Data models, DTOs
├── middleware/                         # Request pipeline
├── config/                            # Configuration
└── tests/                             # Test files
```

## Middleware Pipeline

<!-- SCAFFOLD: Describe the request processing pipeline -->

1. Authentication and authorization
2. Request logging
3. Static file serving
4. Routing
5. Error handling

## Dependency Injection

<!-- SCAFFOLD: Describe how the code registers and injects services. -->

## Logging

<!-- SCAFFOLD: Describe the logging setup. -->

- Log levels: Debug, Info, Warning, Error
- Output: <!-- for example, console, file, cloud service -->

## Server Configuration

<!-- SCAFFOLD: Describe server profiles and ports -->

| Profile | URL | Port |
|---------|-----|------|
| Development | https://localhost:{{PORT}} | {{PORT}} |
