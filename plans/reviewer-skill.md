# Reviewer Skill — SkyrimWebMonitor

## Purpose

This document defines the **mandatory code review process** for the SkyrimWebMonitor project.
Every PR must pass a full review against all items before merge.

---

## 0. Review Output Format (CRITICAL)

### 0.1 Principle: Only Problems, No Praise

**The review output must contain only what needs to be fixed.** If a file or code section has no issues — no information about it is output.

This follows the real code review principle: the reviewer leaves threads only on problematic spots. No comment = "ok".

### 0.2 Thread-Style Output

Each issue is formatted as a **thread** with:

- **File** and **line** (or line range)
- **Category**: `Architecture` | `Security` | `Performance` | `Best Practice` | `TypeScript` | `FSD` | `Style` | `Testing` | `Logging` | `i18n`
- **Severity**: `🔴 Critical` (blocks merge) | `🟡 Warning` (must be fixed) | `🔵 Suggestion` (recommendation)
- **Problem description** — what exactly is wrong
- **Suggested fix** — how it should be

```
### 🔴 [Security] `src/features/chat/ui/message/Message.vue:42`

**Problem:** `innerHTML` is used without escaping. Data comes from the server
and may contain an XSS vector.

**How to fix:**
```typescript
// ❌ Before
<div v-html="message.text"></div>

// ✅ After
<div>{{ message.text }}</div>
// or, if HTML is actually needed:
import { escapeHtml } from '@/shared/lib/utils/escapeHtml';
<div v-html="escapeHtml(message.text)"></div>
```
```

### 0.3 What NOT to Output

- ❌ "File X looks good"
- ❌ "Structure Y follows the rules"
- ❌ "Everything is fine, except…" — only the "except"
- ❌ General positive comments about code quality

### 0.4 Review Summary

At the end of the review — a brief summary:

```
## Review Summary

| Category | Critical | Warning | Suggestion |
|-----------|----------|---------|------------|
| Architecture | 1 | 0 | 2 |
| Security | 0 | 1 | 0 |
| Performance | 0 | 0 | 1 |
| Best Practice | 0 | 2 | 1 |
| TypeScript | 1 | 0 | 0 |
| FSD | 0 | 1 | 0 |

**Verdict:** ❌ Merge blocked (2 critical issues)
```

---

## 1. Architecture Review

### 1.1 Solution-Level Architecture Assessment

When reviewing architecture, assess not only FSD structure compliance but also the overall architectural solution:

#### 1.1.1 Separation of Concerns

- **UI vs Logic:** Components must not contain business logic. All business logic belongs in stores and composables.
- **Data Flow:** Data flows unidirectionally: WebSocket → Store → Component. Components must not directly access WebSocket.
- **Side Effects:** Side effects (requests, subscriptions) are isolated in [`useAppLoader`](src/app/lib/composables/useAppLoader.ts) and stores, not scattered across components.

#### 1.1.2 Abstraction Level

- **Correct abstraction level:** Each layer solves its own problem, not "leaking" into the neighboring one.
- **Leaky abstractions:** If `shared` knows about business entities (e.g., `WeaponItem`) — this is a violation.
- **God objects:** Stores must not become "god objects" with dozens of unrelated fields.

#### 1.1.3 Coupling & Cohesion

- **Low coupling:** A change in one slice must not require changes in unrelated slices.
- **High cohesion:** Code within a slice is united by a common responsibility.
- **Circular dependencies:** Strictly forbidden. Checked automatically (ESLint `import/no-cycle`).

#### 1.1.4 Scalability

- **New functionality:** Adding a new feature does not require rewriting existing code.
- **New page:** Added via [`pageRegistry`](src/app/config/pageRegistry.ts), without router modifications.
- **New map projection:** Added via [`mapRegistry`](src/pages/map/config/mapRegistry.ts), without map component modifications.

### 1.2 FSD Layer Hierarchy

The project strictly follows FSD. Layer hierarchy (top to bottom):

