# Submission — Live Support Ticket Triage Console

**Author:** Soikat Chakrabarty

> 📄 [View original assignment guidelines →](./ASSIGNMENT.md)

---

## Approach

The core premise I worked from: the API is untrustworthy and the UI must stay honest about that. Every decision — the normalization boundary, the store shape, the conflict model, the live event merge strategy — flows from that single constraint.

I kept the architecture deliberately thin. No over-engineering for scale I don't have, no abstractions that don't earn their keep. The app is a virtualized list with a filter sidebar, a modal for detail/edit, and a live event stream running in the background. The interesting engineering is almost entirely in the seams: the API boundary, the conflict path, and the live event reconciliation.

---

## Architecture

### Component structure

```
App
├── useUrlSync()          — hydrates + syncs filters/search to URL
├── useTicketEvents()     — subscribes to live event stream for app lifetime
├── Layout                — shell (header, footer, live region for AT)
│   ├── Filters           — search, status, priority, assignee, sort, malformed toggle
│   ├── BulkUpdate        — bulk status change for selected tickets
│   └── Tickets           — virtualized list + modal
│       ├── TicketHeader  — sticky column headers
│       ├── TicketRow     — single virtualized row (react-window)
│       ├── Modal         — ticket detail + inline status editor
│       ├── Loader        — loading state with retry attempt counter
│       ├── Error         — error state with manual retry
│       └── NoData        — empty filtered result
```

### State management

Zustand with a single flat store (`ticketStore`). I chose Zustand over TanStack Query deliberately — the assignment's mock API has no caching contract, no stale-time semantics, and no background refetch story, so Query's cache model would have added complexity without benefit. Zustand gives me a plain object I can read and write anywhere.

The store is divided by responsibility even though it lives in one `create()` call:

| Slice           | What lives there                                      |
| --------------- | ----------------------------------------------------- |
| Server state    | `tickets: Record<string, Ticket>`, `loading`, `error` |
| UI state        | `search`, `filters`, `selectedTicketIds`              |
| Ephemeral state | `rowIndicators` (live / conflict / failed)            |
| AT state        | `liveAnnouncement` (screen reader live region)        |

`tickets` is keyed by id (`Record<string, Ticket>`) for O(1) lookups during live event merges and status updates, avoiding linear scans on every incoming event.

### Where the API layer sits

All API calls go through two files: `src/api/ticketApi.ts` and `src/api/ticketEvents.ts`. UI code never imports from `src/data/generateTickets.ts` or `src/api/_store.ts`. The public API surface is the only entry point.

Two service functions sit between the API and the store:

- `services/normalizeTicket.ts` — converts `RawTicket` → `Ticket`, absorbs all malformations
- `services/unwrapTicketsResponse.ts` — handles the three possible response shapes from `fetchTickets()`

Everything inside the app works with `Ticket`. Nothing inside the app knows about `RawTicket` except those two services.

---

## Normalization

`fetchTickets()` returns `unknown`. `unwrapTicketsResponse` handles three observed shapes:

```
unknown response
├── bare array                    → return as-is
├── { data: [...] }               → return data
└── { tickets: [...], total }     → return tickets
```

If none match, it returns `[]` rather than throwing — the empty state is handled gracefully downstream.

`normalizeTicket` handles every malformation category present in the generator:

| Malformation                                     | Handling                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `customer: null`                                 | `customerName = "Unknown customer"`, `malformed = true`                   |
| `customer: { name }` (plan missing)              | `customerPlan = "unknown"`, `malformed = true`                            |
| `customer: "bare string"`                        | Use string as name, `malformed = true`                                    |
| `createdAt: "invalid-date"`                      | Stored as-is, `malformed = true`, rendered as `--`                        |
| `createdAt: null`, `lastUpdatedAt: "not-a-date"` | Both stored as null/invalid, `malformed = true`                           |
| `title: ""`                                      | Falls back to `"Untitled ticket"`, `malformed = true`                     |
| `status: "escalated_v2"`                         | Falls back to `"unknown"`, `malformed = true`                             |
| `priority: "pending_triage"`                     | Falls back to `"unknown"`, `malformed = true`                             |
| Snake_case fields                                | Reads `created_at ?? createdAt`, `last_updated_at ?? lastUpdatedAt`, etc. |

The `malformed` boolean is stored on every `Ticket` and is used by:

- The "Show Malformed Tickets" toggle in filters
- The "Is Malformed" field in the ticket detail modal

Invalid dates sort to `-Infinity` — they consistently sink to the bottom in descending order (most recent first) and float to the top in ascending order. This is intentional: malformed tickets don't pollute the top of the triage list.

---

## Optimistic vs Pessimistic Updates

I chose **pessimistic updates** for status changes.

The reason is the conflict model. `updateTicketStatus` resolves (not rejects) on version conflicts, returning `{ ok: false, conflict: true, latest }`. If I applied optimistic updates, I'd need to roll back on conflict — which means showing the user a state that was never real, then yanking it away. Given that the conflict rate is ~15%, that rollback would be visible often enough to be jarring.

