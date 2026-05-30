import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Minimal file-backed key/value store for the multitenant MVP.
 * Writes are serialized in-process and persisted atomically (tmp + rename).
 * Good enough for a hackathon; swap for SQLite/Postgres in production.
 */
export class JsonStore<T> {
  private filePath: string;
  private cache: Record<string, T> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(storePath: string) {
    this.filePath = path.isAbsolute(storePath)
      ? storePath
      : path.join(process.cwd(), storePath);
  }

  private async load(): Promise<Record<string, T>> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.cache = JSON.parse(raw) as Record<string, T>;
    } catch {
      this.cache = {};
    }
    return this.cache;
  }

  async get(key: string): Promise<T | undefined> {
    const data = await this.load();
    return data[key];
  }

  async all(): Promise<Record<string, T>> {
    return { ...(await this.load()) };
  }

  /**
   * Read-modify-write under a single-process mutex. The mutator receives the
   * live in-memory record and may return any value; the record is persisted
   * after the mutator runs.
   */
  async mutate<R>(mutator: (data: Record<string, T>) => R | Promise<R>): Promise<R> {
    const run = this.writeChain.then(async () => {
      const data = await this.load();
      const result = await mutator(data);
      await this.persist(data);
      return result;
    });
    this.writeChain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async persist(data: Record<string, T>): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
    await fs.rename(tmp, this.filePath);
    this.cache = data;
  }
}
