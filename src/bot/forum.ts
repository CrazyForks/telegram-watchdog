/**
 * Forum Topic 管理模块
 */
import { Api } from 'grammy';
import { Env } from '@/env';
import {
  getSystemTopic,
  saveSystemTopic,
  getUserTopicInfo,
  saveUserTopic,
  updateUserTopicName,
} from '@/db/topics';

// Topic 图标颜色（Telegram 支持的颜色）
// 必须是 Telegram 允许的颜色之一：7322096, 16766590, 13338331, 9367192, 16749490, 16478047
const TOPIC_COLORS = {
  SPAM: 16478047 as const,    // 0xFB6F5F 红橙色
  USER: 9367192 as const,     // 0x8EEE98 绿色
};

/**
 * 获取或创建 Spam Topic
 * @returns Topic ID，创建失败返回 null
 */
export async function getOrCreateSpamTopic(api: Api, env: Env): Promise<number | null> {
  if (!env.ADMIN_GID) {
    return null;
  }

  try {
    // 先查询数据库是否已有 Spam Topic
    const existingTopicId = await getSystemTopic(env.DB, 'spam');
    if (existingTopicId !== null) {
      return existingTopicId;
    }

    // 创建新的 Spam Topic
    const forumTopic = await api.createForumTopic(
      env.ADMIN_GID,
      '🚨 Spam',
      { icon_color: TOPIC_COLORS.SPAM }
    );

    // 保存到数据库
    await saveSystemTopic(env.DB, 'spam', forumTopic.message_thread_id);

    return forumTopic.message_thread_id;
  } catch (error) {
    // 创建失败（如权限不足、群组非 Forum 类型），返回 null 触发回退逻辑
    console.error('Failed to create Spam topic:', error);
    return null;
  }
}

/**
 * 获取或创建用户专属 Topic
 * 如果用户名发生变化，自动更新 Topic 名称
 * @returns Topic ID，创建失败返回 null
 */
export async function getOrCreateUserTopic(
  api: Api,
  env: Env,
  userId: string,
  userName: string
): Promise<number | null> {
  if (!env.ADMIN_GID) {
    return null;
  }

  const newTopicName = `👤 ${userName}`;

  try {
    // 先查询数据库是否已有该用户的 Topic
    const existingTopic = await getUserTopicInfo(env.DB, userId);

    if (existingTopic !== null) {
      // 检查用户名是否变化，如果变化则更新 Topic 名称
      if (existingTopic.topic_name !== newTopicName) {
        try {
          await api.editForumTopic(env.ADMIN_GID, existingTopic.topic_id, {
            name: newTopicName,
          });
          await updateUserTopicName(env.DB, userId, newTopicName);
        } catch (updateError) {
          // 更新失败不影响主流程，仅记录日志
          console.error('Failed to update user topic name:', updateError);
        }
      }
      return existingTopic.topic_id;
    }

    // 创建新的用户 Topic
    const forumTopic = await api.createForumTopic(
      env.ADMIN_GID,
      newTopicName,
      { icon_color: TOPIC_COLORS.USER }
    );

    // 保存到数据库
    await saveUserTopic(env.DB, userId, forumTopic.message_thread_id, newTopicName);

    return forumTopic.message_thread_id;
  } catch (error) {
    // 创建失败，返回 null 触发回退逻辑
    console.error('Failed to create user topic:', error);
    return null;
  }
}
