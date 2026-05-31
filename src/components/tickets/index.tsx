import { useState } from "react";
import { List } from "react-window";
import type { Ticket } from "../../types/ticket";
import { useTickets } from "../../hooks/useTickets";
import { useTicketStore } from "../../store/ticketStore";

import Error from "./error";
import Loader from "./loader";
import NoData from "./nodata";
import TicketRow from "./row";
import Modal from "../../ui/modal";
import TicketHeader from "./header";

const Tickets = () => {
  const { tickets, loading, error, retryAttempt, isExhausted, retry } =
    useTickets();
  const [openModal, setOpenModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const ticketsMap = useTicketStore((state) => state.tickets);
  const selectedTicket = selectedTicketId ? ticketsMap[selectedTicketId] : null;
  const selectedTicketIds = useTicketStore((state) => state.selectedTicketIds);
  const rowIndicators = useTicketStore((state) => state.rowIndicators);

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setOpenModal(true);
  };

  if (loading) {
    return <Loader retryAttempt={retryAttempt} />;
  }

  if (error) {
    return <Error error={error} isExhausted={isExhausted} onRetry={retry} />;
  }

  return (
    <>
      <div className="p-4 my-2 bg-zinc-100 rounded-lg border border-slate-500">
        <div className="overflow-x-auto hide-scrollbar">
          {tickets.length > 0 ? (
            <div className="min-w-max">
              <TicketHeader />

              <div className="h-[calc(100vh-480px)] md:h-[calc(100vh-220px)]">
                <List
                  rowComponent={TicketRow}
                  rowCount={tickets.length}
                  rowHeight={56}
                  rowProps={{
                    tickets,
                    onViewTicket: handleViewTicket,
                    selectedTicketIds,
                    rowIndicators,
                  }}
                />
              </div>
            </div>
          ) : (
            <NoData />
          )}
        </div>
      </div>

      {selectedTicket && (
        <Modal
          open={openModal}
          onClose={() => setOpenModal(false)}
          ticket={selectedTicket}
        />
      )}
    </>
  );
};

export default Tickets;
