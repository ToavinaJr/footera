import React from 'react';

interface DatePickerFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id, label, value, onChange, min, max, required = false, disabled = false,
}) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-xs font-bold text-slate-700">{label}</label>
    <input
      id={id}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      min={min}
      max={max}
      required={required}
      disabled={disabled}
      className="min-h-11 w-full rounded-xl border border-pitch-line bg-white px-3 py-2 text-sm text-pitch-ink focus:border-pitch-primary focus:outline-hidden disabled:cursor-not-allowed disabled:bg-slate-100"
    />
  </div>
);
