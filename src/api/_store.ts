/**
 * INTERNAL: mock data store backing the API.
 *
 * This module is shared between src/api/ticketApi.ts and
 * src/api/ticketEvents.ts so that live events can mutate the same
 * data the API reads from.
 *
 * Do NOT import this module from UI code. It is not part of the
 * "API contract" the assignment is built around.
 */

import { seededTickets } from "../data/generateTickets";
import type { RawTicket } from "../types/ticket";

let tickets: RawTicket[] = seededTickets.map((t) => ({ ...t }));

export function listTickets(): RawTicket[] {
  return tickets;
}

export function getTicket(id: string): RawTicket | undefined {
  return tickets.find((t) => t.id === id);
}

export function replaceTicket(id: string, next: RawTicket): void {
  tickets = tickets.map((t) => (t.id === id ? next : t));
}

export function patchTicket(id: string, patch: Partial<RawTicket>): RawTicket | undefined {
  const current = getTicket(id);
  if (!current) return undefined;
  const next: RawTicket = {
    ...current,
    ...patch,
    version: current.version + 1,
  };
  replaceTicket(id, next);
  return next;
}

export function appendTicket(ticket: RawTicket): void {
  tickets = [...tickets, ticket];
}

export function resetStore(): void {
  tickets = seededTickets.map((t) => ({ ...t }));
}
