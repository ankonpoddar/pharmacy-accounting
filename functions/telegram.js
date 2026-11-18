/**
 * Telegram Bot Webhook Handler
 * Receives messages in format: "napa 10 pc 12" or "napa 10 12"
 * Saves to Firestore sales collection and replies with confirmation
 */

import { parseQuickEntry, formatQuickEntryPreview } from '../src/utils/parseQuickEntry.js'
import { getTodayBD } from '../src/utils/date.js'

export async function handleTelegramMessage(bot, msg) {
  const chatId = msg.chat.id
  const text = msg.text?.trim()

  if (!text) {
    await bot.telegram.sendMessage(chatId, 'Please send a message like: "napa 10 12"')
    return
  }

  // Handle commands
  if (text.startsWith('/')) {
    await handleCommand(bot, chatId, text)
    return
  }

  // Parse quick entry
  const parsed = parseQuickEntry(text)

  if (!parsed || !parsed.medicine) {
    await bot.telegram.sendMessage(
      chatId,
      `❌ Could not parse: "${text}"\n\nFormat: "medicine quantity price"\nExample: "napa 10 12" or "seclo 20 pc 140"`
    )
    return
  }

  try {
    // Save to Firestore (will be handled by the webhook endpoint)
    const saleData = {
      date: getTodayBD(),
      medicine: parsed.medicine,
      quantity: parsed.quantity,
      unit: parsed.unit,
      pricePerUnit: parsed.pricePerUnit,
      totalAmount: parsed.totalAmount,
      source: 'telegram',
      telegramChatId: chatId,
      telegramMessageId: msg.message_id
    }

    // Import Firestore add function dynamically
    const { addFirestoreDoc } = await import('../src/services/firestore.js')
    await addFirestoreDoc('sales', saleData)

    const preview = formatQuickEntryPreview(parsed)
    await bot.telegram.sendMessage(
      chatId,
      `✅ Sale recorded!\n${preview}\n\nDate: ${getTodayBD()}`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    console.error('Telegram webhook error:', error)
    await bot.telegram.sendMessage(
      chatId,
      `❌ Failed to save: ${error.message}`
    )
  }
}

async function handleCommand(bot, chatId, command) {
  const [cmd, ...args] = command.split(' ')

  switch (cmd) {
    case '/start':
      await bot.telegram.sendMessage(
        chatId,
        `🏥 <b>Pharmacy Accounting Bot</b>\n\nSend sales like:\n<code>napa 10 12</code>\n<code>seclo 20 pc 140</code>\n\nCommands:\n/start - Show this help\n/today - Today's summary\n/help - Help`,
        { parse_mode: 'HTML' }
      )
      break

    case '/help':
      await bot.telegram.sendMessage(
        chatId,
        `<b>Format:</b> <code>medicine quantity price</code>\n\n<b>Examples:</b>\n<code>napa 10 12</code> - 10 pcs @ 12 each\n<code>seclo 20 pc 140</code> - 20 pcs @ 140 each\n<code>napa 5 150</code> - 5 pcs @ 150 each\n\nUnits: pc, box, strip, bottle (default: pc)`,
        { parse_mode: 'HTML' }
      )
      break

    case '/today':
      await bot.telegram.sendMessage(
        chatId,
        `📊 Today's summary will be available after Firestore integration.`
      )
      break

    default:
      await bot.telegram.sendMessage(chatId, `Unknown command: ${cmd}. Use /help`)
  }
}

export function createTelegramWebhookHandler(bot) {
  return async (req, res) => {
    try {
      const update = req.body
      if (update.message) {
        await handleTelegramMessage(bot, update.message)
      }
      res.status(200).send('OK')
    } catch (error) {
      console.error('Webhook error:', error)
      res.status(500).send('Error')
    }
  }
}