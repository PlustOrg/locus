import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { BumpType, bumpVersion } from './utils/version';

/**
 * This script bumps the version number in package.json and generates git commands for creating a release.
 *
 * Usage:
 * ts-node scripts/release_bump.ts [patch|minor|major]
 *
 * It defaults to 'patch' if no argument is provided.
 */
function main() {
  const bumpTypeArg = (process.argv[2] || 'patch').toLowerCase();
  const bumpType: BumpType = (['patch','minor','major'] as const).includes(bumpTypeArg as BumpType) ? (bumpTypeArg as BumpType) : 'patch';

  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as any;

  const previousVersion = packageJson.version as string;
  const nextVersion = bumpVersion(previousVersion, bumpType);

  packageJson.version = nextVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

  // Prepare git commands
  const filesToCommit = ['package.json'];
  if (existsSync('package-lock.json')) {
    filesToCommit.push('package-lock.json');
  }

  const addCommand = `git add ${filesToCommit.join(' ')}`;
  const commitCommand = `git commit -m "chore(release): v${nextVersion}"`;
  const tagCommand = `git tag v${nextVersion}`;
  const pushCommand = `git push origin $(git rev-parse --abbrev-ref HEAD) --tags`;
  const publishCommand = `npm publish --access public`;

  // Execute git commands locally
  try {
    execSync(addCommand, { stdio: 'inherit' });
  } catch (error) {
    console.warn('# WARN: git add failed (continuing).', error);
  }

  try {
    execSync(commitCommand, { stdio: 'inherit' });
  } catch (error) {
    // This might fail if there are no changes to commit
    console.log('# NOTE: git commit skipped or failed (maybe no changes).');
  }

  try {
    execSync(tagCommand, { stdio: 'inherit' });
  } catch (error) {
    // This might fail if the tag already exists
    console.log(`# NOTE: git tag 'v${nextVersion}' already exists or failed.`);
  }

  // Output commands for the user to run manually
  console.log(`\nVersion bumped: ${previousVersion} -> ${nextVersion}\n`);
  console.log(`# Next step: push tag and changes to origin, and optionally publish:`);
  console.log(pushCommand);
  console.log(`# Manual publish (if not using CI):`);
  console.log(publishCommand);
}

main();
