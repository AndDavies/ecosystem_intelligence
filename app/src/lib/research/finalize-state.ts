import { createHash } from 'node:crypto';
import { readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface FinalizeReceipt {
  schemaVersion: 'research_finalize_receipt_v1';
  runId: string;
  inputDigest: string;
  phase: 'research_ready' | 'validated' | 'files_ready' | 'intake_started' | 'intake_verified' | 'failed';
  startedAt: string;
  verifiedAt?: string;
  steps: Array<{ id: string; startedAt: string; finishedAt: string; durationMs: number; ok: boolean }>;
}
export async function artifactDigest(root: string, paths: string[]) {
  const hash = createHash('sha256');
  for (const file of [...new Set(paths)].sort()) {
    hash.update(file); hash.update('\0'); hash.update(await readFile(path.resolve(root, file))); hash.update('\0');
  }
  return hash.digest('hex');
}
export async function saveFinalizeReceipt(file: string, value: FinalizeReceipt) {
  await mkdir(path.dirname(file), {recursive: true});
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n', {mode: 0o600});
  await rename(temp, file);
}
export function canResumeIntake(receipt: FinalizeReceipt | null, digest: string) {
  return receipt?.inputDigest === digest && ['intake_started', 'intake_verified'].includes(receipt.phase);
}
