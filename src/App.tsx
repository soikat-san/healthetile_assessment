import { useEffect, useState } from "react";
import { fetchTickets } from "./api/ticketApi";

/**
 * Starter App.
 *
 * This file exists ONLY to prove the mock API is wired up. You are
 * expected to throw it away (or completely rewrite it) and design
 * your own architecture.
 *
 * See README.md for the full assignment.
 */
export default function App() {
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTickets()
      .then((data) => {
        if (!cancelled) {
          setRaw(data);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1 className="text-2xl font-bold underline">
        Support Ticket Triage Console
      </h1>
      <p className="text-red-600">
        This is the starter. See <code>README.md</code>. The block below dumps
        the raw response from <code>fetchTickets()</code> so you can see the
        contract you are working against. Notice that the response shape varies
        across calls.
      </p>

      {loading && <p>Loading...</p>}
      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {raw !== null && (
        <pre
          style={{
            background: "#f4f4f4",
            padding: 12,
            maxHeight: 480,
            overflow: "auto",
            fontSize: 12,
          }}
        >
          {JSON.stringify(raw, null, 2).slice(0, 4000)}
          {"\n\n... (truncated for display) ..."}
        </pre>
      )}
    </main>
  );
}
