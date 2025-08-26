export type BumpType = 'patch' | 'minor' | 'major';

export function bumpVersion(ver: string, type: BumpType): string {
  const m = ver.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!m) throw new Error(`Invalid semver version in package.json: '${ver}'`);
  let [major, minor, patch] = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  if (type === 'major') { major += 1; minor = 0; patch = 0; }
  else if (type === 'minor') { minor += 1; patch = 0; }
  else { patch += 1; }
  return `${major}.${minor}.${patch}`;
}
