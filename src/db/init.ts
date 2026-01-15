import { Env } from '@/env';

/**
 * 初始化数据库表结构
 * @param env - 环境变量
 */
export async function initDatabase(env: Env): Promise<void> {
  // 创建消息映射表
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS message_mappings (
      forwarded_message_id INTEGER PRIMARY KEY,
      original_user_chat_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  // 创建用户信任度表
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS user_trust (
      user_id TEXT PRIMARY KEY,
      username TEXT,
      trust_status TEXT NOT NULL,
      consecutive_clean_count INTEGER DEFAULT 0,
      total_spam_count INTEGER DEFAULT 0,
      whitelisted_at INTEGER,
      whitelisted_by TEXT,
      last_message_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `).run();

  // 创建信任状态索引
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_trust_status
    ON user_trust(trust_status)
  `).run();

  // 创建 Forum Topic 表（存储系统级 Topic，如 Spam Topic）
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS forum_topics (
      topic_type TEXT PRIMARY KEY,
      topic_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  // 创建用户 Topic 映射表
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS user_topics (
      user_id TEXT PRIMARY KEY,
      topic_id INTEGER NOT NULL,
      topic_name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  // 创建 Topic ID 索引，用于通过 Topic ID 反查用户
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_user_topics_topic_id
    ON user_topics(topic_id)
  `).run();
}

