# Event Pattern

## Approach

<!-- SCAFFOLD: Describe the event and communication system. -->

Options:
- Custom DOM events (CustomEvent API)
- Framework event bus (Vue emits, React context)
- Pub/sub library
- Global state management (Redux, Pinia, Zustand)

## Event Naming Convention

<!-- SCAFFOLD: Define the event naming pattern. -->

Use a consistent naming format across the project:

```typescript
// Example: NAMESPACE::EVENT_NAME
'AUTH::LOGIN'
'MODAL::OPEN'
'FORM::SUBMIT'
```

## Emitting Events

<!-- SCAFFOLD: Show how to emit events in the system. -->

```typescript
// Example using CustomEvent
function broadcast<T>(target: EventTarget, name: string, detail?: T): void {
  target.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }))
}
```

## Listening to Events

<!-- SCAFFOLD: Show how to subscribe to events -->

```typescript
element.addEventListener('EVENT_NAME', handler as EventListener)
```

## Typed Event Handlers

<!-- SCAFFOLD: Show how to type event payloads -->

```typescript
interface FormSubmitDetail {
  formId: string
  data: Record<string, string>
}

function onSubmit(event: CustomEvent<FormSubmitDetail>): void {
  const { formId, data } = event.detail
}
```
