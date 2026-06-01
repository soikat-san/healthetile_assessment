import type { Ticket } from "../../types/ticket";
import { ticketColumns } from "../../types/columns";
import type { RowComponentProps } from "react-window";
import { Eye, OctagonAlert, Ban, Zap } from "lucide-react";
import { useTicketStore } from "../../store/ticketStore";
import { getAlignClass } from "../../utils/get-cell-alignment";
import { formatDate, formatStatus, capitalize } from "../../utils/helpers";

type RowData = {
  tickets: Ticket[];
  onViewTicket: (ticket: Ticket) => void;
  selectedTicketIds: Set<string>;
  rowIndicators: Record<string, "failed" | "conflict" | "live">;
};

function TicketRow({ index, style, ...props }: RowComponentProps<RowData>) {
  const { tickets, onViewTicket, selectedTicketIds, rowIndicators } = props;
  const ticket = tickets[index];

  const indicator = rowIndicators[ticket.id];

  const toggleTicketSelection = useTicketStore(
    (state) => state.toggleTicketSelection,
  );

  const baseStyle = "border-slate-300 hover:bg-neutral-300";
  const failedStyle = "border-red-500 bg-red-50 hover:bg-red-100";
  const liveStyle = "border-green-500 bg-green-50 hover:bg-green-100";
  const conflictStyle = "border-amber-500 bg-amber-50 hover:bg-amber-100";

  return (
    <div style={style}>
      <div
        className={`flex items-center mt-4 rounded-md border transition ${indicator === "live" ? liveStyle : indicator === "failed" ? failedStyle : indicator === "conflict" ? conflictStyle : baseStyle}`}
      >
        {ticketColumns.map((column) => {
          const value = ticket[column.key as keyof Ticket];

          if (column.type === "select") {
            return (
              <div key="select" className="border-r border-slate-200">
                <div
                  className="flex items-center justify-center"
                  style={{ width: column.width, minWidth: column.width }}
                >
                  {indicator === "live" ? (
                    <Zap size={18} className="text-green-500" />
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedTicketIds.has(ticket.id)}
                      onChange={() => toggleTicketSelection(ticket.id)}
                      aria-label={`Select ticket ${ticket.id}`}
                    />
                  )}
                </div>
              </div>
            );
          }

          if (column.type === "actions") {
            return (
              <div
                key={String(column.key)}
                className={`flex w-full items-center gap-3 ${getAlignClass(column.align)}`}
              >
                <button
                  className="rounded p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 cursor-pointer"
                  title={`View ticket ${ticket.id}`}
                  aria-label={`View ticket ${ticket.id}`}
                  onClick={() => onViewTicket(ticket)}
                >
                  <Eye size={18} aria-hidden="true" />
                </button>

                {indicator === "conflict" && (
                  <span
                    role="img"
                    aria-label="Conflict: ticket was updated by another agent"
                    className="rounded p-2 text-amber-500"
                  >
                    <OctagonAlert size={18} aria-hidden="true" />
                  </span>
                )}

                {indicator === "failed" && (
                  <span
                    role="img"
                    aria-label="Update failed"
                    className="rounded p-2 text-red-500"
                  >
                    <Ban size={18} aria-hidden="true" />
                  </span>
                )}
              </div>
            );
          }

          if (column.key === "status") {
            return (
              <div
                key={String(column.key)}
                className={`p-2 border-r border-slate-200 last:border-r-0 box-border flex items-center ${getAlignClass(column.align)}`}
                style={{ width: column.width, minWidth: column.width }}
              >
                {formatStatus(String(value ?? "--"))}
              </div>
            );
          }

          if (column.key === "priority") {
            return (
              <div
                key={String(column.key)}
                className={`p-2 border-r border-slate-200 last:border-r-0 box-border flex items-center ${getAlignClass(column.align)}`}
                style={{ width: column.width, minWidth: column.width }}
              >
                {capitalize(String(value ?? "--"))}
              </div>
            );
          }

          return (
            <div
              key={String(column.key)}
              className={`p-2 border-r border-slate-200 last:border-r-0 box-border flex items-center ${getAlignClass(column.align)}`}
              style={{ width: column.width, minWidth: column.width }}
            >
              {column.key === "updatedAt" || column.key === "createdAt"
                ? formatDate(value as string)
                : String(value ?? "--")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TicketRow;
