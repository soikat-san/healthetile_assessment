import { RawTicket } from "../types/ticket";
import { Ticket } from "../types/ticket";

const VALID_STATUS = new Set([
  "new",
  "in_progress",
  "waiting_on_customer",
  "resolved",
]);

const VALID_PRIORITY = new Set(["low", "medium", "high", "urgent"]);

function isValidDate(value?: string | null): boolean {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function normalizeTicket(raw: RawTicket): Ticket {
  let malformed = false;
  const title = raw.title?.trim() || "Untitled ticket";

  if (!raw.title?.trim()) {
    malformed = true;
  }

  let customerName = "Unknown customer";
  let customerPlan = "unknown";

  if (typeof raw.customer === "string") {
    customerName = raw.customer;
    malformed = true;
  } else if (raw.customer) {
    customerName = raw.customer.name ?? "Unknown customer";
    customerPlan = raw.customer.plan ?? "unknown";

    if (!raw.customer.plan) {
      malformed = true;
    }
  } else {
    malformed = true;
  }

  const createdAt = raw.createdAt ?? raw.created_at ?? null;
  const updatedAt = raw.lastUpdatedAt ?? raw.last_updated_at ?? null;

  if (!isValidDate(createdAt)) {
    malformed = true;
  }

  if (!isValidDate(updatedAt)) {
    malformed = true;
  }

  const status = VALID_STATUS.has(raw.status ?? "") ? raw.status : "unknown";

  if (status === "unknown") {
    malformed = true;
  }

  const priority = VALID_PRIORITY.has(raw.priority ?? "")
    ? raw.priority
    : "unknown";

  if (priority === "unknown") {
    malformed = true;
  }

  return {
    id: raw.id,
    version: raw.version,
    title,
    customerName,
    customerPlan,
    status,
    priority,
    createdAt,
    updatedAt,
    tags: raw.tags ?? [],
    messagesCount: raw.messagesCount ?? raw.messages_count ?? 0,
    assignedTo: raw.assignedTo ?? raw.assigned_to ?? null,
    malformed,
  };
}
