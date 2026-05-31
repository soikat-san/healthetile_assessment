import { useState, useRef, useEffect, useId } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
};

const AutoComplete = ({ value, onChange, placeholder, options }: Props) => {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [filtered.length]);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) {
      if (e.key === "ArrowDown" && filtered.length > 0) {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? -1 : i - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) handleSelect(filtered[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const activeOptionId =
    open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className="w-full relative" ref={ref}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && filtered.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full py-1 px-2 text-sm rounded border border-gray-300
          bg-white outline-none focus:border-slate-400
          focus-visible:ring-2 focus-visible:ring-slate-400"
      />

      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="absolute mt-1 w-full rounded border border-gray-300
            bg-white shadow-md z-10"
        >
          {filtered.map((option, i) => (
            <li
              key={option}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={option === value}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleSelect(option)}
              className={`text-sm p-2 cursor-pointer
                ${i === activeIndex ? "bg-slate-100" : "hover:bg-gray-50"}
                ${option === value ? "text-blue-600 font-medium" : "text-gray-900"}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutoComplete;
