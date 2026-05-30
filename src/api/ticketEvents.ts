import type { RawTicket, TicketEvent } from "../types/ticket";
import {
  appendTicket,
  listTickets,
  patchTicket,
} from "./_store";

/**
 * Simulated live event stream from the support backend.
 *
 * In production this would be a WebSocket or SSE connection that
 * pushes updates whenever ANOTHER agent (or an automated system)
 * touches a ticket. Your local copy of the data may go out of date
 * at any moment, and this stream is how you find out.
 *
 * Usage:
 *   const unsubscribe = subscribeToTicketEvents((event) => { ... });
 *   ...later...
 *   unsubscribe();
 *
 * The stream is shared across all subscribers. The underlying
 * "connection" starts on the first subscription and stops when the
 * last subscriber unsubscribes.
 */

type Listener = (event: TicketEvent) => void;

const listeners = new Set<Listener>();
let intervalHandle: ReturnType<typeof setTimeout> | null = null;
let createdCounter = 0;

const MIN_INTERVAL_MS = 1500;
const MAX_INTERVAL_MS = 5000;

const RANDOM_STATUSES = [
  "new", "in_progress", "waiting_on_customer", "resolved",
] as const;

const RANDOM_PRIORITIES = [
  "low", "medium", "high", "urgent",
] as const;

const RANDOM_ASSIGNEES = [
  "Jordan", "Maya", "Alex", "Priya", "Sam", "Riya", "Diego", "Nora", null,
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scheduleNext(): void {
  const delay =
    MIN_INTERVAL_MS +
    Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1));
  intervalHandle = setTimeout(tick, delay);
}

function tick(): void {
  if (listeners.size === 0) {
    intervalHandle = null;
    return;
  }

  const event = generateEvent();
  if (event) {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {
        // Listeners are not allowed to break the bus.
      }
    }
  }

  scheduleNext();
}

function generateEvent(): TicketEvent | null {
  const all = listTickets();
  if (all.length === 0) return null;

  const roll = Math.random();

  // 70% ticket.updated, 20% ticket.assigned, 10% ticket.created.
  if (roll < 0.7) {
    return generateUpdated(all);
  }
  if (roll < 0.9) {
    return generateAssigned(all);
  }
  return generateCreated();
}

function generateUpdated(all: readonly RawTicket[]): TicketEvent | null {
  const current = all[Math.floor(Math.random() * all.length)];
  const patch: Partial<RawTicket> = {};

  if (Math.random() < 0.6) {
    patch.status = pick(RANDOM_STATUSES);
  }
  if (Math.random() < 0.4) {
    patch.priority = pick(RANDOM_PRIORITIES);
  }
  if (Math.random() < 0.3) {
    patch.messagesCount = (current.messagesCount ?? 0) + 1;
  }

  if (Object.keys(patch).length === 0) {
    patch.status = pick(RANDOM_STATUSES);
  }

  patch.lastUpdatedAt = new Date().toISOString();

  const next = patchTicket(current.id, patch);
  if (!next) return null;

  return {
    type: "ticket.updated",
    ticketId: next.id,
    version: next.version,
    patch: {
      ...patch,
      version: next.version,
    },
  };
}

function generateAssigned(all: readonly RawTicket[]): TicketEvent | null {
  const current = all[Math.floor(Math.random() * all.length)];
  const assignedTo = pick(RANDOM_ASSIGNEES);

  const next = patchTicket(current.id, {
    assignedTo,
    lastUpdatedAt: new Date().toISOString(),
  });
  if (!next) return null;

  return {
    type: "ticket.assigned",
    ticketId: next.id,
    version: next.version,
    assignedTo,
  };
}

function generateCreated(): TicketEvent {
  createdCounter += 1;
  const now = new Date().toISOString();
  const id = `TCK-NEW-${String(createdCounter).padStart(4, "0")}`;

  const ticket: RawTicket = {
    id,
    version: 1,
    title: `New incoming ticket #${createdCounter}`,
    customer: {
      name: "Live Customer",
      plan: pick(["free", "pro", "enterprise"]),
    },
    status: "new",
    priority: pick(RANDOM_PRIORITIES),
    createdAt: now,
    lastUpdatedAt: now,
    tags: ["live"],
    messagesCount: 1,
    assignedTo: null,
  };

  appendTicket(ticket);

  return {
    type: "ticket.created",
    ticket: { ...ticket },
  };
}

export function subscribeToTicketEvents(listener: Listener): () => void {
  listeners.add(listener);

  if (intervalHandle === null) {
    scheduleNext();
  }

  return function unsubscribe() {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalHandle !== null) {
      clearTimeout(intervalHandle);
      intervalHandle = null;
    }
  };
}
