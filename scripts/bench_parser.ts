import { readFileSync } from 'fs';
import { join } from 'path';
import { runParserBenchmark } from './utils/bench';

/**
 * This script benchmarks the performance of the Locus parser.
 *
 * It reads a sample Locus file and runs the parser a specified number of times,
 * measuring the performance in tokens per second.
 *
 * Usage:
 * ts-node scripts/bench_parser.ts [sample-file-path] [iterations]
 */
const samplePath = process.argv[2] || join(__dirname, 'sample.locus');
const iterations = Number(process.argv[3]) || 100;
const input = readFileSync(samplePath, 'utf8');

runParserBenchmark(input, iterations);
