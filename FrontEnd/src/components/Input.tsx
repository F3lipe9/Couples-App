import React from 'react';

interface InputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none transition-all text-slate-800 bg-white/50 backdrop-blur-sm
        ${disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-100'
          : 'focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
        }`}
    />
  </div>
);