import { DesignSystemBlock } from '../ast';

export function generateCssVariables(ds?: DesignSystemBlock): string {
  if (!ds || !ds.colors) return '/* no design system colors defined */\n';
  const lines: string[] = [];
  // Deterministic ordering: sort theme names and token keys
  const themes = Object.keys(ds.colors).sort();
  for (const theme of themes) {
    const tokens = (ds.colors as any)[theme];
    const tokenKeys = Object.keys(tokens).sort();
    const sel = `[data-theme="${theme}"]`;
    lines.push(`${sel} {`);
    for (const k of tokenKeys) {
      const v: any = (tokens as any)[k];
      const val = (v as any)?.value !== undefined ? (v as any).value : v;
      lines.push(`  --color-${k}: ${val};`);
    }
    lines.push('}');
  }
  return lines.join('\n') + '\n';
}
