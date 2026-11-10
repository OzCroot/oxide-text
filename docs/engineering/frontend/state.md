# State Management

## Approach

<!-- SCAFFOLD: Describe the state management strategy. -->

Options:
- Component-local state (framework built-in)
- Global store (Redux, Pinia, Zustand, Svelte stores)
- CSS class state (toggling classes for UI state)
- URL/query param state
- Server state (React Query, SWR)

## UI State

<!-- SCAFFOLD: Describe how the code manages UI states (loading, active, disabled). -->

Common UI states to track:

| State | Purpose |
|-------|---------|
| Loading | The code fetches data |
| Loaded | The data is ready |
| Active | The element is selected or open |
| Disabled | The element is not interactive |
| Visible | The element is shown |
| Hidden | The element is hidden |
| Error | The operation failed |

## Application State

<!-- SCAFFOLD: Describe how the code manages global or shared state. -->

## Server State

<!-- SCAFFOLD: Describe how the code caches and manages asynchronous data from APIs, if applicable. -->
