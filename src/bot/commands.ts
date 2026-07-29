import { Bot, Context } from 'grammy';
import { Env } from '@/env';
import { manuallyWhitelistUser, removeFromWhitelist } from '@/db/trust';

/**
 * Register admin commands for managing user trust
 */
export function registerAdminCommands(bot: Bot, env: Env) {
  // /trust command - manually whitelist a user
  bot.command('trust', async (ctx: Context) => {
    await handleTrustCommand(ctx, env);
  });

  // /untrust command - remove user from whitelist
  bot.command('untrust', async (ctx: Context) => {
    await handleUntrustCommand(ctx, env);
  });

  // /getid command - get chat/user ID
  bot.command('getid', async (ctx: Context) => {
    await handleGetIdCommand(ctx);
  });
}

/**
 * Handle /trust command - manually add user to whitelist
 */
async function handleTrustCommand(ctx: Context, env: Env): Promise<void> {
  try {
    // 1. Verify admin identity
    if (ctx.from?.id !== Number(env.ADMIN_UID)) {
      return; // Ignore non-admin users
    }

    // 2. Check if replying to a message
    const replyTo = ctx.message?.reply_to_message;
    if (!replyTo) {
      console.warn('/trust command rejected: no replied-to message', {
        userId: ctx.from.id,
        chatId: ctx.chat?.id,
      });
      await ctx.reply('❌ 请回复要信任的用户消息');
      return;
    }

    // 3. Query original user from message mappings
    const mapping = await env.DB.prepare(
      'SELECT original_user_chat_id FROM message_mappings WHERE forwarded_message_id = ?'
    )
      .bind(replyTo.message_id)
      .first<{ original_user_chat_id: string }>();

    if (!mapping) {
      console.warn('/trust command rejected: original user not found', {
        userId: ctx.from.id,
        chatId: ctx.chat?.id,
        replyToMessageId: replyTo.message_id,
      });
      await ctx.reply('❌ 无法找到原始用户');
      return;
    }

    const originalUserId = mapping.original_user_chat_id;

    // Get username from the forwarded message if available
    const username = replyTo.from?.username;

    // 4. Manually whitelist the user
    await manuallyWhitelistUser(env.DB, originalUserId, username);

    // 5. Reply with confirmation
    await ctx.reply('✅ 用户已手动加入白名单');
  } catch (error) {
    console.error('Error in /trust command:', {
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      replyToMessageId: ctx.message?.reply_to_message?.message_id,
    }, error);
    await ctx.reply('❌ 处理命令时出错，请稍后重试');
  }
}

/**
 * Handle /untrust command - remove user from whitelist
 */
async function handleUntrustCommand(ctx: Context, env: Env): Promise<void> {
  try {
    // 1. Verify admin identity
    if (ctx.from?.id !== Number(env.ADMIN_UID)) {
      return; // Ignore non-admin users
    }

    // 2. Check if replying to a message
    const replyTo = ctx.message?.reply_to_message;
    if (!replyTo) {
      console.warn('/untrust command rejected: no replied-to message', {
        userId: ctx.from.id,
        chatId: ctx.chat?.id,
      });
      await ctx.reply('❌ 请回复要取消信任的用户消息');
      return;
    }

    // 3. Query original user from message mappings
    const mapping = await env.DB.prepare(
      'SELECT original_user_chat_id FROM message_mappings WHERE forwarded_message_id = ?'
    )
      .bind(replyTo.message_id)
      .first<{ original_user_chat_id: string }>();

    if (!mapping) {
      console.warn('/untrust command rejected: original user not found', {
        userId: ctx.from.id,
        chatId: ctx.chat?.id,
        replyToMessageId: replyTo.message_id,
      });
      await ctx.reply('❌ 无法找到原始用户');
      return;
    }

    const originalUserId = mapping.original_user_chat_id;

    // 4. Remove user from whitelist
    await removeFromWhitelist(env.DB, originalUserId);

    // 5. Reply with confirmation
    await ctx.reply('⚠️ 用户已移除白名单，重新进入监控');
  } catch (error) {
    console.error('Error in /untrust command:', {
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      replyToMessageId: ctx.message?.reply_to_message?.message_id,
    }, error);
    await ctx.reply('❌ 处理命令时出错，请稍后重试');
  }
}

/**
 * Handle /getid command - get current chat and user ID
 */
async function handleGetIdCommand(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  const chatType = ctx.chat?.type;
  const userId = ctx.from?.id;
  const messageThreadId = ctx.message?.message_thread_id;

  let response = `📋 ID 信息\n\n`;
  response += `👤 你的用户 ID: \`${userId}\`\n`;
  response += `💬 当前聊天 ID: \`${chatId}\`\n`;
  response += `📝 聊天类型: ${chatType}`;

  if (messageThreadId) {
    response += `\n🧵 Topic ID: \`${messageThreadId}\``;
  }

  await ctx.reply(response, { parse_mode: 'Markdown' });
}
