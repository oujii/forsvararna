# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the React + TypeScript app. Entry points are `src/main.tsx` and `src/App.tsx`.
- `src/components/` contains feature windows and `src/components/ui/` for shadcn/ui primitives.
- `src/pages/`, `src/contexts/`, `src/hooks/`, `src/lib/`, and `src/types/` keep routing, state, utilities, and shared types organized.
- `public/` stores static assets served as-is. Root images like `left.png` and `right.png` are referenced directly by the app.

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server with hot reload.
- `npm run build`: production build to `dist/`.
- `npm run build:dev`: development-mode build (useful for debugging production issues).
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint across the repo.

## Coding Style & Naming Conventions
- Use TypeScript + React function components; keep components in `PascalCase.tsx` (e.g., `MailWindow.tsx`).
- Indentation: 2 spaces, align with existing files.
- Styling uses Tailwind CSS plus `src/App.css` and `src/index.css` for base rules.
- Linting is defined in `eslint.config.js`; follow React Hooks rules and keep exported components as direct exports for Fast Refresh.

## Testing Guidelines
- No test framework is configured yet. If you add tests, propose the framework and document the convention (e.g., `*.test.tsx`) and include a `npm test` script.

## Commit & Pull Request Guidelines
- Commit history uses short, imperative messages (sometimes Swedish). Keep messages concise and action-oriented (e.g., “Add Aftonbladet homepage”).
- PRs should describe the change, include before/after screenshots for UI changes, and reference related issues or design notes.

## Security & Configuration Tips
- Do not commit secrets. If environment variables are introduced, document them in `README.md` and provide an `.env.example`.
