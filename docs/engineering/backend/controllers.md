# API Controllers / Route Handlers

## Creating an Endpoint

<!-- SCAFFOLD: Replace this section with the framework's controller or route handler pattern. -->

```typescript
// Express example
router.get('/api/items', async (req, res) => {
  const items = await itemService.getAll()
  res.json(items)
})

router.post('/api/items', async (req, res) => {
  const item = await itemService.create(req.body)
  res.status(201).json(item)
})
```

```csharp
// .NET example
[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { data = "value" });

    [HttpPost]
    public IActionResult Create([FromBody] CreateRequest request)
    {
        return CreatedAtAction(nameof(Get), new { id = 1 }, result);
    }
}
```

## Conventions

- RESTful route patterns
- Return appropriate HTTP status codes
- Keep controllers thin. Delegate logic to services.
- Use request and response DTOs for API boundaries

## Response Patterns

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation failure |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 500 | Server Error | Unhandled exception |

## Proxy Pattern

For third-party API integrations, create a server-side proxy to keep API keys secure:

<!-- SCAFFOLD: Add an example proxy endpoint for the framework. -->
