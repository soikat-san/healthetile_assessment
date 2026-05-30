# React Take-Home: Live Support Ticket Triage Console

Build a React application that helps support agents triage a high
volume of customer support tickets in real time.

You are given a mock backend in `src/api/`. The backend is
asynchronous, sometimes slow, sometimes fails, returns data in
inconsistent shapes, and pushes live updates from "other agents"
through an event stream. Treat it like a real third-party service:
**you cannot change it, and you must make your UI work in spite of
it.**

We are not only evaluating whether the app works. We are evaluating
the choices you make, how you handle edge cases, and whether you can
defend your design in a follow-up conversation.

You may use AI tools (Copilot, Cursor, ChatGPT, Claude, etc.),
libraries, documentation, and any online resources. You are
responsible for the final implementation and must be able to explain
every meaningful decision.

---

## Time expectation

**Recommended: 3 to 5 hours. Hard cap: 6 hours.**

We do not expect you to finish every bonus feature. We are explicitly
evaluating what you choose to prioritize and what you choose to cut.
A focused, working slice with thoughtful tradeoffs beats a sprawling,
half-broken submission.

---

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173. The starter `App.tsx` just dumps the raw
response of `fetchTickets()` so you can see the shape of the data you
are working with. You are expected to throw it away and design your
own architecture.

Optional: set `VITE_TICKET_COUNT` to change the dataset size (default
5000), e.g. `VITE_TICKET_COUNT=20000 npm run dev`.

---

## Tech requirements

Use:

- React (functional components)
- TypeScript (preferred) or JavaScript
- Any styling approach (vanilla CSS, CSS modules, Tailwind, etc.)
- Any UI/component library, if you want one
- Any state management approach, if justified

You may use any libraries you like, including but not limited to:
TanStack Query, SWR, Redux Toolkit, Zustand, Jotai, React Hook Form,
React Router, Zod / Valibot, TanStack Table, react-window / virtua,
testing libraries.

You do **not** need to build a real backend.

---

## Product context

Support agents need to quickly answer:

1. Which tickets need attention right now?
2. Which tickets are assigned to whom?
3. Which customers are affected, and on what plan?
4. Which tickets are new, in progress, waiting, or resolved?
5. Can I safely change a ticket's status without stomping someone else's edit?
6. What does the UI do when the backend hiccups, returns garbage, or pushes a live update that contradicts what I'm looking at?

Design the interface around that workflow. You decide the layout.

---

## Functional requirements

### 1. Ticket list

Display tickets. You may pick any layout: table, cards, split pane,
master/detail, etc.

The dataset is ~5,000 tickets by default. Your UI should remain
responsive while the user is searching, filtering, or sorting.

### 2. Search

Search by title, customer name, or ticket id.

### 3. Filtering

Filter by at least:

- status
- priority
- assignee

### 4. Sorting

Sort by at least:

- created date
- last updated date
- priority

You decide how invalid or missing dates sort.

### 5. Ticket detail view

Allow the agent to inspect a single ticket. Side panel, modal,
expandable row, dedicated page — your choice.

### 6. Status update

Allow the agent to change a ticket's status. Supported statuses are
`new`, `in_progress`, `waiting_on_customer`, `resolved`.

`updateTicketStatus(id, status, expectedVersion)` uses optimistic
concurrency:

- if `expectedVersion` matches the server, the update applies and the
  new ticket is returned
- if it does not match (someone else updated the ticket since you
  last saw it), the call **resolves** (not rejects) with
  `{ ok: false, conflict: true, latest }`
- transport errors are still thrown

How you handle conflicts is part of what we are evaluating. Explain
your approach in the README.

### 7. Live event stream

`subscribeToTicketEvents(listener)` returns an unsubscribe function
and pushes `ticket.updated`, `ticket.created`, and `ticket.assigned`
events at random intervals between 1.5 and 5 seconds, simulating
other agents touching the same data.

The UI must reflect these updates without forcing the user to reload.
How you reconcile live events with whatever local / optimistic state
you keep is also part of what we are evaluating.

### 8. Loading, error, empty, and malformed states

The app must gracefully handle:

- initial loading
- fetch failure (with a way to retry)
- update failure
- update conflict
- empty filtered result
- malformed ticket data: null customer, customer as a bare string,
  missing plan, invalid date strings, unknown status / priority
  values, missing title, snake_case vs camelCase field names
