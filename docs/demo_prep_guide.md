# OPENLANE Technical Walkthrough Prep Guide

This is your ultimate cheat sheet for the 45-60 minute technical evaluation. Keep this open on a second monitor during your call.

---

## Part 1: Demo (~5 min)
*The goal is not to show every button, but to show the "happy path" and highlight the B2B focus.*

**Your Script / Flow:**
1. **The Grid & Timers:** "Welcome to The Block. This is a frontend tailored for wholesale B2B auto dealers. The first thing you'll notice is the data density. I built a 'Time Normalizer' algorithm that maps the static JSON timestamps against the current time. This brings the prototype to life, ensuring we always see a live mix of 'Ending Soon' (pulsing red), 'Active', and 'Upcoming' auctions."
2. **The Filtering Pipeline:** Open the Filter Sidebar. "Dealers have specific buying mandates. I built a highly optimized, multi-faceted filtering pipeline. As I drag the condition slider and toggle 'SUVs', notice how fast and seamlessly the grid and result count update without any loading churn."
3. **The Watchlist:** Click the bookmark icon on a car. "When monitoring 200+ cars, you need a shortlist. I tied the Watchlist to a Zustand store empowered by `localStorage` so saved vehicles persist across sessions."
4. **The Bidding Engine:** Click into an active vehicle. Type in a lowball bid. "Real auctions use tiered minimum increments. My logic enforces that cheap cars increment by $100, but luxury cars increment by $500. Once I place a valid bid..." (Place a bid) "...the store immediately provides optimistic UI feedback via a successful toast and updates the session history."

---

## Part 2: Decisions (~15 min)
*They will ask why you chose your stack, what you built first, what you cut, and what you'd add.*

**1. The Stack Choice**
*   **React + Vite:** Industry standard for fast iteration and rapid hot-module loading.
*   **Tailwind CSS (v3):** High velocity styling without context switching. (Note: Mention you explicitly forced standard CSS variable mapping in `index.css` to keep the UI tokens highly organized and scalable).
*   **Zustand:** Chosen over Redux for its incredibly lean boilerplate. Perfect for separating the ephemeral state (bids that shouldn't persist across refresh so data doesn't get stale) from the persistent state (the Watchlist saved to LocalStorage).

**2. What I Cut (The "No Backend" Decision)**
*   *Key talking point:* "I explicitly chose **not** to build a backend. The provided JSON is static. Building an Express server just to serve static JSON adds zero buyer-facing value for a prototyping challenge. I intentionally re-allocated that time budget to polish the UX, handle complex filtering pipelines, and build a robust bidding interface."

**3. What I Built First**
*   "I started with the data layer. Before touching the UI, I wrote the `useVehicles` hook and the `normalizeAuctionTimes` function. Getting the data flowing and making the auction timers 'tick' historically relative to the current clock was the foundation."

**4. What I'd Add With More Time**
*   **WebSockets:** Replace local polling with Socket.io / WebSocket connections for true real-time bid blasting across multiple clients.
*   **Backend Auth:** Hono / Node API with JWTs for Dealer vs. Admin scoping.
*   **Virtualization:** If the JSON scaled from 200 cars to 5,000, I would implement `react-window` to virtualize the DOM nodes and maintain 60fps scrolling.

---

## Part 3: Code (~15 min)
*Have these three files ready in your IDE. They are your "Showcase Files".*

**1. `src/pages/inventory-page.tsx` (The Filtering Pipeline)**
*   *Why you're proud:* It handles 9 different filter dimensions (price, grade, strings, arrays) and sorting in a single, highly performant `useMemo` block. Point out the `applyFiltersAndSort` call.

**2. `src/lib/auction.ts` (The Time Normalizer)**
*   *Why you're proud:* This shows product-minded engineering. Instead of accepting boring static times, you wrote an algorithm that mathematically shifts the JSON timestamps to the current hour so the UI urgency pulses (red/amber/green indicators) actually work during the demo.

**3. `src/lib/vehicles.ts` -> `getMinNextBid()`**
*   *Why you're proud:* It proves you understand the business context. You wrote a tiered sliding scale calculation so $5,000 cars demand $100 increments, and $45,000 cars demand massive $500 increments.

**4. Polish Details (Bonus)**
*   Mention that you intentionally implemented small accessibility and UX touches: `aria-current` on navigation, scroll-to-top routing on pagination, and `Escape` key event listeners bound in `useEffect` to safely close the bid modals. 

---

## Part 4: Workflow / Process (~15 min)
*How you work and approach projects.*

*   **Design-Tokens First:** Explain that you don't just "start writing components". You started by defining `--surface`, `--brand`, and `--text` CSS custom properties in `index.css` so that the entire team has a shared design language.
*   **Domain-Driven Folders:** Explain your `src/` layout. "I don't just dump everything in a components folder. I split them by domain: `bid`, `inventory`, `vehicle`, `watchlist`, and `shared`. This makes the codebase immediately readable for new engineers."
*   **Iterative Polish:** "I build the happy path first to ensure functionality, and then I do a dedicated 'Polish Pass'—that's when I added the toast animations, error states, keyboard listeners, and mobile overlay fixes."

---

## Part 5: Questions to Ask Them (~5 min)
*When they ask "Do you have any questions for us?", ask these to sound like a senior engineer thinking about scale and product:*

1. *"When building features for wholesale dealers at OPENLANE, how do you balance creating dense, data-rich interfaces (like financial terminals) versus keeping the UX simple for mobile users on the lot?"*
2. *"How are you currently handling real-time bid synchronization on the frontend? Are you relying heavily on WebSockets, Server-Sent Events, or aggressive polling?"*
3. *"What is the most technically challenging part of migrating or maintaining the front-end architecture at OPENLANE right now?"* 
