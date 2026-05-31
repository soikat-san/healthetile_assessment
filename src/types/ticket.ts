/**
 * Loose types reflecting what the API ACTUALLY returns, warts and all.
 *
 * These are intentionally permissive. The backend (the mock API in this
 * project) is owned by another team and we cannot fix it on their side.
 *
 * You are encouraged to define your OWN narrower / normalized internal
 * types in your application code, and to convert between the two at a
 * single seam. We will look at whether you do this and where.
 */

export type TicketStatus =
  | "new"
  | "in_progress"
  | "waiting_on_customer"
  | "resolved"
  | "unknown";

export type TicketPriority = "low" | "medium" | "high" | "urgent" | "unknown";

export type CustomerPlan = "free" | "pro" | "enterprise";

/**
 * Shape of a customer as it MAY appear on a ticket.
 *
 * In practice the API has been observed to return:
 *   - a full object: { name, plan }
 *   - a partial object: { name } (plan missing)
 *   - a bare string (just the name)
 *   - null
 *   - the field may be missing entirely
 */
export type RawCustomer =
  | {
      name?: string | null;
      plan?: CustomerPlan | string | null;
    }
  | string
  | null;

/**
 * Shape of a ticket as it MAY appear in API responses.
 *
 * Most fields are loose because:
 *   - the backend sometimes returns snake_case (last_updated_at) and
 *     sometimes camelCase (lastUpdatedAt) for the same field
 *   - date fields may be ISO strings, may be the literal string
 *     "invalid-date", or may be null
 *   - status may be one of the known TicketStatus values OR an unknown
 *     string the backend invented
 *   - messagesCount may be a number, null, or missing
 *   - assignedTo may be a name string or null
 *
 * `version` is a server-assigned integer that increments on every
 * server-side mutation. It is REQUIRED when calling
 * updateTicketStatus(); see ticketApi.ts.
 */
export interface RawTicket {
  id: string;
  version: number;

  title?: string | null;

  customer?: RawCustomer;

  status?: TicketStatus | string | null;
  priority?: TicketPriority | string | null;

  createdAt?: string | null;
  lastUpdatedAt?: string | null;
  created_at?: string | null;
  last_updated_at?: string | null;

  tags?: string[] | null;

  messagesCount?: number | null;
  messages_count?: number | null;

  assignedTo?: string | null;
  assigned_to?: string | null;
}

/**
 * Events pushed by subscribeToTicketEvents().
 *
 * Each event includes the latest `version` for the affected ticket. If
 * your local copy of the ticket has a strictly lower version, the
 * event's payload is newer than yours.
 */
export type TicketEvent =
  | {
      type: "ticket.updated";
      ticketId: string;
      version: number;
      patch: Partial<RawTicket>;
    }
  | {
      type: "ticket.created";
      ticket: RawTicket;
    }
  | {
      type: "ticket.assigned";
      ticketId: string;
      version: number;
      assignedTo: string | null;
    };

/**
 * Response shape from updateTicketStatus().
 *
 * The API does NOT throw on a version conflict. It returns
 * { ok: false, conflict: true, latest } so the caller can decide how
 * to merge. It DOES throw on network/transport failures.
 */
export type UpdateTicketStatusResult =
  | { ok: true; ticket: RawTicket }
  | { ok: false; conflict: true; latest: RawTicket };

export interface Ticket {
  id: string;
  version: number;
  title: string;
  customerName: string;
  customerPlan: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string | null;
  updatedAt: string | null;
  tags: string[];
  messagesCount: number;
  assignedTo: string | null;
  malformed: boolean;
}
