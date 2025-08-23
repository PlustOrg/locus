export function generateNextApp(pages: Array<{ name: string }>): Record<string, string> {
  const files: Record<string, string> = {};
  // globals.css imports public/theme.css
  files['next-app/app/globals.css'] = `@import url('/theme.css');
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; }
`;  
  files['next-app/app/layout.tsx'] = `import './globals.css'
import React from 'react'
export const metadata = { title: 'Locus App' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body data-theme="light">{children}</body></html>)
}
`;

  const sorted = [...pages].sort((a, b) => a.name.localeCompare(b.name));
  const kebab = (name: string) => name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .toLowerCase();

  // Landing page listing links to each generated page
  if (sorted.length) {
    const links = sorted.map(p => `      <li><a href="/${kebab(p.name)}">${p.name}</a></li>`).join('\n');
    files['next-app/app/page.tsx'] = `import React from 'react'
export default function Landing(){
  return <main style={{padding:20,fontFamily:'system-ui'}}>
    <h1>Locus Pages</h1>
    <ul style={{lineHeight:1.8}}>
${links}
    </ul>
  </main>
}
`;
  } else {
    files['next-app/app/page.tsx'] = `export default function Page(){ return <main/> }
`;
  }

  // Individual page routes
  for (const p of sorted) {
    const route = kebab(p.name);
    files[`next-app/app/${route}/page.tsx`] = `import React from 'react'
import Page from '../../../react/pages/${p.name}'
export default function PageEntry(){ return <Page/> }
`;
  }

  // tsconfig for editor TS in next-app
  files['next-app/tsconfig.json'] = JSON.stringify({ extends: '../tsconfig.json', compilerOptions: { jsx: 'preserve' }, include: ['.'] }, null, 2) + '\n';
  // next.config.js minimal
  files['next-app/next.config.js'] = `/** Auto-generated minimal Next.js config */\nmodule.exports = { reactStrictMode: true }\n`;

  return files;
}
