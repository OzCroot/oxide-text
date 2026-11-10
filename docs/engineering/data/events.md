# Event Registry

<!-- SCAFFOLD: Document each custom event when you add it to the project. This file is the central lookup for all event names and payloads. -->

## Application Events

<!-- SCAFFOLD: List each event when you add it to the project. -->

| Event | Namespace | Fired when |
|-------|-----------|------------|
| <!-- for example, LOGIN --> | `AUTH` | User logs in |
| <!-- for example, OPEN --> | `MODAL` | Modal opens |

## Event Detail Interfaces

<!-- SCAFFOLD: Define the typed payload for each event -->

```typescript
// Example
interface ModalOpenDetail {
  modalId: string
  trigger: HTMLElement
}
```

## Naming Convention

Format: `NAMESPACE::EVENT_NAME`

```typescript
'AUTH::LOGIN'
'MODAL::OPEN'
'FORM::SUBMIT'
```

## Adding New Events

1. Define the event name constant
2. Define the detail/payload interface
3. Update this file with the new event
