import { useId, useState } from "react";
import { CircleX } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Ticket } from "../../types/ticket";
import { STATUS_OPTIONS } from "../../data/filter-options";
import { capitalize, formatDate } from "../../utils/helpers";
import { useTicketStatus } from "../../hooks/useTicketStatus";

type Props = {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
};

const Modal = ({ open, onClose, ticket }: Props) => {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { changeStatus } = useTicketStatus();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(ticket.status);

  useEffect(() => {
    setStatus(ticket.status);
  }, [ticket]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // close on backdrop click
  const backdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await changeStatus(ticket.id, status, ticket.version);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={backdropClick}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-lg border 
      border-slate-200 bg-white p-0 shadow-2xl outline-none backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex open:flex-col"
    >
      <div className="grid grid-cols-12 gap-4 p-4">
        <div className="col-span-10 underline">
          <h2 className="text-lg font-semibold">Ticket Details</h2>
        </div>
        <div className="col-span-2 flex justify-end">
          <CircleX onClick={onClose} className="cursor-pointer" />
        </div>

        <div className="col-span-4 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Ticket ID:</h4>
        </div>
        <div className="col-span-8 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{ticket.id}</h4>
        </div>

        <div className="col-span-4 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Ticket Title:</h4>
        </div>
        <div className="col-span-8 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{ticket.title}</h4>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Ticket Status:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            className="w-full rounded border px-2 py-1"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={id + option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Ticket Version:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{ticket.version}</h4>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Assigned To:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{ticket.assignedTo}</h4>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Priority:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{capitalize(ticket.priority)}</h4>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Customer Name:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{ticket.customerName}</h4>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-medium">Customer Plan:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{capitalize(ticket.customerPlan)}</h4>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Is Malformed:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{ticket.malformed ? "Yes" : "No"}</h4>
        </div>

        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Message Count:</h4>
        </div>
        <div className="col-span-3 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{ticket.messagesCount}</h4>
        </div>

        <div className="col-span-4 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Created At:</h4>
        </div>
        <div className="col-span-8 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{formatDate(ticket.createdAt)}</h4>
        </div>

        <div className="col-span-4 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Updated At:</h4>
        </div>
        <div className="col-span-8 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md italic">{formatDate(ticket.updatedAt)}</h4>
        </div>

        <div className="col-span-4 rounded-md border border-neutral-400 p-2">
          <h4 className="text-md font-semibold">Tags:</h4>
        </div>
        <div className="col-span-8 rounded-md border border-neutral-400 p-2 flex flex-wrap gap-2">
          {ticket.tags.length ? (
            ticket.tags.map((item) => (
              <h6
                key={id + item}
                className="text-sm italic border border-neutral-400 px-2 py-1 rounded-2xl"
              >
                {item}
              </h6>
            ))
          ) : (
            <h6 className="text-sm italic">No tags</h6>
          )}
        </div>

        <div className="col-span-12 flex justify-center">
          <button
            disabled={saving}
            onClick={handleSave}
            className="flex items-center cursor-pointer justify-center gap-2 rounded-md w-2/3 bg-yellow-500 py-1 text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default Modal;
