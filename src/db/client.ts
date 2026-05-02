/**
 * 项目使用的最小数据库接口（D1 API 的子集）。
 * Cloudflare D1 的 D1Database 通过结构子类型直接满足该接口；
 * Docker / Node 部署下由 sqlite-adapter 包装 node:sqlite 提供同样的形状。
 */
export interface DBClient {
  prepare(sql: string): DBPreparedStatement;
}

export interface DBPreparedStatement {
  bind(...values: unknown[]): DBPreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}
