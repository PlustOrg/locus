import { UploadedFileMeta } from './multipart';

export type FileScanner = (file: UploadedFileMeta) => Promise<void> | void;

const scanners: FileScanner[] = [];

export function registerFileScanner(fn: FileScanner) {
  scanners.push(fn);
}

export async function runFileScanners(files: UploadedFileMeta[]) {
  for (const f of files) {
    for (const scan of scanners) {
      await scan(f);
    }
  }
}

export function clearFileScanners() { (scanners as any).length = 0; }