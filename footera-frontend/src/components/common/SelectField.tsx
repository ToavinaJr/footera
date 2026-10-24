import React, { Children, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

interface SelectFieldChangeEvent {
  target: { value: string };
}

interface SelectFieldProps {
  value: string | number;
  onChange: (event: SelectFieldChangeEvent) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
}

interface SelectOption {
  value: string;
  label: React.ReactNode;
  text: string;
  disabled: boolean;
}

interface PopupPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

function nodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  return '';
}

export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  required = false,
  name,
  id: providedId,
  'aria-label': ariaLabel,
}) => {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<PopupPosition | null>(null);

  const options = useMemo(() => Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<{ value?: string | number; disabled?: boolean; children?: React.ReactNode }>(child)
      || child.type !== 'option') return [];
    const optionValue = child.props.value ?? '';
    return [{
      value: String(optionValue),
      label: child.props.children,
      text: nodeText(child.props.children).trim(),
      disabled: Boolean(child.props.disabled),
    } satisfies SelectOption];
  }), [children]);
  const selectedValue = String(value);
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const updatePosition = () => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const edge = 12;
    const gap = 8;
    const width = Math.max(0, Math.min(rect.width, window.innerWidth - edge * 2));
    const left = Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge));
    const maxHeight = Math.max(0, Math.min(320, window.innerHeight - edge * 2));
    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - gap - edge);
    const spaceAbove = Math.max(0, rect.top - gap - edge);
    const openAbove = spaceBelow < Math.min(maxHeight, 220) && spaceAbove > spaceBelow;
    const availableHeight = Math.min(maxHeight, openAbove ? spaceAbove : spaceBelow);
    setPosition({
      top: openAbove ? rect.top - availableHeight - gap : rect.bottom + gap,
      left,
      width,
      maxHeight: availableHeight,
    });
  };

  const openMenu = () => {
    if (disabled) return;
    const firstEnabled = options.findIndex((option) => !option.disabled);
    setActiveIndex(selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : Math.max(firstEnabled, 0));
    updatePosition();
    setIsOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const chooseOption = (option: SelectOption) => {
    if (option.disabled) return;
    onChange({ target: { value: option.value } });
    closeMenu(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    updatePosition();
    requestAnimationFrame(() => {
      listboxRef.current?.focus();
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    });

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || buttonRef.current?.contains(target) || listboxRef.current?.contains(target)) return;
      closeMenu();
    };
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && listboxRef.current?.contains(event.target)) return;
      closeMenu();
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activeIndex, isOpen]);

  useEffect(() => () => {
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
  }, []);

  const handleListboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const enabledIndices = options.flatMap((option, index) => option.disabled ? [] : [index]);
    const currentPosition = Math.max(0, enabledIndices.indexOf(activeIndex));
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextPosition = (currentPosition + direction + enabledIndices.length) % enabledIndices.length;
      setActiveIndex(enabledIndices[nextPosition] ?? activeIndex);
      optionRefs.current[enabledIndices[nextPosition] ?? activeIndex]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? enabledIndices[0] : enabledIndices.at(-1);
      if (nextIndex !== undefined) setActiveIndex(nextIndex);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) chooseOption(option);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeaheadRef.current += event.key.toLocaleLowerCase();
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(() => { typeaheadRef.current = ''; }, 700);
      const matchIndex = options.findIndex((option) => !option.disabled && option.text.toLocaleLowerCase().startsWith(typeaheadRef.current));
      if (matchIndex >= 0) setActiveIndex(matchIndex);
    }
  };

  const menu = isOpen && position && typeof document !== 'undefined'
    ? createPortal(
      <div
        id={`${id}-listbox`}
        ref={listboxRef}
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={`${id}-option-${activeIndex}`}
        onKeyDown={handleListboxKeyDown}
        className="fixed z-110 overflow-y-auto overscroll-contain rounded-xl border border-pitch-line bg-white py-1 text-sm text-pitch-ink shadow-xl outline-hidden"
        style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
      >
        {options.map((option, index) => (
          <div
            key={`${option.value}-${index}`}
            id={`${id}-option-${index}`}
            ref={(element) => { optionRefs.current[index] = element; }}
            role="option"
            aria-selected={option.value === selectedValue}
            aria-disabled={option.disabled || undefined}
            onMouseEnter={() => { if (!option.disabled) setActiveIndex(index); }}
            onClick={() => chooseOption(option)}
            className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 whitespace-normal wrap-break ${
              option.disabled
                ? 'cursor-not-allowed text-slate-400'
                : index === activeIndex
                  ? 'bg-pitch-light text-pitch-ink'
                  : 'text-pitch-ink hover:bg-pitch-panel'
            }`}
          >
            <span className="min-w-0 flex-1">{option.label}</span>
            {option.value === selectedValue && <Check className="h-4 w-4 shrink-0 text-pitch-primary" aria-hidden="true" />}
          </div>
        ))}
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="relative w-full min-w-0">
      <button
        id={id}
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        disabled={disabled}
        onClick={() => isOpen ? closeMenu() : openMenu()}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!isOpen) openMenu();
          }
        }}
        className={`flex min-h-11 w-full min-w-0 items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? ''}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-pitch-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <select
        id={`${id}-native`}
        name={name ?? id}
        tabIndex={-1}
        aria-hidden="true"
        value={selectedValue}
        disabled={disabled}
        required={required}
        onChange={() => undefined}
        onInvalid={(event) => {
          event.preventDefault();
          buttonRef.current?.focus();
        }}
        className="pointer-events-none absolute h-px w-px opacity-0"
      >
        {options.map((option, index) => <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>{option.text}</option>)}
      </select>
      {menu}
    </div>
  );
};
