import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

type BumpType = 'patch' | 'minor' | 'major';

function bumpVersion(ver: string, type: BumpType): string {
  const m = ver.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!m) throw new Error(`Invalid semver version in package.json: '${ver}'`);
  let [major, minor, patch] = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  if (type === 'major') { major += 1; minor = 0; patch = 0; }
  else if (type === 'minor') { minor += 1; patch = 0; }
  else { patch += 1; }
  return `${major}.${minor}.${patch}`;
}

function main() {
  const arg = (process.argv[2] || 'patch').toLowerCase();
  const type: BumpType = (['patch','minor','major'] as const).includes(arg as BumpType) ? (arg as BumpType) : 'patch';
  const pkgPath = 'package.json';
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as any;
  const prev = pkg.version as string;
  const next = bumpVersion(prev, type);
  pkg.version = next;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const addFiles = ['package.json'];
  if (existsSync('package-lock.json')) addFiles.push('package-lock.json');
  const addCmd = `git add ${addFiles.join(' ')}`;
  const commitCmd = `git commit -m "chore(release): v${next}"`;
  const tagCmd = `git tag v${next}`;
  const pushCmd = `git push origin $(git rev-parse --abbrev-ref HEAD) --tags`;
  const publishCmd = `npm publish --access public`;

  // Run git add/commit/tag locally (skip push)
  try {
    execSync(addCmd, { stdio: 'inherit' });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('# WARN: git add failed (continuing).');
  }
  try {
    execSync(commitCmd, { stdio: 'inherit' });
  } catch (e) {
    // Likely no changes to commit; continue
    // eslint-disable-next-line no-console
    console.log('# NOTE: git commit skipped or failed (maybe no changes).');
  }
  try {
    execSync(tagCmd, { stdio: 'inherit' });
  } catch (e) {
    // Tag may already exist; continue
    // eslint-disable-next-line no-console
    console.log(`# NOTE: git tag '${`v${next}`}' already exists or failed.`);
  }

  // Output copy-paste friendly commands
  // eslint-disable-next-line no-console
  console.log(`\nVersion bumped: ${prev} -> ${next}\n`);
  // eslint-disable-next-line no-console
  console.log(`# Next step: push tag and changes to origin, and optionally publish:`);
  // eslint-disable-next-line no-console
  console.log(pushCmd);
  // eslint-disable-next-line no-console
  console.log(`# Manual publish (if not using CI):`);
  // eslint-disable-next-line no-console
  console.log(publishCmd);
}

main();
