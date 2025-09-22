export interface LocInfo { file?: string; line?: number; column?: number; length?: number }
export function loc(file?: string, line?: number, column?: number, length?: number): LocInfo {
  return { file, line, column, length };
}