| Layer | Purpose | May import from |
|---|---|---|
| `app/` | Initialization, routing, global providers, styles | `pages`, `features`, `entities`, `shared` |
| `pages/` | Composition of entities and features into full pages | `features`, `entities`, `shared` |
| `features/` | User actions, business scenarios | `entities`, `shared` |
| `entities/` | Business entities and their data model | `shared` |
| `shared/` | Reusable utilities, UI kit, API clients | Only within `shared` |
| `stores/` | Global state (Pinia), data adapters | `shared` (types from `entities` via type-only import) |

### 1.3 Forbidden Imports (check automatically)

| ❌ Import | Reason |
|---|---|
| `entities` → `features` | `entities` layer does not know about `features` |
| `shared` → `entities` / `features` / `pages` | `shared` does not depend on business logic |
| `features` → `pages` | Hierarchy violation |
| `entities` → `pages` | Hierarchy violation |

### 1.4 Slice Structure

Each slice (`entity`, `feature`) must contain **at most** the following segments:

```
{layer}/{sliceName}/
├── lib/
│   └── types.ts       # ✅ THE ONLY file with slice types
├── ui/                # Slice UI components
├── helpers/           # Auxiliary composables/utilities
├── config/            # Slice configuration
├── api/               # Slice-specific API requests
└── index.ts           # Slice public API
```

> **Note:** Stores (Pinia) are extracted into a separate top-level layer `src/stores/` and are not located inside `entities`/`features` slices.

### 1.5 Rule: Component = Folder (CRITICAL)

**Every `.vue` component lives in its own kebab-case folder.** A component is NEVER placed directly in a parent directory.

```
# ❌ FORBIDDEN
pages/inventory/TheWeapons.vue
entities/ui/apparel/ApparelItem.vue
features/ui/EquippedHandIcon.vue
shared/ui/base/ConnectionStatus.vue

# ✅ CORRECT
pages/inventory/the-weapons/TheWeapons.vue
entities/ui/apparel/apparel-item/ApparelItem.vue
features/ui/equipped-hand-icon/EquippedHandIcon.vue
shared/ui/base/connection-status/ConnectionStatus.vue
```

**Component internal structure** — if a component needs its own types, helpers, or sub-components:

```
# Component with its own logic
the-misc/
├── TheMisc.vue              # Main component
├── lib/
│   └── types.ts             # Component types (if any)
├── helpers.ts               # Local component helpers/utilities
└── components/              # Nested sub-components
    └── gem-preview/
        └── GemPreview.vue

# Simple component without extra logic
the-misc/
└── TheMisc.vue
```

**Naming rule:** folder name is the kebab-case of the component name (TheMisc.vue → `the-misc/`, ApparelItem.vue → `apparel-item/`).

### 1.6 Public API via `index.ts`

- Each slice must export its public API through `index.ts`
- Imports bypassing `index.ts` are forbidden
- Exception: imports **within** the same slice may be direct

```typescript
// ✅ Correct
import { WeaponItem } from '@/entities/inventory';

// ❌ Incorrect
import { WeaponItem } from '@/entities/inventory/ui/weapon/WeaponItem.vue';
```

---

## 2. TypeScript Typing

### 2.1 Main Rule: Types → `lib/types.ts`

**ALL types and interfaces must be in the `lib/types.ts` file of the corresponding slice or component.**

| Slice | Types file |
|---|---|
| `shared` | `src/shared/lib/types.ts` |
| `app` | `src/app/lib/types.ts` |
| `entities/{name}` | `src/entities/{name}/lib/types.ts` |
| `features/{name}` | `src/features/{name}/lib/types.ts` |
| `stores/{domain}` | `src/stores/{domain}/lib/types.ts` |
| Component | `{componentFolder}/lib/types.ts` (if few types — may keep at slice level) |

