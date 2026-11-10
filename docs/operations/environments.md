# Environments

## Development

<!-- SCAFFOLD: Replace with your dev environment URLs and config -->

| Service | URL |
|---------|-----|
| Backend | https://localhost:{{BACKEND_PORT}} |
| Frontend dev server | https://localhost:{{FRONTEND_PORT}} |
| CMS admin | https://localhost:{{BACKEND_PORT}}/admin |

> Remove CMS row if not applicable.

- Environment variable: `{{ENV_VAR_NAME}}` = `Development`
- Config overrides in `{{DEV_CONFIG_FILE}}`

## Production

<!-- SCAFFOLD: Replace with your production environment details -->

- Environment variable: `{{ENV_VAR_NAME}}` = `Production`
- Config in `{{PROD_CONFIG_FILE}}`

## Database

<!-- SCAFFOLD: Replace with your database details -->

- **Engine**: {{DATABASE}}
- **Host**: <!-- local / cloud provider -->
- **Connection**: <!-- how connection is configured -->

## Secrets

- Manage connection strings and API keys with environment variables or a secret manager
- Never commit secrets to the repository
- Use config files that Git ignores for local overrides
