export type SortField = "createdAt" | "updatedAt" | "priority";

export type SortDirection = "asc" | "desc";

export type TicketFilters = {
  status: string | null;
  priority: string | null;
  assignee: string | null;
  malformedOnly: boolean;
  sortBy: SortField;
  sortDirection: SortDirection;
};
