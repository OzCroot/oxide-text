# Deployment

## Build Pipeline

### Frontend

<!-- SCAFFOLD: Replace with your frontend build steps -->

```bash
{{PACKAGE_MANAGER}} run build
```

Steps:
1. Check types
2. Bundle or compile the code into the production output directory

### Backend

<!-- SCAFFOLD: Replace with your backend build/publish command -->

```bash
# for example, dotnet publish -c Release, npm run build:server
```

## Output

<!-- SCAFFOLD: Replace with your build output structure -->

```
dist/
├── index.js          # Entry script (hashed)
├── styles.css        # Main stylesheet (hashed)
├── chunks/           # Code-split modules
└── assets/           # Images, fonts
```

## Hosting

<!-- SCAFFOLD: Replace with your hosting details -->

- **Platform**: <!-- for example, Azure App Service, Vercel, AWS, Docker -->
- **Runtime**: {{BACKEND_FRAMEWORK}}
- **Database**: {{DATABASE}}
- **CDN**: <!-- if applicable -->
