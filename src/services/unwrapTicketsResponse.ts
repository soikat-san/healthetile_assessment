import { RawTicket } from "../types/ticket";

export function unwrapTicketsResponse(response: unknown): RawTicket[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray(response.data)
  ) {
    return response.data as RawTicket[];
  }

  if (
    response &&
    typeof response === "object" &&
    "tickets" in response &&
    Array.isArray(response.tickets)
  ) {
    return response.tickets as RawTicket[];
  }

  return [];
}
