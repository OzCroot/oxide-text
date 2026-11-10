# Animation Patterns

<!-- SCAFFOLD: Document the project's animation approach. Remove this file if animations are not a significant pattern in the project. -->

## Approach

<!-- SCAFFOLD: Describe the animation strategy. -->

Options:
- CSS transitions and keyframes
- JavaScript-driven (GSAP, Framer Motion, and so on)
- Viewport-triggered entrance animations
- Framework transition components (Vue `<Transition>`, React Transition Group)

## Conventions

- Respect `prefers-reduced-motion`. Disable or simplify animations for users who prefer it.
- Use CSS transitions for simple state changes
- Use keyframe animations for complex multi-step sequences
- Keep animation durations under 400ms for UI interactions

## Entrance Animations

<!-- SCAFFOLD: Describe how elements animate on viewport entry, if applicable -->

## Shared Animation Values

<!-- SCAFFOLD: Document reusable timing, easing, and duration tokens -->

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
