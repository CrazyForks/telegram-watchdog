import { Hono } from 'hono';
import { Bot, webhookCallback } from 'grammy';
import { Env } from '@/env';
import { initDatabase } from '@/db/init';
import { setupBot, WEBHOOK_PATH } from '@/app';

// Cloudflare Workers 入口：bindings 是请求作用域的，
// 因此 bot 在第一次请求时懒初始化。
const app = new Hono<{ Bindings: Env }>();

let bot: Bot | undefined;

app.get('/', (c) => c.text('Hello Hono!'));

app.use(async (c, next) => {
  if (!bot) {
    await initDatabase(c.env);
    bot = setupBot(c.env);
    await bot.api.setWebhook(c.env.DOMAIN + WEBHOOK_PATH, {
      secret_token: c.env.BOT_SECRET,
    });
  }
  await next();
});

app.post(WEBHOOK_PATH, async (c) => {
  if (!bot) {
    console.error('Webhook request failed: bot not initialized');
    return c.text('Internal Server Error: Bot not initialized', 500);
  }
  const handler = webhookCallback(bot, 'hono', { secretToken: c.env.BOT_SECRET });
  return await handler(c);
});

export default app;
