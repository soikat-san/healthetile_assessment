import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTicketStore } from "../../store/ticketStore";
import {
  SORT_OPTIONS,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  SORT_DIRECTION_OPTIONS,
} from "../../data/filter-options";
import Select from "../../ui/select";
import Switch from "../../ui/switch";
import SearchBar from "../../ui/search-bar";
import AutoComplete from "../../ui/autocomplete";

function Filters() {
  const [open, setOpen] = useState(false);
  const { search, filters, setSearch, setFilters } = useTicketStore();

  const tickets = useTicketStore((state) => state.tickets);

  const assignees = useMemo(() => {
    return [
      ...new Set(
        Object.values(tickets)
          .map((ticket) => ticket.assignedTo)
          .filter(Boolean),
      ),
    ] as string[];
  }, [tickets]);

  const clearAll = () => {
    setSearch("");

    setFilters({
      status: null,
      priority: null,
      assignee: null,
      malformedOnly: false,
      sortBy: "updatedAt",
      sortDirection: "desc",
    });
  };

  return (
    <aside className="mt-2 rounded-lg bg-zinc-100">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-4"
      >
        <h2 className="font-semibold underline">Filters</h2>

        <span className="text-lg md:hidden">
          {open ? <ChevronUp /> : <ChevronDown />}
        </span>
      </button>

      <div
        className={`space-y-4 px-4 pb-4 ${open ? "block" : "hidden"} md:block`}
      >
        <SearchBar value={search} onChange={setSearch} />

        <Select
          value={filters.status ?? ""}
          onChange={(v) =>
            setFilters({
              ...filters,
              status: v || null,
            })
          }
          placeholder="Status"
          options={STATUS_OPTIONS}
        />

        <Select
          value={filters.priority ?? ""}
          onChange={(v) =>
            setFilters({
              ...filters,
              priority: v || null,
            })
          }
          placeholder="Priority"
          options={PRIORITY_OPTIONS}
        />

        <AutoComplete
          value={filters.assignee ?? ""}
          onChange={(v) =>
            setFilters({
              ...filters,
              assignee: v || null,
            })
          }
          placeholder="Search assignee"
          options={assignees}
        />

        <Select
          value={filters.sortBy}
          onChange={(v) =>
            setFilters({
              ...filters,
              sortBy: v as any,
            })
          }
          placeholder="Sort By"
          options={SORT_OPTIONS}
        />

        <Select
          value={filters.sortDirection}
          onChange={(v) =>
            setFilters({
              ...filters,
              sortDirection: v as any,
            })
          }
          placeholder="Direction"
          options={SORT_DIRECTION_OPTIONS}
        />

        <Switch
          label="Show Malformed Tickets"
          checked={filters.malformedOnly}
          onChange={(checked) =>
            setFilters({ ...filters, malformedOnly: checked })
          }
        />

        <button
          onClick={clearAll}
          className="w-full rounded-md bg-slate-300 p-2 transition-colors hover:bg-slate-400 cursor-pointer"
        >
          Clear All
        </button>
      </div>
    </aside>
  );
}

export default Filters;
