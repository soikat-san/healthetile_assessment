import type {
  RawTicket,
  TicketStatus,
  UpdateTicketStatusResult,
} from "../types/ticket";
import { getTicket, listTickets, patchTicket, resetStore } from "./_store";

/**
 * Mock backend for the support ticket triage console.
 *
 * Treat these functions as if they were calling a real HTTP service:
 *   - they are asynchronous
 *   - they are sometimes slow
 *   - they sometimes fail
 *   - they sometimes return data in inconsistent shapes
 *   - updateTicketStatus uses optimistic concurrency via `version`
 *
 * Do NOT bypass this module by reading from src/data/generateTickets.ts
 * directly in your UI. Everything the UI knows about tickets should
 * flow through this file (or through src/api/ticketEvents.ts).
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldFail(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * Wraps a ticket in one of three response shapes, chosen at random.
 * This simulates a backend whose contract is inconsistent.
 *
 * Shapes observed in the wild:
 *   1. { data: Ticket[] }
 *   2. { tickets: Ticket[], total: number }
 *   3. Ticket[]
 */
function wrapListResponse(items: RawTicket[]): unknown {
  const shape = Math.random();
  if (shape < 0.34) {
    return { data: items };
  }
  if (shape < 0.67) {
    return { tickets: items, total: items.length };
  }
  return items;
}

/**
 * Fetch all tickets.
 *
 * Returns `unknown` because the response shape varies. The caller is
 * responsible for unwrapping it into a Ticket[].
 *
 * Throws on transport failure (~12% of calls).
 */

export async function fetchTickets(signal?: AbortSignal): Promise<unknown> {
  await delay(randomBetween(300, 1500));
  throwIfAborted(signal);

  if (shouldFail(0.12)) {
    throw new Error("Failed to fetch tickets. Please try again.");
  }

  const snapshot = listTickets().map((t) => ({ ...t }));
  return wrapListResponse(snapshot);
}

/**
 * Fetch a single ticket by id.
 *
 * Always returns a `RawTicket` object directly (no wrapper) on success.
 *
 * Throws on transport failure (~10%) and when no ticket with that id
 * exists.
 */
export async function fetchTicketById(
  ticketId: string,
  signal?: AbortSignal,
): Promise<RawTicket> {
  await delay(randomBetween(200, 900));
  throwIfAborted(signal);

  if (shouldFail(0.1)) {
    throw new Error("Failed to fetch ticket details.");
  }

  const ticket = getTicket(ticketId);
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} not found.`);
  }

  return { ...ticket };
}

/**
 * Update the status of a ticket using optimistic concurrency.
 *
 * `expectedVersion` is the `version` of the ticket as the client last
 * saw it. If it matches the server's current version, the write
 * applies and the new ticket (with version + 1) is returned.
 *
 * If `expectedVersion` does NOT match, the response resolves (not
 * rejects) with { ok: false, conflict: true, latest } so the caller
 * can choose how to merge.
 *
 * Throws on transport failure (~10%) and when no ticket exists.
 */
export async function updateTicketStatus(
  ticketId: string,
  nextStatus: TicketStatus,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<UpdateTicketStatusResult> {
  await delay(randomBetween(200, 1200));
  throwIfAborted(signal);

  if (shouldFail(0.1)) {
    throw new Error("Failed to update ticket status.");
  }

  const current = getTicket(ticketId);
  if (!current) {
    throw new Error(`Ticket ${ticketId} not found.`);
  }

  if (current.version !== expectedVersion) {
    return {
      ok: false,
      conflict: true,
      latest: { ...current },
    };
  }

  const updated = patchTicket(ticketId, {
    status: nextStatus,
    lastUpdatedAt: new Date().toISOString(),
  });
  if (!updated) {
    throw new Error(`Ticket ${ticketId} disappeared during update.`);
  }

  return { ok: true, ticket: { ...updated } };
}

/**
 * Reset the in-memory dataset back to the seeded state.
 *
 * Useful during development. Not part of the assignment requirements.
 */
export async function resetTickets(): Promise<void> {
  await delay(200);
  resetStore();
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    const err = new Error("Request aborted");
    err.name = "AbortError";
    throw err;
  }
}