With pessimistic updates:

- The UI shows a saving spinner while the request is in flight
- On success: the server's returned ticket (with its new version) is written to the store
- On conflict: the latest server state is written to the store, a conflict row indicator appears, and a toast warns the agent
- On transport error: a failed row indicator appears, the toast shows the error, the ticket is unchanged

The tradeoff is latency feel — there's a visible wait before the UI updates. At ~10% random failure rate and ~15% conflict rate, I judged that correctness and trust matter more than snappiness for a support triage tool. Agents need to know their edits landed.

---

## Conflict Handling

When `updateTicketStatus` returns `{ ok: false, conflict: true, latest }`:

1. `latest` is normalized and written to the store — the agent immediately sees what the current state actually is
2. The row gets a `conflict` indicator (amber highlight + `OctagonAlert` icon)
3. A warning toast fires: _"Ticket changed by another agent"_
4. The modal closes

The agent can reopen the ticket, see the latest state, and decide whether to re-apply their intended change with the new version number.

**Known tradeoff:** closing the modal on conflict loses the agent's in-flight edit. A more polished flow would keep the modal open, show a diff of what changed, and offer "apply my change anyway" vs "accept server state". I chose not to build this within the time budget — it's the most meaningful missing piece in the UX.

For bulk updates, `Promise.allSettled` runs all status changes concurrently. Each result is handled independently: successes update the store, conflicts apply the latest, failures set the failed indicator. A summary toast shows the counts: _"12 updated • 2 conflicts • 1 failed"_.

---

## Live Events

`useTicketEvents` is mounted once at the app root (`App.tsx`), not inside the ticket list. This means the subscription is alive for the full page lifetime regardless of what the list is doing.

Three event types are handled:

**`ticket.updated` and `ticket.assigned`** go through `upsertLiveEvent` in the store:

```typescript
upsertLiveEvent: (ticketId, version, patch) => {
  const existing = state.tickets[ticketId];
  if (!existing) return state; // unknown ticket — ignore
  if (existing.version >= version) return state; // stale event — ignore
  return {
    tickets: {
      ...state.tickets,
      [ticketId]: { ...existing, ...patch, version },
    },
  };
};
```

The version guard is the critical piece. Events arrive out of order in practice (the mock fires them on random intervals). An event with a lower version than what we hold is silently dropped — we never apply stale data on top of fresher data.

**`ticket.created`** calls `updateTicket` directly, inserting the new ticket into the store map.

**Row indicators:** every handled event sets a `"live"` indicator on the row (green highlight + Zap icon). A `setTimeout` of 3000ms clears it. All timer IDs are tracked in a `Set` inside the effect and cancelled in the cleanup function — no orphaned timers on unmount.

**Reconciliation with in-flight user edits:** the modal's status select is local state initialized from `ticket.status`. If a live event updates the ticket while the modal is open, the store updates (new version, possibly new status), and the modal re-renders with the latest ticket prop. This resets the agent's in-flight edit via `useEffect([ticket])`. This is a known gap — see Tradeoffs.

---

## Performance

### At ~5,000 rows

- **Virtualization:** `react-window` with a fixed row height of 56px. Only the visible rows are in the DOM at any time. Scrolling through 5,000 rows is smooth.
- **Deferred search:** `useDeferredValue` on the search string. The input always updates immediately; the expensive filter pass is deferred to a lower-priority render. No debounce needed.
- **Memoized filter + sort:** `useMemo` with `[tickets, deferredSearch, filters, rowIndicators]` as dependencies. The full filter/sort pass only runs when one of those changes.
- **O(1) ticket lookups:** `Record<string, Ticket>` means live event merges and status updates never scan the array.
- **Store reads are selective:** every component subscribes to only the slice of the store it needs via selector functions. A live event updating one ticket does not re-render the filter sidebar.

### At ~100,000 rows

The current approach has two weak points at that scale:

1. `Object.values(tickets)` inside `useMemo` allocates a new array on every memo evaluation. At 100k that allocation cost becomes meaningful. The fix is to maintain a stable sorted+filtered array as a derived atom (Jotai) or a separate computed slice, and only recompute the diff when the relevant slice changes.

2. The assignee list in `Filters` derives from `Object.values(tickets).map(...)` on every render. At 100k this needs to be a memoized selector computed once and updated only when assignees change.

3. Filter + sort over 100k objects is a candidate for a Web Worker — move the computation off the main thread entirely and post the result back as a plain array.

4. `react-window`'s fixed-height list scales well — no change needed there. Dynamic heights would require `VariableSizeList` with a measurement cache.

---

## Persistence

**URL query params** via `useUrlSync`.

Every filter, search term, sort field, sort direction, and the malformed toggle are encoded in the URL. On mount the hook reads `window.location.search` and hydrates the store. `popstate` is also handled, so browser back/forward works correctly. Changes are pushed with `replaceState` (not `pushState`) so normal filtering doesn't pollute history.

