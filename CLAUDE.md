# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Windows 10 UI simulation built as a React + TypeScript SPA using Vite. The application mimics a Windows desktop environment with multiple resizable windows including browser, chat applications, and mail client. It's designed as an interactive demonstration/training tool for emergency dispatch scenarios.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture

### Core State Management
The main application state is managed in `App.tsx` with complex window state tracking:
- Multiple window types (browser, chat, chat2, mail) each with minimized/closed states
- Window focus management (activeWindow state)
- System datetime synchronization across components
- Scripted sequence control for demonstrations

### Key Components Structure

**Layout Components:**
- `WindowsStartbar` - Bottom taskbar with window controls and system tray
- `WindowsDialog` - Main browser window component
- `ChatWindow` / `ChatWindow2` - Chat application windows
- `MailWindow` - Email client window

**Window Management:**
All windows follow the same pattern with props for:
- `isMinimized` / `setIsMinimized`
- `isClosed` / `setClosed`
- `activeWindow` state for focus management
- `onFocus` callback for bringing windows to front

**UI Framework:**
- Uses shadcn/ui components extensively (located in `src/components/ui/`)
- Tailwind CSS for styling with Windows 10 visual theme
- React Router for page navigation
- TanStack Query for data fetching

### File Organization

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── *Window.tsx      # Window components (ChatWindow, MailWindow, etc.)
│   └── WindowsStartbar.tsx
├── pages/               # Route components
│   ├── Index.tsx        # Main desktop page
│   ├── Incidentrapportering.tsx
│   └── NotFound.tsx
├── hooks/               # Custom React hooks
├── contexts/            # React contexts
├── types/               # TypeScript type definitions
└── lib/                 # Utility functions
```

### State Flow
1. `App.tsx` manages global window states and passes them down to `Index.tsx`
2. `Index.tsx` renders all window components with their respective states
3. `WindowsStartbar` receives toggle functions and window states for taskbar controls
4. Each window component manages its own internal state while reporting status up

## Development Notes

- Uses Lovable platform integration (componentTagger in development mode)
- ESLint configured with React hooks and TypeScript rules
- Vite dev server runs on `::` (all interfaces) port 8080
- Path alias `@/` points to `src/` directory
- No test framework currently configured
- Uses bun for package management (bun.lockb present)

## Key Features to Understand

- **Window Focus System**: Complex z-index and focus management to simulate real Windows behavior
- **Scripted Sequences**: Automated demonstration sequences that can be triggered
- **Time Synchronization**: Shared system time state across multiple components
- **Responsive Windows**: All windows support resize, minimize, maximize, and close operations