**❌ Forbidden:**
- Types in `.vue` files
- Types in `composables/` or `model/` (except when the type is used only locally in that same file)
- Types in `config/` — configs must import types from `lib/types.ts`
- `types.ts` files outside `lib/`

### 2.2 Ban on `as` (type assertions)

**Complete ban on all forms of `as`-casting**, except `as const`.

| Form | Allowed? |
|---|---|
| `as const` | ✅ Yes (const assertion, not type assertion) |
| `as Type` | ❌ No |
| `as any` | ❌ No |
| `as unknown as Type` | ❌ No |
| `<Type>value` (angle-bracket) | ❌ No |
| `!` (non-null assertion) | ❌ No |

**How to replace `as`:**
- For type narrowing: use **type guards** (`typeof`, `instanceof`, `in`, `value is Type` predicates)
- For unknown → concrete type: use **validation with type guard**
- For `err as Error`: `err instanceof Error ? err : new Error(String(err))`
- For JSON: use manual type guards

```typescript
// ❌ Forbidden
const msg = JSON.parse(raw) as ServerMessage;
const lang = (fields.language) as string;

// ✅ Correct
function isServerMessage(data: unknown): data is ServerMessage {
  return typeof data === 'object' && data !== null && 'type' in data;
}
const parsed: unknown = JSON.parse(raw);
if (!isServerMessage(parsed)) throw new Error('Invalid message');
const msg: ServerMessage = parsed;

const lang: string | undefined = typeof fields.language === 'string' ? fields.language : undefined;
```

### 2.3 Ban on `any`

**Complete ban on `any`.** Use:

| Instead of | Use |
|---|---|
| `any` | `unknown` (with subsequent validation) |
| `any[]` | `unknown[]` |
| `Record<string, any>` | `Record<string, unknown>` |
| `(...args: any[]) => any` | `(...args: unknown[]) => unknown` |

### 2.4 Ban on `never`

**Complete ban on `never`.** If a type is inferred as `never` — it is an error that must be fixed with a correct type.

### 2.5 General Typing Rules

- ✅ Prefer `type` for simple types and unions, `interface` for objects with inheritance
- ✅ Use `const` assertions (`as const`) for literal lookup objects
- ✅ Discriminated unions instead of `switch` on string fields
- ✅ `readonly` for immutable arrays/objects
- ✅ `@ts-ignore` and `@ts-expect-error` are forbidden (except temporary with TODO)
- ✅ Type imports via `import type { ... }`

---

## 3. Vue 3 / Composition API

### 3.1 Component Structure

```vue
<script setup lang="ts">
// 1. Imports (types separate from runtime)
import type { SomeType } from '@/entities/...';
import { useSomeStore } from '@/stores/...';

// 2. Props / Emits
const props = defineProps<{ ... }>();
const emit = defineEmits<{ ... }>();

// 3. Composables / Stores
const store = useSomeStore();

// 4. Reactive state
const localState = ref<string>('');

// 5. Computed
const computedValue = computed(() => ...);

// 6. Methods (function declarations for readability)
function handleClick(): void { ... }

// 7. Watchers
watch(source, () => { ... });

// 8. Lifecycle
onMounted(() => { ... });
</script>

<template>
  <!-- Template -->
</template>

<style scoped lang="scss">
/* Styles */
</style>
```

### 3.2 Component Rules

- ✅ Always `<script setup lang="ts">`
- ✅ Always typed `defineProps<T>()` and `defineEmits<T>()`
- ✅ `scoped` styles
- ✅ Component names in PascalCase
- ✅ Component in its own kebab-case folder (rule 1.5)
- ❌ No Options API
- ❌ No `any` in props/emits
- ❌ No direct DOM manipulation (use `ref` / `nextTick`)

### 3.3 Composables

- File name starts with `use`
- Returns an object with reactive properties and methods
- Does not contain JSX/templates
- May use lifecycle hooks
- Must not have side effects on import (except declaring ref)

---

## 4. Pinia Stores

### 4.1 Store Structure

