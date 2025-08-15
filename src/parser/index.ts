import { LocusFileAST } from '../ast';

export class LocusParserError extends Error {}

export function parseLocus(source: string): LocusFileAST {
  // Placeholder implementation for TDD: throw to ensure tests start failing
  throw new LocusParserError('Parser not implemented');
}
