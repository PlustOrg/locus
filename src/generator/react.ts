export function generateReactPage(page: any): string {
  const imports = `import React, { useEffect, useState } from 'react';\n`;
  const compStart = `export default function ${page.name}() {\n`;
  const stateLines = (page.state || []).map((s: any) => `  const [${s.name}, set${capitalize(s.name)}] = useState(${s.default});`).join('\n');
  const onLoad = page.onLoad ? `\n  useEffect(() => {\n    ${page.onLoad}\n  }, []);\n` : '';
  const actions = (page.actions || []).map((a: any) => `  function ${a.name}(${(a.params||[]).join(', ')}) {\n    ${a.body || ''}\n  }`).join('\n\n');
  const ui = `\n  return (\n    ${page.ui || '<div />'}\n  );\n`;
  const end = `}\n`;
  return [imports, compStart, stateLines, onLoad, actions, ui, end].join('\n');
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
