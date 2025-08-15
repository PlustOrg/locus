export function generateReactPage(page: any): string {
  const imports = `import React, { useEffect, useState } from 'react';\n`;
  const compStart = `export default function ${page.name}() {\n`;
  const stateLines = (page.state || []).map((s: any) => `  const [${s.name}, set${capitalize(s.name)}] = useState(${s.default});`).join('\n');
  const onLoad = page.onLoad ? `\n  useEffect(() => {\n    ${page.onLoad}\n  }, []);\n` : '';
  const actions = (page.actions || []).map((a: any) => `  function ${a.name}(${(a.params||[]).join(', ')}) {\n    ${a.body || ''}\n  }`).join('\n\n');
  const uiContent = stripUiWrapper(page.ui) || '<div />';
  const ui = `\n  return (\n    ${uiContent}\n  );\n`;
  const end = `}\n`;
  return [imports, compStart, stateLines, onLoad, actions, ui, end].join('\n');
}

export function generateReactComponent(component: any): string {
  const imports = `import React from 'react';\n`;
  const props = (component.params || []).map((p: any) => `${p.name}: any`).join('; ');
  const propsInterface = props ? `interface ${component.name}Props { ${props} }\n` : '';
  const signature = props ? `(${lowerFirst(component.name)}Props: ${component.name}Props)` : `()`;
  const uiContent = stripUiWrapper(component.ui) || '<div />';
  const comp = `export default function ${component.name}${signature} {\n  return (\n    ${uiContent}\n  );\n}\n`;
  return [imports, propsInterface, comp].join('\n');
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function lowerFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1); }
function stripUiWrapper(ui?: string): string | undefined {
  if (!ui) return undefined;
  const m = /\bui\s*\{([\s\S]*?)\}$/m.exec(ui.trim());
  if (m) return m[1];
  return ui;
}
