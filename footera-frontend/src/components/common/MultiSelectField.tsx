import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export function MultiSelectField({ label, placeholder, options, value, onChange, className = '' }: {
  label: string;
  placeholder: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const summary = value.length ? `${label} (${value.length})` : placeholder;

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-pitch-line bg-white px-3 text-left text-sm text-pitch-ink transition-colors hover:border-pitch-primary focus-visible:outline-2 focus-visible:outline-pitch-primary"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-pitch-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div id={listId} role="group" aria-label={label} className="absolute left-0 top-full z-30 mt-2 max-h-60 w-full min-w-48 overflow-y-auto rounded-xl border border-pitch-line bg-white p-2 shadow-xl">
          {options.map((option) => {
            const checked = value.includes(option);
            return (
              <label key={option} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-pitch-ink hover:bg-pitch-panel">
                <input type="checkbox" checked={checked} onChange={() => onChange(checked ? value.filter((item) => item !== option) : [...value, option])} className="h-4 w-4 accent-pitch-primary" />
                <span className="min-w-0 flex-1">{option}</span>
              </label>
            );
          })}
          {options.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">{placeholder}</p>}
        </div>
      )}
    </div>
  );
}
