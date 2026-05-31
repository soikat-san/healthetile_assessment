import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const SearchBar = ({ value, onChange }: Props) => {
  return (
    <div className="border-b border-neutral-500 pb-4">
      <p className="text-sm font-bold text-gray-700 pb-1">Search List</p>
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search by title, customer name, or ticket id..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-gray-300 py-1.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <Search
          size={16}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default SearchBar;
