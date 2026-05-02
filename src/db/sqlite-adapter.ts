import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type { DBClient, DBPreparedStatement } from '@/db/client';

/**
 * 把 node:sqlite 的 DatabaseSync 包装成项目通用的 DBClient。
 * 同步 API 转成 Promise，让上层代码与 D1 调用方式完全一致。
 */
export function createSqliteClient(db: DatabaseSync): DBClient {
  return {
    prepare(sql: string): DBPreparedStatement {
      return new SqliteStatement(db.prepare(sql));
    },
  };
}

class SqliteStatement implements DBPreparedStatement {
  private values: unknown[] = [];

  constructor(private readonly stmt: StatementSync) {}

  bind(...values: unknown[]): DBPreparedStatement {
    this.values = values.map((v) => (v === undefined ? null : v));
    return this;
  }

  async first<T = unknown>(): Promise<T | null> {
    const row = this.stmt.get(...(this.values as never[]));
    return (row ?? null) as T | null;
  }

  async run(): Promise<{ success: boolean }> {
    this.stmt.run(...(this.values as never[]));
    return { success: true };
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    const rows = this.stmt.all(...(this.values as never[]));
    return { results: rows as T[] };
  }
}
