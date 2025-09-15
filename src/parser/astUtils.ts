/**
 * AST Utility Facade
 * Re-exports location & hidden property helpers used across parser builders.
 * Keeping a stable facade allows future internal relocation without touching import sites.
 * Pure helpers: no side effects.
 */
export { posOf, defineHidden } from './builderUtils';
