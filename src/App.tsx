import { lazy } from "react";
import { useUrlSync } from "./hooks/useUrlSync";
import { useTicketEvents } from "./hooks/useTicketEvents";

import Filters from "./components/filters";
import BulkUpdate from "./components/bulkupdate";
const Layout = lazy(() => import("./components/layout"));
const Tickets = lazy(() => import("./components/tickets"));

export default function App() {
  useUrlSync();
  useTicketEvents();
  return (
    <Layout>
      <section className="grid grid-cols-12 gap-4">
        <section className="col-span-12  md:col-span-3">
          <Filters />
          <BulkUpdate />
        </section>

        <section className="col-span-12  md:col-span-9">
          <Tickets />
        </section>
      </section>
    </Layout>
  );
}
