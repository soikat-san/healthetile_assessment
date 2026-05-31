import { useState, useRef, useEffect } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
};

const AutoComplete = ({ value, onChange, placeholder, options }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(value.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="w-full relative" ref={ref}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white outline-none focus:border-slate-400"
      />

      {open && filtered.length > 0 && (
        <div className="relative mt-1 w-full rounded border border-gray-300 bg-white shadow-md">
          <ul role="listbox">
            {filtered.map((option) => (
              <li
                key={option}
                role="option"
                aria-selected={option === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`text-sm p-2 cursor-pointer hover:bg-gray-50
                  ${option === value ? "text-blue-600 font-medium" : "text-gray-900"}`}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutoComplete;
