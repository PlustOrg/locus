import { DesignSystemBlock } from '../ast';

export function generateCssVariables(ds?: DesignSystemBlock): string {
  if (!ds || !ds.colors) return '/* no design system colors defined */\n';
  const lines: string[] = [];
  for (const [theme, tokens] of Object.entries(ds.colors)) {
    const sel = `[data-theme="${theme}"]`;
    lines.push(`${sel} {`);
    for (const [k, v] of Object.entries(tokens)) {
      const val = (v as any)?.value !== undefined ? (v as any).value : v;
      lines.push(`  --color-${k}: ${val};`);
    }
    lines.push('}');
  }
  return lines.join('\n') + '\n';
}
