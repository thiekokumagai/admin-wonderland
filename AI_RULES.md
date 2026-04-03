# AI Rules

## Tech stack
- React 18 with TypeScript for all application code.
- Vite is used for development, builds, and the app runtime tooling.
- React Router is used for client-side routing, with routes defined in `src/App.tsx`.
- Tailwind CSS is the primary styling system for layout, spacing, typography, and visual design.
- shadcn/ui is the default component library for UI building blocks.
- Radix UI powers accessible low-level primitives underneath many UI components.
- TanStack Query is available for server-state fetching, caching, and async data synchronization.
- React Hook Form and Zod are available for form state management and schema validation.
- Lucide React is the standard icon library for interface icons.
- Sonner and the existing toast components are available for notifications and transient feedback.

## Library usage rules
- Use **TypeScript** for every new source file and keep app code inside the `src/` folder.
- Use **React function components** and hooks; do not add class components.
- Use **React Router** for navigation and page routing. Keep route declarations in `src/App.tsx`, and place page components in `src/pages/`.
- Use **shadcn/ui** first for buttons, dialogs, inputs, cards, tables, dropdowns, sheets, tabs, and other common UI patterns. Do not rewrite these primitives from scratch unless no suitable component exists.
- Use **Radix UI** primitives only when building a custom component that is not already covered by an existing shadcn/ui component.
- Use **Tailwind CSS** for styling. Prefer utility classes in components over custom CSS files. Only add custom CSS when Tailwind alone is not practical.
- Use **TanStack Query** for API/server data that needs fetching, caching, refetching, loading states, or mutation handling. Do not use it for simple local UI state.
- Use **React state/hooks** for local component state, temporary UI interactions, and view-only state.
- Use **React Hook Form** for non-trivial forms, especially forms with validation, multiple fields, or submission handling.
- Use **Zod** to define validation schemas for user input and pair it with React Hook Form via `@hookform/resolvers` when schema-based validation is needed.
- Use **Lucide React** for icons throughout the app. Avoid mixing in other icon libraries.
- Use **Sonner** or the existing toast utilities for success, error, and status notifications instead of building custom toast systems.
- Use **Recharts** for charts and data visualizations; do not hand-roll chart components with raw SVG unless there is a specific need.
- Use **date-fns** for date formatting, parsing, and date math instead of custom date utilities.
- Use the existing **`cn` utility** patterns with `clsx`, `tailwind-merge`, and class-variance-authority when composing class names or component variants.

## Structure rules
- Put reusable UI or feature components in `src/components/`.
- Put route-level screens in `src/pages/`.
- Keep components small and focused; extract reusable pieces instead of creating very large page files.
- Prefer existing project patterns and imports (such as `@/` aliases) when adding new code.
- Reuse existing providers already configured in the app, including query, tooltip, and toast providers.
