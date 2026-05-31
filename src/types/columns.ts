import type { Ticket } from "./ticket";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  width: number;
  align?: "left" | "center" | "right";
  type?: "data" | "actions" | "select";
};

export const ticketColumns: Column<Ticket>[] = [
  {
    key: "select",
    label: "",
    width: 60,
    align: "center",
    type: "select",
  },
  {
    key: "id",
    label: "Ticket ID",
    width: 140,
  },
  {
    key: "title",
    label: "Title",
    width: 450,
  },
  {
    key: "customerName",
    label: "Customer Name",
    width: 180,
  },
  {
    key: "status",
    label: "Status",
    width: 180,
    align: "center",
  },
  {
    key: "priority",
    label: "Priority",
    width: 120,
    align: "center",
  },
  {
    key: "assignedTo",
    label: "Assigned To",
    width: 140,
    align: "center",
  },
  {
    key: "createdAt",
    label: "Create Date",
    width: 120,
    align: "center",
  },
  {
    key: "updatedAt",
    label: "Update Date",
    width: 120,
    align: "center",
  },
  {
    key: "actions",
    label: "Actions",
    width: 160,
    align: "center",
    type: "actions",
  },
];
