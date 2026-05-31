import { useEffect } from "react";

import { subscribeToTicketEvents } from "../api/ticketEvents";
import { normalizeTicket } from "../services/normalizeTicket";
import { useTicketStore } from "../store/ticketStore";

export function useTicketEvents() {
  const updateTicket = useTicketStore((state) => state.updateTicket);
  const upsertLiveEvent = useTicketStore((state) => state.upsertLiveEvent);
  const setRowIndicator = useTicketStore((state) => state.setRowIndicator);
  const clearRowIndicator = useTicketStore((state) => state.clearRowIndicator);

  useEffect(() => {
    const unsubscribe = subscribeToTicketEvents((event) => {
      switch (event.type) {
        case "ticket.created": {
          const normalized = normalizeTicket(event.ticket);
          updateTicket(normalized);
          setRowIndicator(normalized.id, "live");

          setTimeout(() => {
            clearRowIndicator(normalized.id);
          }, 3000);

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

          setTimeout(() => {
            clearRowIndicator(event.ticketId);
          }, 3000);

          break;
        }

        case "ticket.assigned": {
          upsertLiveEvent(event.ticketId, event.version, {
            assignedTo: event.assignedTo,
          });

          setRowIndicator(event.ticketId, "live");

          setTimeout(() => {
            clearRowIndicator(event.ticketId);
          }, 3000);

          break;
        }
      }
    });

    return unsubscribe;
  }, []);
}
