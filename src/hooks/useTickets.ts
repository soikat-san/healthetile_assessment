import {
  useDeferredValue,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";

import { fetchTickets } from "../api/ticketApi";
import { useTicketStore } from "../store/ticketStore";
import { normalizeTicket } from "../services/normalizeTicket";
import { unwrapTicketsResponse } from "../services/unwrapTicketsResponse";

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export function useTickets() {
  const {
    tickets,
    loading,
    error,
    search,
    filters,
    rowIndicators,
    setTickets,
    setLoading,
    setError,
  } = useTicketStore();

  const deferredSearch = useDeferredValue(search);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryAttempt(0);

    let delay = BASE_DELAY;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetchTickets();
        const rawTickets = unwrapTicketsResponse(response);
        const normalized = rawTickets.map(normalizeTicket);

        setTickets(normalized);
        setLoading(false);
        setRetryAttempt(0);

        return;
      } catch (error) {
        setRetryAttempt(attempt);

        if (attempt === MAX_RETRIES) {
          setError(
            error instanceof Error ? error.message : "Something went wrong",
          );

          setLoading(false);

          return;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));

        delay *= 2;
      }
    }
  }, [setTickets, setLoading, setError]);

  useEffect(() => {
    loadTickets();
  }, []);

  const visibleTickets = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    let filtered = Object.values(tickets);

    // Search
    if (query) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.id.toLowerCase().includes(query) ||
          ticket.title.toLowerCase().includes(query) ||
          ticket.customerName.toLowerCase().includes(query),
      );
    }

    // Status
    if (filters.status) {
      filtered = filtered.filter((ticket) => ticket.status === filters.status);
    }

    // Priority
    if (filters.priority) {
      filtered = filtered.filter(
        (ticket) => ticket.priority === filters.priority,
      );
    }

    // Assignee
    if (filters.assignee) {
      filtered = filtered.filter(
        (ticket) => ticket.assignedTo === filters.assignee,
      );
    }

    // Malformed only
    if (filters.malformedOnly) {
      filtered = filtered.filter((ticket) => ticket.malformed);
    }

    filtered.sort((a, b) => {
      /**
       * Live tickets always float to top
       * while indicator exists.
       */
      const aLive = rowIndicators[a.id] === "live";

      const bLive = rowIndicators[b.id] === "live";

      if (aLive && !bLive) {
        return -1;
      }

      if (!aLive && bLive) {
        return 1;
      }

      const direction = filters.sortDirection === "asc" ? 1 : -1;

      // Priority sorting
      if (filters.sortBy === "priority") {
        const priorityRank = {
          unknown: 0,
          low: 1,
          medium: 2,
          high: 3,
          urgent: 4,
        };

        return (
          (priorityRank[a.priority] - priorityRank[b.priority]) * direction
        );
      }

      // Date sorting
      const getDateValue = (value: string | null) => {
        if (!value) return -Infinity;

        const time = new Date(value).getTime();

        return Number.isNaN(time) ? -Infinity : time;
      };

      const aDate =
        filters.sortBy === "createdAt"
          ? getDateValue(a.createdAt)
          : getDateValue(a.updatedAt);

      const bDate =
        filters.sortBy === "createdAt"
          ? getDateValue(b.createdAt)
          : getDateValue(b.updatedAt);

      return (aDate - bDate) * direction;
    });

    return filtered;
  }, [tickets, deferredSearch, filters, rowIndicators]);

  return {
    tickets: visibleTickets,
    loading,
    error,
    retryAttempt,
    isExhausted: retryAttempt === MAX_RETRIES,
    retry: loadTickets,
  };
}
