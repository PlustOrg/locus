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
  const toRoute = (n: string) => n.toLowerCase();
  if (sorted.length) {
    const first = sorted[0];
    files['next-app/app/page.tsx'] = `import React from 'react'
import Page from '../../react/pages/${first.name}'
export default function PageEntry(){ return <Page/> }
`;
  } else {
    files['next-app/app/page.tsx'] = `export default function Page(){ return null }
`;
  }
  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i];
    const route = toRoute(p.name);
    files[`next-app/app/${route}/page.tsx`] = `import React from 'react'
import Page from '../../../react/pages/${p.name}'
export default function PageEntry(){ return <Page/> }
`;
  }
  return files;
}
