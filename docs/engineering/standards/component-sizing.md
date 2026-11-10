# Component Sizing

A framework to classify component complexity into five tiers. Use this
framework to guide estimation, development approach, and review
expectations.

### Labels

Use these short labels to refer to component sizes in code, documentation,
and conversation:

| Label | Size |
|---|---|
| `xs` | X-Small |
| `sm` | Small |
| `md` | Medium |
| `lg` | Large |
| `xl` | X-Large |

## X-Small (`xs`)

An x-small component is a simple element with a single purpose. It has
these traits:

- Represents a single piece of content or a UI primitive, for example an icon, a label, or a divider
- Has no interactivity. It is purely presentational.
- Has no layout responsibility. It exists inline or within the flow of a parent component.
- Needs no CMS configuration. Content is hardcoded, inherited from a parent, or passed as a single value.

**Examples:** icon, divider/separator, loading spinner, avatar, status dot, visually hidden text

**Typical traits:**
- Zero or one content input, for example an icon name or alt text
- No JavaScript
- No CMS content type. It is typically a code-only utility element.
- No responsive behaviour of its own. It adapts through the parent context.
- Often a child of a small or medium component, rather than used alone

## Small (`sm`)

A small component is a low-complexity block that:

- Uses basic content types, for example plain text, a single image, or an icon
- Has almost no interactivity beyond standard links
- Has a minimal, predictable layout. The layout needs no special behaviour or variation between desktop and mobile.
- Typically appears in many places without configuration beyond simple content edits, for example label text or short copy

**Examples:** breadcrumb, tag, badge, simple CTA link, icon with label

**Typical traits:**
- A single content type, or a small fixed combination
- No JavaScript behaviour required
- No CMS configuration beyond editable text or media fields
- Minimal or no responsive considerations

## Medium (`md`)

A medium component is a moderately complex block that:

- Combines multiple basic content types, for example text, images, buttons, or links, into a structured layout
- May include light interactivity, for example accordions, tabs, hover states, or simple animations
- Introduces some layout considerations for mobile, for example stacking order, spacing, or alignment. It has no highly custom behaviour per breakpoint.
- Often has a small set of configurable options in the CMS, for example a layout variant, a background colour, or optional media. The component still stays reusable across pages.

**Examples:** card, testimonial block, FAQ accordion, feature panel, media + text section

**Typical traits:**
- 2-4 content fields composed into a layout
- Light JavaScript for toggle behaviour or animation
- A small number of CMS variants or optional fields
- Standard responsive stacking, for example from a side-by-side layout to a stacked layout

## Large (`lg`)

A large component is a high-complexity, feature-rich block that:

- Combines multiple content types and sub-components, for example cards, media, CTAs, or forms, into a cohesive section
- Includes significant interactivity or behaviour, for example carousels, filters, step flows, complex animations, or dynamic data
- Requires careful responsive design, often with layout changes, breakpoint-specific behaviour, and performance considerations
- Exposes a wide range of CMS configuration options, for example multiple variants, repeatable items, conditional fields, or toggles for features
- Often serves as a key page section or hero element. The component may also need to support multiple use cases across the site.

**Examples:** hero banner with video/carousel, filterable card grid, multi-step form, interactive map section, tabbed content hub

**Typical traits:**
- Combines multiple sub-components
- Significant JavaScript, for example state management, API calls, or event coordination
- Multiple CMS variants, repeatable items, or conditional fields
- Breakpoint-specific layout or behaviour changes
- May require performance attention, for example lazy loading, deferred scripts, or image optimisation

## X-Large (`xl`)

An x-large component is a page-level or application-level feature that:

- Functions as a self-contained experience or full page section, with its own internal navigation, state, and data lifecycle
- Orchestrates multiple large or medium sub-components into a coordinated whole, for example a search results page with filters, sorting, pagination, and result cards
- Requires its own data fetching, caching, or real-time update strategy. It often needs API integration or client-side state management.
- Has complex accessibility requirements, for example focus trapping, live regions, or keyboard-driven flows across multiple interactive zones
- Demands a dedicated performance strategy, for example code splitting, virtualised lists, lazy-loaded sections, or progressive enhancement
- May define its own URL structure or route segments. It may also manage browser history.

**Examples:** search experience with filters and pagination, checkout flow, dashboard with multiple widget panels, interactive configurator/builder, account settings area

**Typical traits:**
- Combines multiple large and medium sub-components with coordinated state
- Significant JavaScript. It is likely a separate module or a route-level entry point.
- Complex CMS modelling with deeply nested or composed content types
- Breakpoint-specific layout, behaviour, and possibly different interaction models per device
- Requires dedicated performance profiling and optimisation
- Often needs its own test suite. The suite covers the complete user flow.

## Quick Reference

| Trait | X-Small | Small | Medium | Large | X-Large |
|---|---|---|---|---|---|
| Content types | 0-1 | 1 | 2-4 | 5+ or nested | Deeply nested / composed |
| Interactivity | None | None / links only | Light (toggle, hover) | Significant (state, data) | Complex (flows, real-time) |
| Responsive | Inherits from parent | Minimal | Standard stacking | Breakpoint-specific | Device-specific behaviour |
| CMS config | None | Text/media only | Few variants/options | Many fields, repeatable items | Nested types, conditional logic |
| Sub-components | None | None | Rarely | Often | Multiple large/medium children |
| JS required | No | No | Light | Yes | Significant (own module/route) |
| Testing | Visual only | Visual review | Visual + interaction | Cross-breakpoint + interaction | End-to-end user flows |

## How to Use This Framework

- **Estimation:** use the tier to set expectations for build time and review scope
- **Code review:** larger components need closer review of accessibility, performance, and responsive behaviour
- **CMS modelling:** this project has no CMS, so ignore the CMS rows and traits in this file.
- **Testing:** small components may need only visual review. Large components need interactive and cross-breakpoint testing.
- **Component architecture:** see [frontend components](../frontend/components.md) for build patterns at each tier
