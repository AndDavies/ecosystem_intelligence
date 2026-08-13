import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const defaultLockTtlMs = 30 * 60 * 1000;
const incompleteOwnerGraceMs = 5_000;

interface ResearchWriterLockOwner {
  schemaVersion: "tnm_research_writer_lock_v1";
  token: string;
  workspaceRoot: string;
  operation: string;
  pid: number;
  startedAt: string;
}

export interface ResearchWriterLockOptions {
  lockPath?: string;
  ttlMs?: number;
}

function ownerPath(lockPath: string) {
  return path.join(lockPath, "owner.json");
}

export function researchWriterLockPath(workspaceRoot: string) {
  const resolved = path.resolve(workspaceRoot);
  const digest = createHash("sha256").update(resolved).digest("hex").slice(0, 20);
  return path.join(tmpdir(), `tnm-research-writer-${digest}.lock`);
}

async function readOwner(lockPath: string) {
  try {
    const value = JSON.parse(await readFile(ownerPath(lockPath), "utf8")) as Partial<ResearchWriterLockOwner>;
    return value.schemaVersion === "tnm_research_writer_lock_v1"
      && typeof value.token === "string"
      && typeof value.workspaceRoot === "string"
      && typeof value.operation === "string"
      && typeof value.pid === "number"
      && typeof value.startedAt === "string"
      ? value as ResearchWriterLockOwner
      : null;
  } catch {
    return null;
  }
}

function pidIsAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

async function removeQuarantinedLock(lockPath: string) {
  await unlink(ownerPath(lockPath)).catch((error) => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
  await rmdir(lockPath).catch((error) => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
}

export async function acquireResearchWriterLock(
  workspaceRoot: string,
  operation: string,
  options: ResearchWriterLockOptions = {}
) {
  const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
  const lockPath = options.lockPath ?? researchWriterLockPath(resolvedWorkspaceRoot);
  const ttlMs = options.ttlMs ?? defaultLockTtlMs;
  if (!Number.isFinite(ttlMs) || ttlMs < incompleteOwnerGraceMs) {
    throw new Error(`Research writer lock TTL must be at least ${incompleteOwnerGraceMs}ms.`);
  }
  const owner: ResearchWriterLockOwner = {
    schemaVersion: "tnm_research_writer_lock_v1",
    token: randomUUID(),
    workspaceRoot: resolvedWorkspaceRoot,
    operation,
    pid: process.pid,
    startedAt: new Date().toISOString()
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await mkdir(lockPath, { mode: 0o700 });
      try {
        await writeFile(ownerPath(lockPath), `${JSON.stringify(owner)}\n`, { flag: "wx", mode: 0o600 });
      } catch (error) {
        await rmdir(lockPath).catch(() => undefined);
        throw error;
      }
      return { lockPath, owner };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const [existingOwner, metadata] = await Promise.all([
        readOwner(lockPath),
        stat(lockPath).catch(() => null)
      ]);
      if (!metadata) continue;
      const ageMs = Date.now() - metadata.mtimeMs;
      const replaceable = existingOwner
        ? !pidIsAlive(existingOwner.pid)
        : ageMs > Math.min(ttlMs, incompleteOwnerGraceMs);
      if (!replaceable) {
        const description = existingOwner
          ? `${existingOwner.operation} (pid ${existingOwner.pid}, started ${existingOwner.startedAt})`
          : "an initializing writer";
        throw new Error(`Research preparation or Admin Review intake is already running in this checkout: ${description}.`);
      }
      const quarantinePath = `${lockPath}.stale-${owner.token}`;
      try {
        await rename(lockPath, quarantinePath);
      } catch (renameError) {
        if ((renameError as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw renameError;
      }
      await removeQuarantinedLock(quarantinePath);
    }
  }
  throw new Error("Could not acquire the atomic local research writer lock after stale-owner recovery.");
}

export async function releaseResearchWriterLock(lock: Awaited<ReturnType<typeof acquireResearchWriterLock>>) {
  const current = await readOwner(lock.lockPath);
  if (!current || current.token !== lock.owner.token) {
    throw new Error("Research writer lock ownership changed before release; the lock was preserved.");
  }
  await unlink(ownerPath(lock.lockPath));
  await rmdir(lock.lockPath);
}

export async function withResearchWriterLock<Result>(
  workspaceRoot: string,
  operation: string,
  task: () => Promise<Result>,
  options: ResearchWriterLockOptions = {}
) {
  const lock = await acquireResearchWriterLock(workspaceRoot, operation, options);
  try {
    return await task();
  } finally {
    await releaseResearchWriterLock(lock);
  }
}
