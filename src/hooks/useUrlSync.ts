import { useEffect, useState } from "react";
import { useTicketStore } from "../store/ticketStore";

export function useUrlSync() {
  const [hydrated, setHydrated] = useState(false);
  const search = useTicketStore((state) => state.search);
  const filters = useTicketStore((state) => state.filters);
  const setSearch = useTicketStore((state) => state.setSearch);
  const setFilters = useTicketStore((state) => state.setFilters);

  /**
   * Hydrate store from URL on mount
   * and whenever browser back/forward is used.
   */
  useEffect(() => {
    const hydrate = () => {
      const params = new URLSearchParams(window.location.search);

      setSearch(params.get("search") ?? "");

      setFilters({
        status: params.get("status") ?? null,
        priority: params.get("priority") ?? null,
        assignee: params.get("assignee") ?? null,
        malformedOnly: params.get("malformed") === "true",
        sortBy: (params.get("sortBy") as typeof filters.sortBy) ?? "updatedAt",
        sortDirection:
          (params.get("sortDirection") as typeof filters.sortDirection) ??
          "desc",
      });

      setHydrated(true);
    };

    hydrate();

    window.addEventListener("popstate", hydrate);

    return () => {
      window.removeEventListener("popstate", hydrate);
    };
  }, [setFilters, setSearch]);

  /**
   * Sync search + filters to URL.
   */
  useEffect(() => {
    if (!hydrated) return;

    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.priority) {
      params.set("priority", filters.priority);
    }

    if (filters.assignee) {
      params.set("assignee", filters.assignee);
    }

    if (filters.malformedOnly) {
      params.set("malformed", "true");
    }

    params.set("sortBy", filters.sortBy);
    params.set("sortDirection", filters.sortDirection);

    const nextUrl = `${window.location.pathname}?${params.toString()}`;

    window.history.replaceState({}, "", nextUrl);
  }, [
    hydrated,
    search,
    filters.status,
    filters.priority,
    filters.assignee,
    filters.malformedOnly,
    filters.sortBy,
    filters.sortDirection,
  ]);
}
