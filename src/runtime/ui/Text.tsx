import React from 'react';

interface TextProps {
  children?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  variant?: 'body' | 'heading' | 'subtle';
}

export function Text({ children, as: Component = 'p', variant = 'body' }: TextProps) {
  const className = `locus-text locus-text-${variant}`;
  return <Component className={className}>{children}</Component>;
}
