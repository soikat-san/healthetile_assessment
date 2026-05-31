import { ListChecks } from "lucide-react";
import { ticketColumns } from "../../types/columns";
import { getAlignClass } from "../../utils/get-cell-alignment";

const TicketHeader = () => {
  return (
    <div className="sticky top-0 z-10 overflow-hidden rounded-md border border-slate-300 bg-slate-100 shadow-sm">
      <div className="flex items-center text-xs font-semibold tracking-wide text-slate-700">
        {ticketColumns.map((column) => (
          <div
            key={String(column.key)}
            className={`flex items-center ${getAlignClass(column.align)} p-3 border-r border-slate-700 last:border-r-0`}
            style={{
              width: column.width,
              minWidth: column.width,
            }}
          >
            {column.key === "select" ? <ListChecks size={18} /> : column.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketHeader;