```typescript
// src/stores/{domain}/use{Domain}Store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DomainType } from './lib/types';

export const useDomainStore = defineStore('domain', () => {
  // State
  const items = ref<DomainType[]>([]);

  // Getters
  const activeItems = computed(() => items.value.filter(i => i.isActive));

  // Actions
  function setItems(newItems: DomainType[]): void {
    items.value = newItems;
  }

  function reset(): void {
    items.value = [];
  }

  return { items, activeItems, setItems, reset };
});
```

### 4.2 Store Rules

- ✅ Composition API (Pinia setup syntax)
- ✅ Typed `ref<T>()`
- ✅ Explicit return types for actions
- ✅ Store ID matches the file name
- ✅ Store located in `src/stores/{domain}/`, types in `src/stores/{domain}/lib/types.ts`
- ❌ No Options API stores
- ❌ No `any` in state
- ❌ Store does not import other stores directly from other domains (only via shared/helpers)

---

## 5. Styles (SCSS)

### 5.1 Rules

- ✅ Use SCSS variables from `src/shared/lib/styles/variables.scss`
- ✅ `scoped` for component styles
- ✅ Utility classes from `src/shared/lib/styles/utilities/`
- ❌ No inline styles (use classes)
- ❌ No `!important` (except utilities)
- ❌ No magic numbers (use variables)

---

## 6. WebSocket

### 6.1 Rules

- All interaction via `src/api/websocket/websocket.ts` (client)
- `useWebsocketStore` only for connection state management
- Subscriptions managed through `useAppLoader`
- Commands sent via `sendCommand` with typed options (`SendCommandOptions`)
- Incoming messages validated through type guards in `DataRouter`

---

## 7. Naming Conventions

| Element | Style | Example |
|---|---|---|
| Component files | PascalCase | `WeaponItem.vue` |
| Component folders | kebab-case | `weapon-item/`, `the-map/` |
| Composables | camelCase, `use` prefix | `useAppLoader.ts` |
| Stores | camelCase, `use` prefix, `Store` suffix | `useInventoryStore.ts` |
| FSD layer directories | kebab-case / camelCase (per FSD) | `entities/`, `ui/`, `lib/` |
| Types/Interfaces | PascalCase | `WeaponItem`, `GameStatus` |
| Union types | PascalCase | `CategoryType`, `EquippedHand` |
| Constants | UPPER_SNAKE_CASE | `ZOOM_STEP`, `CONNECTION_STATUS` |
| Functions | camelCase, verb | `getWeaponIconPath`, `setActiveTab` |
| Event handlers | `handle` / `on` prefix | `handleBackAttempt`, `onConnect` |

---

## 8. Performance Review

### 8.1 Reactivity Optimization

| Issue | What to check | Fix |
|---|---|---|
| Excessive reactivity | `ref()` for large objects that don't change deeply | `shallowRef()` |
| Unnecessary computations | `watch` + `ref` instead of `computed` | Replace with `computed` |
| Deep watching | `watch(..., { deep: true })` without explicit necessity | Remove `deep: true` or use `watchEffect` |
| Store destructuring | `storeToRefs()` for non-reactive fields (functions, constants) | Destructure only reactive fields |

### 8.2 Rendering Optimization

| Issue | What to check | Fix |
|---|---|---|
| Heavy lists | Lists > 100 items without `v-memo` | Add `v-memo` |
| Unnecessary re-renders | Child components re-render without prop changes | Precise `defineProps` types, `shallowRef` for parent |
| No lazy loading | Pages/components loaded eagerly | `defineAsyncComponent` or dynamic import |
| `v-if` vs `v-show` | `v-if` for frequently toggled elements | `v-show` for frequent toggles, `v-if` for rare ones |

### 8.3 Bundle Size

| Issue | What to check | Fix |
|---|---|---|
| Heavy imports | Importing an entire library instead of the needed function | Tree-shakeable imports (`import { debounce } from 'lodash-es'`) |
| Code duplication | Same logic in different slices | Extract to `shared` |
| Unused code | Dead code, commented-out blocks | Remove |

