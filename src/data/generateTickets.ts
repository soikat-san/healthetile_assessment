import type { RawTicket } from "../types/ticket";

/**
 * Deterministic ticket dataset generator.
 *
 * The dataset is generated ONCE per page load from a fixed seed, so
 * the data you see is stable across reloads. The mock API in
 * src/api/ticketApi.ts mutates this dataset in-memory.
 *
 * Default size is read from VITE_TICKET_COUNT, falling back to 5000.
 * A nontrivial fraction (~3%) of tickets are deliberately malformed
 * in various ways. The application is expected to keep working.
 */

const DEFAULT_COUNT = Number(import.meta.env.VITE_TICKET_COUNT ?? 5000);
const SEED = 0xC0FFEE;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function chance(p: number): boolean {
  return rng() < p;
}

function intBetween(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const FIRST_NAMES = [
  "Ava", "Liam", "Sophia", "Noah", "Olivia", "Ethan", "Mia", "Lucas",
  "Isabella", "Mason", "Charlotte", "Logan", "Amelia", "Jackson",
  "Harper", "Aiden", "Evelyn", "Elijah", "Abigail", "Sebastian",
  "Emily", "Oliver", "Elizabeth", "Daniel", "Sofia", "Matthew", "Avery",
  "Henry", "Ella", "Joseph", "Madison", "Samuel", "Scarlett", "David",
  "Aria", "Carter", "Grace", "Wyatt", "Chloe", "Jayden", "Camila",
  "Dylan", "Penelope", "Grayson", "Riley", "Levi", "Layla", "Isaac",
  "Lillian", "Gabriel",
];

const LAST_NAMES = [
  "Patel", "Chen", "Martinez", "Wilson", "Brown", "Davis", "Johnson",
  "Williams", "Miller", "Garcia", "Rodriguez", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres",
  "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker",
  "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
];

const ASSIGNEES = [
  "Jordan", "Maya", "Alex", "Priya", "Sam", "Riya", "Diego", "Nora",
  "Kai", "Theo", null,
];

const STATUSES = [
  "new", "in_progress", "waiting_on_customer", "resolved",
] as const;

const PRIORITIES = [
  "low", "medium", "high", "urgent",
] as const;

const PLANS = ["free", "pro", "enterprise"] as const;

const TAG_POOL = [
  "billing", "payments", "auth", "sso", "performance", "dashboard",
  "mobile", "checkout", "account", "frontend", "backend", "api",
  "email", "notifications", "search", "export", "import", "onboarding",
  "enterprise", "integrations", "webhooks", "security", "compliance",
];

const TITLE_TEMPLATES = [
  "Payment failed but card was charged",
  "Unable to reset password",
  "Dashboard is loading slowly",
  "Mobile app crashes during checkout",
  "Enterprise SSO login intermittently fails",
  "Invoice download button does nothing",
  "Account shows wrong subscription plan",
  "Cannot invite teammates over the email limit",
  "Webhook events not delivered for last 24h",
  "Export to CSV returns empty file",
  "2FA codes never arrive",
  "Search results are stale after creating record",
  "Profile photo upload fails for files over 2MB",
  "Notifications setting reverts after save",
  "Date filter excludes records on the boundary",
  "API rate limit triggered with normal usage",
  "Subscription upgrade did not apply seat count",
  "Audit log missing entries from yesterday",
  "Dark mode toggle does not persist",
  "Onboarding wizard skips required step",
  "Email digest sent in wrong timezone",
  "Filtering by tag returns no results",
  "Importing CSV with quoted commas breaks layout",
  "Cannot delete an archived project",
  "Bulk edit applies to wrong rows after sort",
  "Session expires after 5 minutes instead of 24h",
  "Saved view does not load default columns",
  "API key rotation invalidates active integration",
  "Refund flow stuck on processing screen",
  "Sidebar collapses on every navigation",
];

const DAY_MS = 24 * 60 * 60 * 1000;

function randomCustomerName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randomIsoWithinDays(daysAgo: number): string {
  const offset = Math.floor(rng() * daysAgo * DAY_MS);
  return new Date(Date.now() - offset).toISOString();
}

function randomTags(): string[] {
  const count = intBetween(0, 3);
  const tags = new Set<string>();
  for (let i = 0; i < count; i++) {
    tags.add(pick(TAG_POOL));
  }
  return Array.from(tags);
}

function buildTitle(i: number): string {
  return `${pick(TITLE_TEMPLATES)} (#${i + 1})`;
}

/**
 * Build a well-formed ticket. Most tickets look like this.
 */
function wellFormedTicket(i: number): RawTicket {
  const created = randomIsoWithinDays(90);
  const updated = new Date(
    new Date(created).getTime() + Math.floor(rng() * 5 * DAY_MS)
  ).toISOString();

  return {
    id: `TCK-${String(1000 + i).padStart(5, "0")}`,
    version: 1,
    title: buildTitle(i),
    customer: {
      name: randomCustomerName(),
      plan: pick(PLANS),
    },
    status: pick(STATUSES),
    priority: pick(PRIORITIES),
    createdAt: created,
    lastUpdatedAt: updated,
    tags: randomTags(),
    messagesCount: intBetween(0, 25),
    assignedTo: pick(ASSIGNEES),
  };
}

/**
 * Apply a malformation in-place. Picks one of several kinds at random.
 * Some malformations stack on top of an already-malformed ticket.
 */
function malform(ticket: RawTicket): RawTicket {
  const kind = Math.floor(rng() * 8);

  switch (kind) {
    case 0: {
      ticket.customer = null;
      return ticket;
    }
    case 1: {
      // Customer present but plan missing.
      ticket.customer = { name: randomCustomerName() };
      return ticket;
    }
    case 2: {
      // Customer is a bare string instead of an object.
      ticket.customer = randomCustomerName();
      return ticket;
    }
    case 3: {
      // Invalid createdAt.
      ticket.createdAt = "invalid-date";
      return ticket;
    }
    case 4: {
      // Invalid lastUpdatedAt and createdAt missing.
      ticket.createdAt = null;
      ticket.lastUpdatedAt = "not-a-date";
      return ticket;
    }
    case 5: {
      // Title is empty.
      ticket.title = "";
      return ticket;
    }
    case 6: {
      // Unknown status the backend invented.
      ticket.status = pick(["pending_triage", "snoozed", "escalated_v2"]);
      return ticket;
    }
    case 7:
    default: {
      // Snake_case payload: drop camelCase, add snake_case equivalents.
      const created = ticket.createdAt;
      const updated = ticket.lastUpdatedAt;
      const assigned = ticket.assignedTo;
      const messages = ticket.messagesCount;
      delete ticket.createdAt;
      delete ticket.lastUpdatedAt;
      delete ticket.assignedTo;
      delete ticket.messagesCount;
      ticket.created_at = created;
      ticket.last_updated_at = updated;
      ticket.assigned_to = assigned;
      ticket.messages_count = messages;
      return ticket;
    }
  }
}

/**
 * Generate the full dataset. Run once on module load.
 */
function generateDataset(count: number): RawTicket[] {
  const out: RawTicket[] = [];
  for (let i = 0; i < count; i++) {
    const t = wellFormedTicket(i);
    if (chance(0.03)) {
      malform(t);
    }
    out.push(t);
  }
  return out;
}

/**
 * The seeded dataset. Imported by src/api/ticketApi.ts.
 *
 * IMPORTANT FOR CANDIDATES: Do not import this from UI components.
 * Use the API functions in src/api/ticketApi.ts instead.
 */
export const seededTickets: RawTicket[] = generateDataset(DEFAULT_COUNT);
