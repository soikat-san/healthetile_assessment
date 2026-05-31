import { create } from "zustand";
import { Ticket } from "../types/ticket";
import { TicketFilters } from "../types/filters";

interface TicketStore {
  tickets: Record<string, Ticket>;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  filters: TicketFilters;
  setFilters: (filters: TicketFilters) => void;
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateTicket: (ticket: Ticket) => void;
  selectedTicketIds: Set<string>;
  toggleTicketSelection: (ticketId: string) => void;
  clearSelectedTickets: () => void;
  rowIndicators: Record<string, "conflict" | "failed" | "live">;
  setRowIndicator: (
    ticketId: string,
    indicator: "conflict" | "failed" | "live",
  ) => void;
  clearRowIndicator: (ticketId: string) => void;
  clearTicketIndicators: () => void;
  upsertLiveEvent: (
    ticketId: string,
    version: number,
    patch: Partial<Ticket>,
  ) => void;
}

export const useTicketStore = create<TicketStore>((set) => ({
  tickets: {},
  loading: false,
  error: null,
  selectedTicketIds: new Set(),
  rowIndicators: {},

  search: "",
  setSearch: (search) => set({ search }),

  filters: {
    status: null,
    priority: null,
    assignee: null,
    malformedOnly: false,
    sortBy: "updatedAt",
    sortDirection: "desc",
  },
  setFilters: (filters) => set({ filters }),

  setTickets: (tickets) => {
    const mapped = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.id] = ticket;
        return acc;
      },
      {} as Record<string, Ticket>,
    );

    set({
      tickets: mapped,
    });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  updateTicket: (ticket) =>
    set((state) => ({
      tickets: {
        ...state.tickets,
        [ticket.id]: ticket,
      },
    })),

  toggleTicketSelection: (ticketId) =>
    set((state) => {
      const next = new Set(state.selectedTicketIds);

      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }

      return {
        selectedTicketIds: next,
      };
    }),

  clearSelectedTickets: () =>
    set({
      selectedTicketIds: new Set(),
    }),

  setRowIndicator: (ticketId, indicator) =>
    set((state) => ({
      rowIndicators: {
        ...state.rowIndicators,
        [ticketId]: indicator,
      },
    })),

  clearRowIndicator: (ticketId) =>
    set((state) => {
      const next = { ...state.rowIndicators };

      delete next[ticketId];

      return {
        rowIndicators: next,
      };
    }),

  clearTicketIndicators: () =>
    set({
      rowIndicators: {},
    }),

  upsertLiveEvent: (ticketId, version, patch) =>
    set((state) => {
      const existing = state.tickets[ticketId];

      if (!existing) {
        return state;
      }

      if (existing.version >= version) {
        return state;
      }

      return {
        tickets: {
          ...state.tickets,
          [ticketId]: {
            ...existing,
            ...patch,
            version,
          },
        },
      };
    }),
}));