### 8.4 Memory & Leaks

| Issue | What to check | Fix |
|---|---|---|
| Subscription leaks | `subscribe()` / `watch()` without cleanup in `onUnmounted` | Save unsubscribe and call in `onUnmounted` |
| Timer leaks | `setInterval` / `setTimeout` without `clearInterval` / `clearTimeout` | Clear in `onUnmounted` |
| EventTarget leaks | `addEventListener` without `removeEventListener` | Remove listener in `onUnmounted` |
| Large objects in state | Storing rarely used data | Lazy loading, pagination |

### 8.5 Network & Data

| Issue | What to check | Fix |
|---|---|---|
| Redundant requests | Repeated requests for the same data | Store-level caching |
| No throttling | Frequent events (resize, scroll, wheel) without throttling | `throttle` / `debounce` |
| Large payloads | Sending full objects when only a few fields are needed | Server-side filtering, pagination |

---

## 9. Security Review

### 9.1 Input Validation (Server Data)

**All data from the server is `unknown` until validated.** No assumptions about structure.

```typescript
// ❌ Dangerous trust in the server
function handleMessage(data: ServerMessage): void {
  document.title = data.playerName; // XSS if the server is compromised
}

// ✅ Validate everything that arrives
function isServerMessage(data: unknown): data is ServerMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).playerName === 'string'
  );
}
```

### 9.2 XSS Prevention

| Vector | Rule | Severity |
|---|---|---|
| `v-html` | Forbidden without `escapeHtml()` | `🔴 Critical` |
| `innerHTML` | Completely forbidden | `🔴 Critical` |
| `document.write()` | Forbidden | `🔴 Critical` |
| `eval()` / `new Function()` | Forbidden | `🔴 Critical` |
| Dynamic URLs | `javascript:` and `data:` URLs must be validated | `🟡 Warning` |
| `setTimeout(string)` | String argument is forbidden | `🔴 Critical` |

### 9.3 Sensitive Data

| Issue | Rule |
|---|---|
| Secrets in code | No tokens, keys, passwords in source code. Only `.env` (public) or server environment variables. |
| `localStorage` | Check availability via try/catch. Do not store sensitive data. |
| Logging | Do not log sensitive data (tokens, passwords, personal data). |
| `console.log` in production | Forbidden — may leak internal information. |

### 9.4 Dependency Security

| Issue | What to check |
|---|---|
| Known vulnerabilities | `npm audit` must pass without critical/high |
| Unused dependencies | Remove from `package.json` |
| Abandoned packages | Check the last update date |

### 9.5 WebSocket Security

| Issue | Rule |
|---|---|
| Message validation | All incoming messages pass through type guards in [`DataRouter`](src/stores/adapters/dataRouter.ts) |
| Reconnection | Exponential backoff to avoid spamming the server |
| Message injection | Server messages cannot trigger arbitrary actions without validation |

---

## 10. Best Practices Review

### 10.1 Code Quality

| Principle | What to check |
|---|---|
| **DRY** | Duplicated logic in different places. Extract to `shared` or composables. |
| **KISS** | Unnecessary complexity. A simple solution is preferable to a "clever" one. |
| **SRP** | A component/function/store does exactly one thing. If the description requires "and" — split it. |
| **Early returns** | Nested `if` deeper than 3 levels. Use guard clauses. |
| **Magic numbers** | Numbers without explanatory constants. Extract to named constants. |

### 10.2 Error Handling

| Issue | Rule |
|---|---|
| Swallowed errors | `try { ... } catch {}` without handling — `🔴 Critical` |
| Uninformative errors | `throw new Error('fail')` — must have a clear message |
| Missing error boundaries | Critical sections without try/catch. Add [`ErrorBoundary`](src/app/ui/skyrim-content/SkyrimContent.vue)-like handling. |
| Promise without catch | Every promise must have a rejection handler. |

