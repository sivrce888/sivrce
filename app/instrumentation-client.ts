/**
 * BotID client — protect phone reveal + lead form from scrapers/spam bots.
 * @see https://vercel.com/docs/botid/get-started
 */
import { initBotId } from 'botid/client/core'

initBotId({
  protect: [
    { path: '/api/listings/*/phone', method: 'POST' },
    { path: '/api/inquiries', method: 'POST' },
  ],
})
