# Skill: nextjs-resource-pages-generator

## Purpose
Generate App Router pages for resource flows (list, edit by id, and new) using feature-based imports and server-first data loading.

## Execution Protocol
1. **Path Strategy**: Generate page files under `app/` using the requested route convention.
2. **Flow Type**: Support `list`, `edit`, and `new` page modes with deterministic imports.
  - Set one branch flag only: `isList` or `isEdit` or `isNew`.
  - Keep `flowType` aligned with the selected branch flag.
3. **Feature Imports**:
  - Components from `@/features/[feature]/components/*`.
  - Server actions from `@/features/[feature]/actions/*`.
4. **Server-First**:
  - Keep pages as Server Components by default.
  - Load data with server actions (`await`) directly in the page.
5. **KISS Loading**:
  - Fetch only data used by the rendered component.
  - Use `Promise.all` for independent requests in list pages.
6. **Not Found UX (edit)**:
  - If resource data is missing, render a lightweight fallback state.
7. **Search Params (list)**:
  - Accept `searchParams?: Promise<Record<string, string | undefined>>`.
  - Normalize optional filters before invoking server actions.
8. **No Internal API Routes**:
  - Do not introduce API route calls for internal data retrieval.

## Constraints
- Do not use `any`; use explicit local types.
- Keep imports stable and feature-scoped.
- Do not place business logic inside `app/` pages; delegate to feature actions/components.
- Keep indentation at 2 spaces.