This was the right choice over `localStorage` because:

- **Shareable:** an agent can copy the URL and send it to a colleague who sees the same filtered view
- **Bookmarkable:** "show me all urgent unassigned tickets" is a bookmark
- **Debuggable:** the current filter state is always visible in the address bar
- **No stale state problem:** closing the tab and reopening always restores intent, not a stale snapshot from a previous session

The one thing not persisted is the selected ticket (open modal). Persisting that would require the detail view to re-fetch on load, which adds a loading state for something that's unlikely to be the right UX on a fresh page load.

---

## AI Usage

I used ChatGPT throughout this assignment as a tool I directed, not a source of
decisions, and Claude as a code reviewer.

Every architectural choice in this codebase — Zustand over TanStack Query, pessimistic
updates, `replaceState` over `pushState`, `Promise.allSettled` for bulk updates, the
version guard in `upsertLiveEvent` — was made by me before or after seeing AI output,
not because AI suggested it. Where the output diverged from my intent, I discarded
it or used it as friction to sharpen my own reasoning.

Concretely, AI was useful for three things:

**Boilerplate I already knew the shape of.** Hook skeletons, the Zustand store
scaffolding, the `react-window` row props wiring. I knew what I wanted, I didn't want
to type it. I reviewed every line before it went in.

**Sounding board for edge cases.** I described the three `fetchTickets()` response
shapes and asked for the unwrap logic. I described the eight malformation kinds from
the generator and asked for a first-pass normalizer. In both cases the output was
a starting point — the malformation draft used optional chaining that silently swallowed
errors, which I rewrote to be explicit about each case and always set `malformed = true`
deliberately.

**Tailwind class combinations.** Fast to generate, easy to verify visually.

AI gave me the bandwidth to go well beyond the core requirements. Without it absorbing
the boilerplate, I would have spent the available time on scaffolding alone — the bonus
features, the accessibility layer, the URL sync, the bulk update, the malformed ticket
filter, the retry backoff — none of those would have made the cut. AI did not build
them; it cleared the path so I could. The architectural decisions, the conflict model,
the store design, and every tradeoff call in this codebase are entirely mine.

---

## Tradeoffs

**What I intentionally did not build, and why:**

**Modal stays open after conflict with a diff view.** The right UX is to keep the modal open, show what changed, and offer the agent a choice. I chose not to build this because it requires a meaningful amount of state threading (previous intent vs latest server state) and a diff UI component. The current behavior — apply latest, close, show toast — is safe and unambiguous even if it loses the agent's edit.

**Live event clobbers in-flight modal edit.** If a live event arrives while an agent has the modal open and has changed the status dropdown but not yet saved, the store update resets their local selection. Fixing this requires either not subscribing the modal to the live ticket, or storing the "dirty" local edit separately and merging explicitly. I chose not to fix this — the window is small (1.5–5 seconds between events, and only if the specific ticket is hit) and the fix adds meaningful complexity to the modal.

**No TanStack Query.** The async lifecycle (loading, error, retry, background refresh) is managed manually. This is more code than Query would require. The tradeoff is zero additional abstraction overhead and no mismatch between Query's cache model and the mock API's mutation semantics.

**No unit tests.** The normalization service (`normalizeTicket`) and the filter/sort logic in `useTickets` are both pure functions and highly testable. Given the time budget I prioritized correctness of the running app over test coverage. If I had another hour, the normalization tests would be first.

**Column visibility toggle.** Skipped. The column definitions are in `types/columns.ts` and already data-driven, so adding a visibility toggle would be a UI addition on top of an already-clean foundation. It didn't make the cut within the time budget.

**No keyboard navigation on the virtualized list rows themselves.** `Tab` will reach each row's checkbox and view button, which covers the core interactions. A full roving tabindex grid pattern (arrow keys to navigate between rows) would require meaningful changes to the `react-window` integration and was out of scope.

---

## Future Improvements

Given more time, in priority order:

1. **Modal conflict UX** — keep modal open after conflict, show a before/after diff, let the agent choose to re-apply or accept the server state
2. **Protect in-flight modal edit from live events** — track a "dirty" flag on the modal's local state; suppress live event resets when the agent has unsaved changes
3. **Unit tests for normalization and filter logic** — both are pure functions, both have well-defined edge cases, both are straightforward to test with Vitest
4. **Web Worker for filter/sort at scale** — move the `useMemo` computation off the main thread for 100k+ row datasets
5. **Memoized assignee selector** — extract the assignee list derivation from the Filters render cycle into a stable Zustand selector
6. **Full roving tabindex on the ticket list** — arrow key navigation between rows, proper grid ARIA pattern
7. **Retry on live event subscription loss** — the current event stream has no reconnect logic; a real SSE or WebSocket connection would need exponential backoff reconnection
8. **Persist selected ticket in URL** — `?ticket=TCK-01234` would open the modal directly on load, useful for sharing a specific ticket with a colleague
