# General Coding Standards

## Editor Config

Defined in `.editorconfig`:

- UTF-8 charset
- 2-space indentation
- LF line endings
- Max 100 character line width
- Trim trailing whitespace
- Insert final newline

## Git Conventions

- Branch naming: `feature/`, `fix/`, `chore/` prefixes
- Commit messages: imperative mood, concise subject line
- PRs target the `main` branch

## Naming Conventions

<!-- SCAFFOLD: Adjust the table to match your project's languages and conventions -->

| Context | Convention | Example |
|---------|-----------|---------|
| Files (frontend) | <!-- for example, PascalCase component --> | `HeroBanner.tsx` |
| Files (backend) | <!-- for example, PascalCase --> | `UserController.cs` |
| Files (docs) | lowercase kebab-case | `architecture.md` |
| CSS classes | <!-- for example, kebab-case, BEM, utility --> | `.card-holder` |
| CSS custom props | `--kebab-case` | `--card-gap` |
| TS/JS variables | camelCase | `userData` |
| TS/JS classes | PascalCase | `BaseComponent` |
| TS/JS constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Backend classes | PascalCase | `UserService` |

## Code Review

- Submit all changes through a pull request
- A merge needs at least one approval
