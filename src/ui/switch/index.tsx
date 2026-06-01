import { useId } from "react";

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const Switch = ({ label, checked, onChange }: Props) => {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer select-none w-fit"
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-8 h-4 rounded-full transition-colors duration-200
            peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500
            peer-focus-visible:ring-offset-2
            ${checked ? "bg-blue-500" : "bg-gray-300"}`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white
            shadow transition-transform duration-200
            ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
};

export default Switch;