### 10.3 State Management

| Issue | Rule |
|---|---|
| Local state in store | Data used only in one component must not be in a global store. |
| State mutation from outside | Store is mutated directly from a component instead of through actions. |
| Missing reset | Store has no state reset method (important for reconnection). |

### 10.4 Component Design

| Issue | Rule |
|---|---|
| Monolithic props | Passing an entire object when only 2 fields are needed. Split props. |
| Too many props | > 5 props — reason to consider decomposition or a config object. |
| Side effects in computed | `computed` must not mutate state or make requests. |
| Business logic in template | Complex expressions in `{{ }}` or `v-if`. Extract to `computed`. |

### 10.5 Testing

| Issue | Rule |
|---|---|
| Testing implementation | Tests check internal state instead of behavior. |
| Brittle tests | Tests break on refactoring. Test the public API. |
| Missing edge cases | No tests for `null`, `undefined`, empty arrays, boundary values. |

---

## 11. i18n

- All UI strings via `t('path.to.key')`
- Locale files: `src/i18n/locales/{lang}.json`
- Keys are structured: `pages.{tab}.{subtab}.{key}`
- ❌ No hardcoded strings in templates

---

## 12. Logging

### 12.1 Ban on `console.log` in Runtime Code

`console.log` is **forbidden** in runtime code — the linter emits an error (`no-console: error`).

Only allowed:
- `console.warn` — for warnings
- `console.error` — for errors

### 12.2 Dev-only Logger `logger.log`

For debug logging, use the [`logger`](src/shared/lib/utils/logger.ts) helper:

```typescript
import { logger } from '@/shared/lib/utils/logger';

logger.log('Message appears only in dev mode');
```

- In production builds, the `console.log` call inside `logger.log` is removed by Vite's tree-shaking (via `import.meta.env.DEV`)
- `console.warn` and `console.error` remain in production — they are not wrapped in `logger`

### 12.3 Exceptions

- [`vite.config.js`](vite.config.js) — build-time configuration, `console.log` allowed with `eslint-disable-next-line no-console`
- Inside [`logger.ts`](src/shared/lib/utils/logger.ts) itself — `console.log` suppressed via `eslint-disable-next-line no-console`

---

## 13. Language Rule

**The project uses English exclusively** for all code-related text:
- ✅ Comments in code
- ✅ Variable and function names
- ✅ Commit messages
- ✅ Documentation (except i18n locale files)
- ✅ PR descriptions and code review comments

The only exception is i18n locale files (`src/i18n/locales/ru.json`), which contain Russian translations.

---

## 14. Review Checklist

### Verify before approval:

#### Architecture
- [ ] **FSD Layers:** Files are in correct FSD layers, no hierarchy violations
- [ ] **Components:** Each `.vue` in its own kebab-case folder, no "bare" components in directories
- [ ] **Imports:** No bottom-up imports across layer hierarchy
- [ ] **Public API:** Imports go through `index.ts`, not directly
- [ ] **Separation of Concerns:** UI separated from business logic, data flow is unidirectional
- [ ] **Abstraction Level:** No leaky abstractions, no god objects
- [ ] **Coupling:** No circular dependencies, low coupling between slices
- [ ] **Scalability:** New features/pages/maps can be added without modifying existing code

#### TypeScript
- [ ] **Types:** All types in `lib/types.ts`, no types in random places
- [ ] **`as`:** Not a single `as` (except `as const`)
- [ ] **`any`:** Not a single `any`
- [ ] **`never`:** No `never` in type annotations
- [ ] **TypeScript:** `tsc --noEmit` passes without errors
- [ ] **ESLint:** `eslint` passes without errors

#### Vue / Pinia
- [ ] **Vue:** Components use `<script setup lang="ts">` with `scoped` styles
- [ ] **Pinia:** Stores use Composition API, typed, located in `src/stores/{domain}/`

