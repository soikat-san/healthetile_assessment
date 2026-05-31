import { toastUtil } from "../utils/toast";
import type { TicketStatus } from "../types/tickets";
import { updateTicketStatus } from "../api/ticketApi";
import { useTicketStore } from "../store/ticketStore";
import { normalizeTicket } from "../services/normalizeTicket";

export function useTicketStatus() {
  const tickets = useTicketStore((state) => state.tickets);
  const updateTicket = useTicketStore((state) => state.updateTicket);
  const selectedTicketIds = useTicketStore((state) => state.selectedTicketIds);

  const setLiveAnnouncement = useTicketStore(
    (state) => state.setLiveAnnouncement,
  );

  const clearSelectedTickets = useTicketStore(
    (state) => state.clearSelectedTickets,
  );

  const setRowIndicator = useTicketStore((state) => state.setRowIndicator);

  const clearTicketIndicators = useTicketStore(
    (state) => state.clearTicketIndicators,
  );

  const changeStatus = async (
    ticketId: string,
    nextStatus: TicketStatus,
    expectedVersion: number,
  ) => {
    try {
      const result = await updateTicketStatus(
        ticketId,
        nextStatus,
        expectedVersion,
      );

      if (result.ok) {
        const normalized = normalizeTicket(result.ticket);
        updateTicket(normalized);
        clearTicketIndicators();
        toastUtil.success("Ticket updated successfully");
        setLiveAnnouncement(`Ticket ${ticketId} updated to ${nextStatus}`);
        return {
          success: true,
          conflict: false,
        };
      }

      const latest = normalizeTicket(result.latest);
      updateTicket(latest);
      setRowIndicator(latest.id, "conflict");
      toastUtil.warning("Ticket changed by another agent !!");
      setLiveAnnouncement(
        `Conflict on ticket ${ticketId}. Latest version loaded.`,
      );
      return {
        success: false,
        conflict: true,
      };
    } catch (error) {
      setRowIndicator(ticketId, "failed");

      toastUtil.error(
        error instanceof Error ? error.message : "Failed to update ticket",
      );
      setLiveAnnouncement(`Failed to update ticket ${ticketId}`);
      return {
        success: false,
        conflict: false,
        error,
      };
    }
  };

  const changeMultipleStatuses = async (nextStatus: TicketStatus) => {
    try {
      clearTicketIndicators();

      const selectedTickets = Array.from(selectedTicketIds)
        .map((id) => tickets[id])
        .filter(Boolean);

      const results = await Promise.allSettled(
        selectedTickets.map((ticket) =>
          updateTicketStatus(ticket.id, nextStatus, ticket.version),
        ),
      );

      const successIds: string[] = [];
      const conflictIds: string[] = [];
      const failedIds: string[] = [];

      results.forEach((result, index) => {
        const ticket = selectedTickets[index];

        if (result.status === "rejected") {
          failedIds.push(ticket.id);
          setRowIndicator(ticket.id, "failed");
          return;
        }

        const response = result.value;

        if (response.ok) {
          successIds.push(response.ticket.id);
          updateTicket(normalizeTicket(response.ticket));
          return;
        }

        conflictIds.push(response.latest.id);
        updateTicket(normalizeTicket(response.latest));
        setRowIndicator(response.latest.id, "conflict");
      });

      clearSelectedTickets();

      toastUtil.info(
        [
          `${successIds.length} updated`,
          `${conflictIds.length} conflicts`,
          `${failedIds.length} failed`,
        ].join(" • "),
      );

      return {
        successIds,
        conflictIds,
        failedIds,
      };
    } catch (error) {
      toastUtil.error(
        error instanceof Error ? error.message : "Bulk update failed",
      );

      return {
        successIds: [],
        conflictIds: [],
        failedIds: [],
      };
    }
  };

  return {
    changeStatus,
    changeMultipleStatuses,
  };
}
