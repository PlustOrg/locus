// Centralized suggestion engine (Phase 2 E1)
const KEYWORDS = ['workflow','database','entity','page','component','store','state','action','steps','branch','else','elseif','forEach','in','guard','design_system','colors','spacing','radii','shadows','weights'];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length; const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for (let i=0;i<=m;i++) dp[i][0]=i; for (let j=0;j<=n;j++) dp[0][j]=j;
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++) {
    const cost = a[i-1] === b[j-1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
  }
  return dp[m][n];
}

function extractOffendingIdentifier(msg: string): string | undefined {
  const m = /found --> '([^']+)' <--/.exec(msg) || /Unexpected token:?[\s]+([^\s]+)/i.exec(msg) || /found:\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(msg);
  return m?.[1];
}

export function computeSuggestions(msg: string): string[] | undefined {
  const tok = extractOffendingIdentifier(msg);
  const suggestions: string[] = [];
  if (tok) {
    const ranked = KEYWORDS.map(k => [k, levenshtein(tok, k)] as const).sort((a,b)=>a[1]-b[1]);
    suggestions.push(...ranked.filter(r => r[1] <= 2).slice(0,3).map(r=>r[0]));
  }
  if (/else\s+if/.test(msg)) suggestions.push('elseif');
  if (/for\s+each/i.test(msg)) suggestions.push('forEach');
  if (/on\s+delete/i.test(msg)) suggestions.push('on_delete');
  const dedup = Array.from(new Set(suggestions));
  return dedup.length ? dedup : undefined;
}
