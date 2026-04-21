# The Block - Navigation Guide

This document maps out the architecture and structure of the application. Use this guide to easily navigate the codebase during your technical review or demo presentation.

## Project Structure (The `src/` Directory)

All application code lives in `/src`. The architecture follows a strict domain-driven, modular approach. 

```text
src/
├── assets/         # Static assets (images, SVGs)
├── components/     # UI Components grouped by domain
│   ├── bid/        # Bidding features (forms, confirmations, modals)
│   ├── inventory/  # Vehicle listing features (cards, grids, filters)
│   ├── layout/     # App shell (Header, Navigation)
│   ├── shared/     # Reusable UI primitives (badges, countdowns)
│   ├── vehicle/    # Vehicle detail pieces (gallery, specs, history)
│   └── watchlist/  # Global watchlist logic and buttons
├── hooks/          # Custom React hooks
├── lib/            # Pure utility functions (biz logic, formatting)
├── pages/          # Top-level route components
├── stores/         # Zustand global state managers
└── types/          # TypeScript interfaces (Vehicle schema)
```

## Where is the Code for [Feature]?

Use this cheat sheet to quickly jump to the source code for specific features:

### 1. The Bidding Engine
- **Entering a bid:** `src/components/bid/bid-form.tsx` (Handles min-increment validation)
- **Confirming a bid:** `src/components/bid/bid-confirm-dialog.tsx`
- **Global Bid State:** `src/stores/bid-store.ts` (Zustand state holding optimistic bids)
- **Bid Increment Math:** `src/lib/vehicles.ts` -> `getMinNextBid()` function.

### 2. The Filter & Sort Pipeline
- **The Filter Component:** `src/components/inventory/filter-sidebar.tsx`
- **The Toolbar (Search/Sort):** `src/components/inventory/inventory-toolbar.tsx`
- **The Computation Logic:** Look inside `src/pages/inventory-page.tsx`. Everything is processed via a unitary `useMemo` block that calls `applyFiltersAndSort()` located in `src/lib/vehicles.ts`.

### 3. Time Manipulation (The "Live" Timers)
- **The Normalizer:** `src/lib/auction.ts` -> `normalizeAuctionTimes()`. This function shifts the static JSON times to relative real-world times.
- **The UI Countdown:** `src/components/shared/countdown-timer.tsx` (Look here for the red-pulsing urgency animation logic).

### 4. The Watchlist
- **The State Manager:** `src/stores/watchlist-store.ts` (Uses Zustand's `persist` middleware to write directly to your browser's Local Storage).
- **The Toggle Button:** `src/components/watchlist/watchlist-button.tsx` (Hover/active states).

## Global Configuration
- **Design Tokens (Colors/Fonts):** `src/index.css`. All CSS is contained here, mapping Custom Properties to Tailwind v3 utility classes.
- **Vite Config:** `vite.config.ts` (Configured for path aliases e.g., `@/components`).
- **Tailwind Config:** `tailwind.config.js`.
