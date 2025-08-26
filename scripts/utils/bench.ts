import { LocusLexer } from '../../src/parser/tokens';
import { DatabaseCstParser } from '../../src/parser/databaseParser';

/**
 * Runs a benchmark on the parser.
 * @param sample - The code sample to parse.
 * @param iterations - The number of times to run the benchmark.
 */
export function runParserBenchmark(sample: string, iterations = 100) {
  const start = Date.now();
  let tokens = 0;

  for (let i = 0; i < iterations; i++) {
    const lexerResult = LocusLexer.tokenize(sample);
    tokens += lexerResult.tokens.length;

    const parser = new DatabaseCstParser();
    parser.input = lexerResult.tokens;
    parser.file();

    if (parser.errors.length) {
      throw new Error('Parser errors encountered during benchmark.');
    }
  }

  const elapsed = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      iterations,
      elapsedMs: elapsed,
      tokens,
      tokensPerSec: Math.round((tokens / elapsed) * 1000),
    })
  );
}
