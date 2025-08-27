import React from 'react';

interface InputProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Input({ value, onChange, placeholder, disabled }: InputProps) {
  return (
    <input
      className="locus-input"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