#### Performance
- [ ] **Reactivity:** `shallowRef` for large objects, `computed` over `watch`+`ref`
- [ ] **Rendering:** `v-memo` for heavy lists, lazy loading for pages
- [ ] **Memory:** No leaks — subscriptions/timers/listeners cleaned up in `onUnmounted`
- [ ] **Bundle:** No heavy imports, no dead code, no duplicated logic
- [ ] **Network:** No redundant requests, throttling for frequent events

#### Security
- [ ] **XSS:** No `innerHTML`/`v-html` without escaping, no `eval`/`new Function`
- [ ] **Input Validation:** All server data validated through type guards
- [ ] **Secrets:** No secrets in code, `localStorage` access wrapped in try/catch
- [ ] **Dependencies:** `npm audit` clean, no unused/abandoned packages
- [ ] **WebSocket:** All messages validated, reconnection with backoff

#### Best Practices
- [ ] **DRY/KISS/SRP:** No duplication, no over-engineering, single responsibility
- [ ] **Error Handling:** No swallowed errors, informative messages, Promise catch handlers
- [ ] **State:** No local state in global stores, no direct mutations from components
- [ ] **Components:** Props are granular, no side effects in `computed`, no business logic in templates

#### Other
- [ ] **Testing:** `npm run test:ai` passes without errors
- [ ] **Logging:** No `console.log` in runtime code (use `logger.log`)
- [ ] **i18n:** No hardcoded strings in UI
- [ ] **Styles:** No inline styles and `!important`
- [ ] **Language:** Comments and identifiers are in English

---

## 15. Automation (Recommendations)

Recommended ESLint rules for enforcement:

```jsonc
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      { "assertionStyle": "never" }
    ],
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["@/entities/*", "!@/entities/*/index"],
            "message": "Import only through the slice public API (index.ts)"
          }
        ]
      }
    ]
  }
}
```

Recommended ESLint rules for strict enforcement:
- `@typescript-eslint/no-explicit-any`: `error`
- `@typescript-eslint/consistent-type-assertions`: ban all `as`
- `@typescript-eslint/no-non-null-assertion`: `error`
- `no-restricted-syntax` for banning `as` (custom rule)
- `import/no-internal-modules` or `no-restricted-imports` for FSD layers

---

## 16. Testing

### 16.1 Test File Placement

**Tests live in a `tests/` folder inside the slice of the object being tested.**

```
{layer}/{sliceName}/
├── lib/
├── ui/
├── tests/                  # ✅ Test files for this slice
│   └── *.test.ts
└── index.ts
```

**Rules:**
- ✅ Test files are named `*.test.ts` or `*.spec.ts`
- ✅ Each test file lives in `tests/` subdirectory of the slice it tests
- ✅ Global test setup: `src/tests/setup.ts`
- ❌ NO `__tests__` folders — use `tests/`

### 16.2 Running Tests

```bash
npm test            # Run all tests once
npm run test:watch  # Watch mode
npm run test:coverage # With coverage report
npm run test:ai     # Compact output for AI agents
```

#### `test:ai` — AI-Agent Friendly Output

Uses [`scripts/test-ai.mjs`](../../scripts/test-ai.mjs) to produce minimal, token-efficient output:

- **Success:** `✅ All 155 tests passed in 1 file`
- **Failure:** Only failed test names and assertion messages, no stack traces or ANSI

**Always use `npm run test:ai` when running tests in an AI agent context** to minimize token consumption.

### 16.3 Review Checklist — Tests

- [ ] **Placement:** Test files are in `tests/` folder of the tested slice, not `__tests__/`
- [ ] **Coverage:** All type guards tested with valid, invalid, and edge case data
- [ ] **Isolation:** Tests do not depend on execution order
- [ ] **Mocks:** Global mocks are in `src/tests/setup.ts`, local mocks at test file level
- [ ] **AI output:** Use `npm run test:ai` for agent-friendly test output
