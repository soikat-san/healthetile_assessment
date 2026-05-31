import { useState } from "react";
import Select from "../../ui/select";
import { Delete } from "lucide-react";
import type { TicketStatus } from "../../types/tickets";
import { useTicketStore } from "../../store/ticketStore";
import { STATUS_OPTIONS } from "../../data/filter-options";
import { useTicketStatus } from "../../hooks/useTicketStatus";

const BulkUpdate = () => {
  const selectedIds = useTicketStore((state) => state.selectedTicketIds);
  const clearSelectedTickets = useTicketStore(
    (state) => state.clearSelectedTickets,
  );
  const { changeMultipleStatuses } = useTicketStatus();

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<TicketStatus>("new");

  const handleApply = async () => {
    setSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await changeMultipleStatuses(status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 rounded-lg bg-zinc-100 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold underline">
          Bulk Selected... ({selectedIds.size})
        </h2>
        <button
          disabled={selectedIds.size === 0}
          onClick={clearSelectedTickets}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
          title="Clear Selection"
        >
          <Delete size={18} className="transition hover:text-red-600" />
        </button>
      </div>

      <div
        className={`${selectedIds.size === 0 ? "pointer-events-none opacity-20 mt-4" : "mt-4"}`}
      >
        <Select
          value={status}
          onChange={(value) => setStatus(value as TicketStatus)}
          options={STATUS_OPTIONS}
        />
      </div>

      <button
        disabled={saving || selectedIds.size === 0}
        onClick={handleApply}
        className="flex items-center cursor-pointer justify-center gap-2 rounded-md mt-4 w-full bg-yellow-300 hover:bg-yellow-400 p-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Updating...
          </>
        ) : (
          "Update"
        )}
      </button>
    </div>
  );
};

export default BulkUpdate;
