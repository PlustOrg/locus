import React from 'react';

interface StackProps {
  children?: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: number | string;
  align?: string;
  justify?: string;
  wrap?: boolean;
}

export function Stack({ children, direction = 'column', gap = 'var(--space-2)', align, justify, wrap }: StackProps) {
  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    gap,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };
  return (
    <div className="locus-stack" style={style}>
      {children}
    </div>
  );
}
