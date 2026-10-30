import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  ariaLabel: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function MultiSelectField({ value, onChange, options, placeholder, ariaLabel, className = '', searchable = false, searchPlaceholder = 'Search…', emptyMessage = 'No options found' }: MultiSelectFieldProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState<React.CSSProperties>();
  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const edge = 12;
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - edge * 2);
    const left = Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge));
    const below = window.innerHeight - rect.bottom - 8 - edge;
    const above = rect.top - 8 - edge;
    const height = Math.min(320, Math.max(below, above));
    const top = below >= Math.min(220, height) || below >= above ? rect.bottom + 8 : rect.top - height - 8;
    setStyle({ position: 'fixed', top, left, width, maxHeight: height });
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const reposition = () => updatePosition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    document.addEventListener('pointerdown', closeOnOutside);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      document.removeEventListener('pointerdown', closeOnOutside);
    };
  }, [open]);

  const filteredOptions = options.filter((option) => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const menu = open && style && typeof document !== 'undefined' ? createPortal(
    <div ref={menuRef} style={style} className="z-120 overflow-hidden rounded-xl border border-pitch-line bg-white p-1 text-sm text-pitch-ink shadow-xl">
      {searchable && <label className="relative block border-b border-pitch-separator p-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" /><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="min-h-10 w-full rounded-lg bg-pitch-panel pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-pitch-primary/20" /></label>}
      <div id={`${id}-options`} role="listbox" aria-label={ariaLabel} aria-multiselectable="true" className="max-h-60 overflow-y-auto overscroll-contain py-1">
      {filteredOptions.map((option) => {
        const selected = value.includes(option.value);
        return <button key={option.value} type="button" role="option" aria-selected={selected} onClick={() => onChange(selected ? value.filter((item) => item !== option.value) : [...value, option.value])} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-pitch-panel">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-pitch-primary bg-pitch-primary text-white' : 'border-slate-300 bg-white'}`}>{selected && <Check className="h-3 w-3" aria-hidden="true" />}</span>
          <span className="min-w-0 flex-1 whitespace-normal">{option.label}</span>
        </button>;
      })}
      {filteredOptions.length === 0 && <p className="px-3 py-4 text-center text-xs text-slate-500">{emptyMessage}</p>}
      </div>
    </div>, document.body,
  ) : null;

  return <>
    <button ref={triggerRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-options`} onClick={() => { setOpen((current) => !current); setQuery(''); }} className={`inline-flex min-h-11 min-w-36 items-center justify-between gap-2 rounded-xl border border-pitch-line bg-white px-3 text-sm text-pitch-ink ${className}`}>
      <span className="truncate">{selectedLabels.length ? selectedLabels.join(', ') : placeholder}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-pitch-primary transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
    {menu}
  </>;
}
