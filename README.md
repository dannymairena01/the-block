# The Block

## How to Run

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

## Time Spent

**~8 hours** across 4 working sessions.
- Session 1 (2h): Data analysis, architecture, scaffold, core design tokens
- Session 2 (2.5h): Inventory grid, search, faceted filters, sort algorithm, pagination
- Session 3 (2h): Vehicle detail page, bid validation, timer system, confirmation logic
- Session 4 (1.5h): Zustand watchlist syncing, UI polish, dark mode tuning, error states

## Assumptions and Scope

- **Frontend-only**: A deliberate scope decision based on the constraints. The provided JSON is static with no persistence required. Building a mock backend to serve identical JSON adds zero buyer-facing value. I focused the time budget on UI/UX product decisions instead.
- **Auction timers**: B2B vehicle auctions need urgency. Since the dataset's timestamps were static, I implemented an auction normalizer that maps the start/end times relative to "now", ensuring the prototype constantly displays a mix of ended, ending-soon (< 15m), active, and upcoming auctions.
- **Bids are optimistic**: Bidding works by writing updates to a local Zustand store, meaning the experience resets on a page refresh. This is an intentional choice for a financial prototype, preventing stale caching.

## Stack

- **Frontend**: React 19 + Vite 5 + TypeScript
- **Styling**: Tailwind CSS v3
- **State**: Zustand (bids, watchlist) 
- **Data**: TanStack React Query + Local JSON
- **Routing**: React Router v7

## What I Built

A complete B2B buyer-facing auction application tailored to wholesale vehicle dealers. Features include a dynamic layout across 200 units, multi-faceted filtering (price, grade, options), sorting, session-based bidding with min-increment logic, reserve-not-met indicators, a global watchlist with local storage persistence, and a live urgency countdown system.

### Feature Checklist

**✅ Required Base Features:**
- [x] View a responsive grid/list of vehicle inventory
- [x] View detailed information for a specific vehicle
- [x] Ability to place bids on a vehicle
- [x] Search, Filter, and Sort the vehicle inventory

**🚀 Features We Added (Stretch Goals):**
- [x] **Urgency Timer Normalizer**: Algorithmically maps static JSON timestamps to relative "real-time" countdowns (Ending Soon, Active, Ended).
- [x] **Tiered Bid Math**: Rejects invalid bids based on sliding-scale minimum increments (matching real auto auctions).
- [x] **Global Watchlist**: Stores saved user vehicles via a Zustand hook directly to localStorage so preferences survive hard refreshes.
- [x] **Reserve Status Intelligence**: Exposes a "Reserve Met" / "Not Met" boolean UI without leaking the actual reserve integer value.
- [x] **Buy-Now Cart System**: Instantly bypasses the auction timer to "force-sell" vehicles containing a buy-now price threshold.
- [x] **Multi-faceted Computation Pipeline**: Computes 9 separate nested state filters iteratively in milliseconds using a unified `useMemo` block.

## Notable Decisions

1. **No backend** — Static dataset means a backend adds zero user-facing value. Better to spend the hours nailing the UX of the bid flow.
2. **Derived Data Rendering Pipeline** — A single `useMemo` pipeline computes all active text searches, filters, sorting, and pagination across 200 items in milliseconds.
3. **Tiered bid increments** — Bids force minimum increments depending on the vehicle's price tier. A $5k car increments by $100, while a $45k car increments by $500. This models actual auction behavior.
4. **Reserve visualization** — The buyer is never shown the exact reserve number, only "Reserve Met" or "Reserve Not Met". Stating the exact number destroys auction game theory in real platforms.
5. **Time Normalization Module** — Wrote a small algorithm to map synthetic timestamps to the current hour. The UI actively pulses red for any cars ending under 15 minutes.

## Testing

No automated tests were written due to the strict timebox constraints. Manual validation involved:
- Layout and design across Safari, Chrome, and iOS Simulator (Device sizes < 380px upwards to Desktop).
- Edge scenarios for bid submissions (e.g. submitting bids lower than minimum increment, buy-now execution).
- Cross-tab local-storage testing for the watchlist functionality.

## What I'd Do With More Time

**Production Backend Setup:**
- A Cloudflare Worker/Hono API layer mediating between the React app and PostgreSQL.
- WebSocket streaming (Socket.io) to blast universal bid state updates rather than simple local client polling.
- Full JWT authentication to support B2B multitenancy (admin/dealer scopes).

**Missing Capabilities:**
- React Window / virtualized list implementation (If dealer inventory scaled beyond ~500 visible listings).
- Saved Search triggers via SMS.
- Bid Snipe configurations.
