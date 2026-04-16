Copilot Instructions

## Project Overview
The FIJA platform is a high-performance digital ecosystem designed for university admission preparation. It uses a Feature-Based Architecture to ensure scalability and maintainability. This repository includes not only backend and data contracts but also clear guidance for organizing UI/UX artifacts: where to place atomic UI primitives, feature-scoped components and screens, design tokens, and lightweight UX specs so that frontend and design remain synchronized with business logic.

## Main context (Guiding Document)
The primary source of truth for architectural decisions and priorities is the "FIJA Backend: Step-by-Step Guide (Software Engineering)" document located at docs/backend-step-by-step-plan.md.

Quick summary of content to guide daily work:
- Project Phases (Phase 1..7): Follow the order of deliverables for feature implementation.
- Data Model: Strict use of UUIDs and timestamps for users, groups, lessons, questions, lesson_attempts, user_rewards, and ai_explanations.
- API Contracts: Mandatory versioning under /v1 for roadmap, lessons/question, answer, insight/generate, ranking, and profile stats.
- Security: Implementation of JWT, RLS (Row Level Security), rate limiting, Zod validation, and minimum auditing.
- Data Strategy: Seed and migrations to populate Groups A/B/C/D as the initial operational base.

### Core Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Database: Prisma (PostgreSQL)
- Authentication: Better Auth
- State Management: Zustand (UI state only)
- Data Fetching: Server Components (Primary), SWR (Client-side revalidation)
- Mutations: Server Actions (Strictly no traditional API routes for internal logic)

---

## Architectural Rules

### 1. Feature-Based Directory Structure
Code is organized by business domain in src/features/. Each feature folder must be self-contained:
- features/[feature-name]/components/: Feature-specific UI (e.g., lesson-card.tsx, ranking-table.tsx).
- features/[feature-name]/screens/: Feature-specific full screens (e.g., roadmap-screen.tsx).
- features/[feature-name]/actions/: All mutations via 'use server'.
- features/[feature-name]/store/: Zustand slices for UI state (Modals, Slide-downs).
- features/[feature-name]/schemas/: Zod schemas for validation.
- features/[feature-name]/types/: Specific TypeScript interfaces and API contracts.

### 2. Server-First Logic (KISS Principle)
- Server Components: Fetch data directly via Prisma in async components.
- Server Actions: All form submissions and data changes MUST use Server Actions.
  - Always include 'use server'.
  - Validate inputs with Zod at the start of the function.
  - Check session via better-auth before any DB mutation.
- Zustand: Use strictly for UI State. Do not store database entities in Zustand; let the server handle data and use SWR or Server Component revalidation for updates.

---

## Coding Standards

### Indentation & Style
- Indent: 2 spaces.
- Naming: PascalCase for components, camelCase for functions/variables.
- Complexity: Prefer native Next.js features over external libraries.

### TypeScript & Validation
- Strict Types: Avoid any. Use Prisma-generated types or explicit interfaces.
- Zod Schemas: Required for every Server Action and Form to ensure data integrity.
- LaTeX: Render math/science content using LaTeX within Markdown for questions and AI insights.

### Comments
- Use JSDoc for complex business logic (e.g., streak calculation or reward deltas).
- Focus comments on the "Why" (Intent) rather than the "What."

---

## Root Folders & Navigation
- app/: App Router (Pages, Layouts). Delegate complex logic to features/.
- components/ui/: Atomic, reusable UI elements (Buttons, Inputs, Cards) via Shadcn/UI or similar.
- lib/: Shared singletons (Prisma client, Better Auth config, AI provider).
- hooks/: Global reusable hooks (e.g., usePagination, useCountdown).

### UI/UX Interfaces & Reuse
- Shared Primitives: Atomic UI components live in components/ui/ and are framework-agnostic.
- Design Tokens: Centralized in styles/tokens.ts (colors, spacing, typography).
- UX Specs: Lightweight markdown in docs/features/[feature-name]/ui.md for responsive behavior and accessibility notes.
- Admin Flow: Use parallel folders under app/admin/ following the same feature-based logic for management interfaces.

---

## Operational Workflows

### Finding Related Code
- Search features/ by domain (e.g., "AI Explanation" -> features/ai-insight).
- Check prisma/schema.prisma for the source of truth on data structures.

### Validation Steps
1. Type Check: tsc --noEmit.
2. Security Check: Verify RLS policies and auth.getSession() in Server Actions.
3. AI Fallback: Ensure explanation_base is used if the AI provider fails.
4. Consistency: Ensure pagination logic is consistent across Ranking and History features as per project history.
