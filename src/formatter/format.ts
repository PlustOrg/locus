import { LocusLexer } from '../parser/tokens';

// Structural, minimal formatter for database/entity blocks.
export function formatLocus(source: string): string {
  const { tokens } = LocusLexer.tokenize(source);
  const out: string[] = [];
  let i = 0;
  function skipWs(){ while (i<tokens.length && /WhiteSpace|LineComment/.test(tokens[i].tokenType.name)) i++; }
  skipWs();
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.image === 'database') {
      out.push('database {\n'); i++; skipWs();
      // consume possible '{'
      if (tokens[i]?.image === '{') { i++; }
      // entities
      while (i < tokens.length && tokens[i].image !== '}') {
        skipWs();
        if (tokens[i]?.image === 'entity') {
          i++; skipWs();
            const nameTok = tokens[i]; i++; skipWs();
            if (tokens[i]?.image === '{') i++;
            out.push(`  entity ${nameTok.image} {\n`);
            // fields until '}'
            while (i < tokens.length && tokens[i].image !== '}') {
              skipWs();
              const id = tokens[i];
              if (!id || id.image === '}') break;
              const colon = tokens[i+1];
              const typeTok = tokens[i+2];
              if (colon?.image === ':' && typeTok) {
                out.push(`    ${id.image}: ${typeTok.image}\n`);
                i += 3; continue;
              }
              i++;
            }
            if (tokens[i]?.image === '}') { i++; }
            out.push('  }\n');
        } else { i++; }
        skipWs();
      }
      if (tokens[i]?.image === '}') i++;
      out.push('}\n');
    } else {
      // Fallback: emit raw token stream minimally spaced
      out.push(t.image);
      i++;
    }
    skipWs();
  }
  return out.join('').replace(/\n{3,}/g,'\n\n');
}
