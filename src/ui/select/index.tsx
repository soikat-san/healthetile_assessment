import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
  placeholder?: string;
};

const CustomSelect = ({
  value = "",
  onChange,
  options,
  label,
  placeholder = "Select...",
}: Props) => {
  const id = React.useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

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
    <div className="w-full" ref={ref}>
      {label && (
        <label htmlFor={id} className="block text-xs text-gray-600 mb-0.5">
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full py-1 px-2 text-sm flex items-center justify-between rounded border border-gray-300 bg-white outline-none focus:border-slate-400"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="relative mt-1 w-(--trigger-w) min-w-full rounded border border-gray-300 bg-white shadow-md"
          style={{ width: ref.current?.offsetWidth }}
        >
          <ul role="listbox">
            <li
              role="option"
              aria-selected={value === ""}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-sm p-2 text-gray-400 cursor-pointer hover:bg-gray-50"
            >
              {placeholder}
            </li>
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`text-sm p-2 cursor-pointer hover:bg-gray-50
                  ${opt.value === value ? "text-blue-600 font-medium" : "text-gray-900"}`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
