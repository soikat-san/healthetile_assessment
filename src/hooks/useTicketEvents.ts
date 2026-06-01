import { useEffect } from "react";
import { useTicketStore } from "../store/ticketStore";
import { subscribeToTicketEvents } from "../api/ticketEvents";
import { normalizeTicket } from "../services/normalizeTicket";
import type { TicketStatus, TicketPriority } from "../types/ticket";

export function useTicketEvents() {
  const updateTicket = useTicketStore((state) => state.updateTicket);
  const upsertLiveEvent = useTicketStore((state) => state.upsertLiveEvent);
  const setRowIndicator = useTicketStore((state) => state.setRowIndicator);
  const clearRowIndicator = useTicketStore((state) => state.clearRowIndicator);
  const setLiveAnnouncement = useTicketStore(
    (state) => state.setLiveAnnouncement,
  );

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const scheduleIndicatorClear = (ticketId: string) => {
      const id = setTimeout(() => {
        timers.delete(id);

        clearRowIndicator(ticketId);
      }, 3000);

      timers.add(id);
    };

    const unsubscribe = subscribeToTicketEvents((event) => {
      switch (event.type) {
        case "ticket.created": {
          const normalized = normalizeTicket(event.ticket);
          updateTicket(normalized);
          setRowIndicator(normalized.id, "live");
          scheduleIndicatorClear(normalized.id);
          setLiveAnnouncement(`New ticket ${normalized.id} arrived`);
          break;
        }

        case "ticket.updated": {
          const patch = event.patch;

          const VALID_STATUS = new Set([
            "new",
            "in_progress",
            "waiting_on_customer",
            "resolved",
          ]);
          const VALID_PRIORITY = new Set(["low", "medium", "high", "urgent"]);

          upsertLiveEvent(event.ticketId, event.version, {
            ...(patch.status != null && VALID_STATUS.has(patch.status)
              ? { status: patch.status as TicketStatus }
              : {}),
            ...(patch.priority != null && VALID_PRIORITY.has(patch.priority)
              ? { priority: patch.priority as TicketPriority }
              : {}),
            ...(patch.messagesCount != null
              ? { messagesCount: patch.messagesCount }
              : {}),
            updatedAt: patch.lastUpdatedAt ?? null,
          });
          setRowIndicator(event.ticketId, "live");
          scheduleIndicatorClear(event.ticketId);
          break;
        }

        case "ticket.assigned": {
          upsertLiveEvent(event.ticketId, event.version, {
            assignedTo: event.assignedTo,
          });

          setRowIndicator(event.ticketId, "live");
          scheduleIndicatorClear(event.ticketId);
          setLiveAnnouncement(`Ticket ${event.ticketId} was reassigned`);
          break;
        }
      }
    });

    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);
}
