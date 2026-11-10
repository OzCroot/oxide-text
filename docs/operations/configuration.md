# Backend Configuration

## Primary Config

<!-- SCAFFOLD: Describe your main configuration file and its sections -->

Config file: <!-- for example, appsettings.json, .env, config/default.ts -->

Key sections:
- Connection strings / database URL
- Application settings
- Logging configuration
- Static asset paths

## Environment Overrides

<!-- SCAFFOLD: Describe how per-environment config works -->

- Development overrides in: <!-- for example, appsettings.Development.json, .env.local -->
- Production config in: <!-- for example, appsettings.json, environment variables -->

## Application Entry Point

<!-- SCAFFOLD: Describe your application startup -->

```
// Replace with your entry point pattern
```

## Environment Variables

<!-- SCAFFOLD: List key environment variables -->

| Variable | Purpose | Values |
|----------|---------|--------|
| `NODE_ENV` / `ASPNETCORE_ENVIRONMENT` | Runtime environment | Development, Production |
| `DATABASE_URL` | Database connection | Connection string |

## Secrets Management

- Use environment variables or a secret manager for sensitive values
- Never commit secrets to the repository
- See [./environments.md](./environments.md) for environment-specific details
