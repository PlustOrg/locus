import React from 'react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, disabled, variant = 'primary' }: ButtonProps) {
  const className = `locus-btn locus-btn-${variant}`;
  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
