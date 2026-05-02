import { Bot } from 'grammy';
import { Env } from '@/env';
import { messageFilterMiddleware } from '@/bot/middleware';
import { messageHandler } from '@/bot/message';
import { registerAdminCommands } from '@/bot/commands';

export const WEBHOOK_PATH = '/webhook';

/**
 * 装配 Grammy bot：注册命令、垃圾过滤中间件、消息处理器。
 * 同时被 Cloudflare 入口（src/index.ts）和 Node 入口（src/server.ts）复用。
 *
 * 重要：此模块禁止 import 任何 Node-only 或 CF-only 的运行时模块，
 * 否则会污染另一侧的 bundle / 类型检查。
 */
export function setupBot(env: Env): Bot {
  const bot = new Bot(env.BOT_TOKEN);

  registerAdminCommands(bot, env);
  bot.use(messageFilterMiddleware(env));
  bot.on('message', messageHandler(env));

  return bot;
}
