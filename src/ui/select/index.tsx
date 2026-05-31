import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { ChevronDown } from "lucide-react";

type Option = { label: string; value: string };
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
  const id = useId();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const allOptions = [{ label: placeholder, value: "" }, ...options];
  const selected = allOptions.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset active index when opening
  const handleOpen = () => {
    const currentIndex = allOptions.findIndex((o) => o.value === value);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  };

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      buttonRef.current?.focus(); // return focus to trigger
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      // Open on ArrowDown / ArrowUp / Enter / Space
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(allOptions.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) handleSelect(allOptions[activeIndex].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const activeOptionId =
    open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className="w-full" ref={ref} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={id} className="block text-xs text-gray-600 mb-0.5">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="w-full py-1 px-2 text-sm flex items-center justify-between
          rounded border border-gray-300 bg-white outline-none
          focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <span className={selected?.value ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label ?? placeholder}
          className="relative mt-1 w-full rounded border border-gray-300
            bg-white shadow-md z-10"
          style={{ width: ref.current?.offsetWidth }}
        >
          {allOptions.map((opt, i) => (
            <li
              key={opt.value || "__placeholder__"}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={opt.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleSelect(opt.value)}
              className={`text-sm p-2 cursor-pointer
                ${i === activeIndex ? "bg-slate-100" : "hover:bg-gray-50"}
                ${opt.value === value ? "text-blue-600 font-medium" : ""}
                ${opt.value === "" ? "text-gray-400" : "text-gray-900"}`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