- a live event referencing a ticket the client has not seen yet

A small but meaningful fraction of the dataset is intentionally
malformed. The app should not crash on any of it.

### 9. Persistence

Persist at least one meaningful piece of UI state across reloads.
Examples: selected filters, sort order, selected ticket, layout
preference. `localStorage`, URL query params, or any other approach
is fine. Explain your choice.

---

## The API

All in `src/api/`:

```ts
// src/api/ticketApi.ts
fetchTickets(signal?: AbortSignal): Promise<unknown>
fetchTicketById(id: string, signal?: AbortSignal): Promise<RawTicket>
updateTicketStatus(
  id: string,
  next: TicketStatus,
  expectedVersion: number,
  signal?: AbortSignal
): Promise<UpdateTicketStatusResult>
resetTickets(): Promise<void>

// src/api/ticketEvents.ts
subscribeToTicketEvents(
  listener: (event: TicketEvent) => void
): () => void
```

A few things to note about this API:

- `fetchTickets()` returns `unknown` because the response shape is
  inconsistent. Sometimes `{ data: [...] }`, sometimes
  `{ tickets: [...], total }`, sometimes a bare array. You will need
  to unwrap it.
- `fetchTickets()` and `fetchTicketById()` randomly fail (~10-12%).
- `updateTicketStatus()` randomly fails (~10%) AND randomly returns
  conflict (~15%, when the version doesn't match).
- Every ticket carries a `version: number` that the server increments
  on every server-side mutation, including live events.

The type definitions live in `src/types/ticket.ts`. They are
intentionally loose because they describe what the backend
**actually** sends. You are encouraged to define your own narrower
internal types and normalize at the boundary.

---

## Critical rule

**Do not import from `src/data/generateTickets.ts` in your UI code,
and do not import from `src/api/_store.ts`. Use only the public
functions in `src/api/ticketApi.ts` and `src/api/ticketEvents.ts`.**

Bypassing the API defeats the point of the exercise. We will check.

---

## What to submit

1. Your source code (zipped, or as a link to a public repo).
2. A `SUBMISSION.md` (or appended section in this README) covering:

   - **Approach**: brief overview.
   - **Architecture**: component structure, state management, where
     server state vs UI state lives, where the API layer sits.
   - **Normalization**: how you handled the inconsistent API shape and
     the malformed data.
   - **Optimistic vs pessimistic updates**: which you chose and why.
   - **Conflict handling**: what happens when `updateTicketStatus`
     returns a conflict.
   - **Live events**: how you merge incoming events with local state,
     including any state the user is currently editing.
   - **Performance**: what you did for filter / sort / render
     performance at ~5,000 rows. What would change at 100,000?
   - **Persistence**: what you persisted, where, and why.
   - **AI usage**: which tools you used, what they helped with, what
     you modified or rejected, what you verified by hand.
   - **Tradeoffs**: what you intentionally did not build, and why.
   - **Future improvements**: what you would do with more time.

---

## Bonus (optional, in any order)

These are NOT required. We want to see what you prioritize.

1. URL-synced filters, search, and sort (back/forward should work).
2. Debounced or transition-deferred search.
3. Virtualized list rendering.
4. Column visibility / layout preference.
5. Retry button and / or automatic retry-with-backoff for failed fetches.
6. Toast notifications for successful / failed / conflicted updates.
7. Bulk status update for multiple selected tickets.
8. Visual indicator when a ticket changed underneath the user via a
   live event (a "this ticket changed, refresh?" affordance).
9. A filter that shows only malformed tickets, useful for QA.
10. Unit tests for the normalization layer and for filter / sort logic.
11. Accessibility (keyboard navigation, focus management, ARIA on
    dynamic regions).

---

## What we are looking for

Strong submissions tend to:

- Keep a clean boundary between the messy API layer and the rest of
  the app.
- Have small, composable components with a clear data flow.
- Make the optimistic vs pessimistic choice deliberately and handle
  the failure path.
- Not crash on a single bit of bad data.
- Stay responsive while typing in the search box.
- Reconcile live events without clobbering whatever the user is
  actively editing.
- Have a `SUBMISSION.md` that explains tradeoffs honestly, including
  what was AI-generated and what was not.

Good luck. Have fun.
