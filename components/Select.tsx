"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm transition ${
          open
            ? "border-accent/50 bg-white/[0.05] text-foreground"
            : "border-white/10 bg-white/[0.03] text-foreground hover:border-accent/30"
        }`}
      >
        <span className={selected ? "text-foreground" : "text-muted/50"}>
          {selected?.label ?? ""}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-accent" : "text-muted"
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute start-0 end-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-accent/15 bg-[#12100d]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {options.map((opt) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSel}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm transition ${
                  isSel
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-white/[0.05] hover:text-foreground"
                }`}
              >
                <span>{opt.label}</span>
                {isSel && <Check size={14} className="text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
