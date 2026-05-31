import { useEffect } from "react";

import { subscribeToTicketEvents } from "../api/ticketEvents";
import { normalizeTicket } from "../services/normalizeTicket";
import { useTicketStore } from "../store/ticketStore";

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
          upsertLiveEvent(event.ticketId, event.version, {
            status: event.patch.status,
            priority: event.patch.priority,
            messagesCount: event.patch.messagesCount,
            updatedAt: event.patch.lastUpdatedAt,
          });

          setRowIndicator(event.ticketId, "live");
          scheduleIndicatorClear(event.ticketId);
          setLiveAnnouncement(
            `Ticket ${event.ticketId} was updated by another agent`,
          );
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
