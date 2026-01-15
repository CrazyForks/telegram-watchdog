/**
 * Forum Topic 数据库操作
 */

/**
 * 获取系统 Topic（如 Spam Topic）
 */
export async function getSystemTopic(db: D1Database, topicType: string): Promise<number | null> {
  const result = await db.prepare(`
    SELECT topic_id FROM forum_topics WHERE topic_type = ?
  `).bind(topicType).first<{ topic_id: number }>();

  return result?.topic_id ?? null;
}

/**
 * 保存系统 Topic
 */
export async function saveSystemTopic(db: D1Database, topicType: string, topicId: number): Promise<void> {
  await db.prepare(`
    INSERT OR REPLACE INTO forum_topics (topic_type, topic_id, created_at)
    VALUES (?, ?, ?)
  `).bind(topicType, topicId, Date.now()).run();
}

/**
 * 用户 Topic 信息
 */
export interface UserTopicInfo {
  topic_id: number;
  topic_name: string;
}

/**
 * 获取用户专属 Topic（仅 ID）
 */
export async function getUserTopicId(db: D1Database, userId: string): Promise<number | null> {
  const result = await db.prepare(`
    SELECT topic_id FROM user_topics WHERE user_id = ?
  `).bind(userId).first<{ topic_id: number }>();

  return result?.topic_id ?? null;
}

/**
 * 获取用户 Topic 完整信息（包含名称，用于检测是否需要更新）
 */
export async function getUserTopicInfo(db: D1Database, userId: string): Promise<UserTopicInfo | null> {
  const result = await db.prepare(`
    SELECT topic_id, topic_name FROM user_topics WHERE user_id = ?
  `).bind(userId).first<UserTopicInfo>();

  return result ?? null;
}

/**
 * 更新用户 Topic 名称
 */
export async function updateUserTopicName(db: D1Database, userId: string, topicName: string): Promise<void> {
  await db.prepare(`
    UPDATE user_topics SET topic_name = ? WHERE user_id = ?
  `).bind(topicName, userId).run();
}

/**
 * 保存用户 Topic
 */
export async function saveUserTopic(
  db: D1Database,
  userId: string,
  topicId: number,
  topicName: string
): Promise<void> {
  await db.prepare(`
    INSERT OR REPLACE INTO user_topics (user_id, topic_id, topic_name, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(userId, topicId, topicName, Date.now()).run();
}

/**
 * 通过 Topic ID 查找用户 ID
 */
export async function getUserIdByTopicId(db: D1Database, topicId: number): Promise<string | null> {
  const result = await db.prepare(`
    SELECT user_id FROM user_topics WHERE topic_id = ?
  `).bind(topicId).first<{ user_id: string }>();

  return result?.user_id ?? null;
}
