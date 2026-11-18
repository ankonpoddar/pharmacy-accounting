/**
 * Firebase Cloud Functions Entry Point
 * - Telegram Bot Webhook
 * - Scheduled Daily Backup
 * - Manual Backup Trigger
 */

import { onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp()
}
const db = getFirestore()

// ============================================================
// Telegram Webhook
// ============================================================
export const telegramWebhook = onRequest(
  { cors: true, secrets: ['TELEGRAM_BOT_TOKEN'] },
  async (req, res) => {
    try {
      const { Telegraf } = await import('telegraf')
      const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
      const { createTelegramWebhookHandler } = await import('./telegram.js')
      const handler = createTelegramWebhookHandler(bot)
      await handler(req, res)
    } catch (error) {
      logger.error('Telegram webhook error:', error)
      res.status(500).send('Internal Server Error')
    }
  }
)

// ============================================================
// Backup Functions
// ============================================================

async function generateDailyReport(date) {
  const salesSnap = await db.collection('sales').where('date', '==', date).get()
  const duesSnap = await db.collection('dues').where('date', '==', date).get()
  const expensesSnap = await db.collection('expenses').where('date', '==', date).get()

  const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const dues = duesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const activeDues = dues.filter(d => !d.paid)
  const collectedDues = dues.filter(d => d.paid)

  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const totalDueGiven = activeDues.reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalDueCollected = collectedDues.reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const netCash = (totalSales + totalDueCollected) - totalExpenses

  // CSV content
  const csvLines = [
    'Type,Date,Medicine/Customer/Category,Qty,Unit,Price,Amount,Status',
    ...sales.map(s => `Sale,${s.date},${s.medicine},${s.quantity},${s.unit},${s.pricePerUnit},${s.totalAmount},`),
    ...dues.map(d => `Due,${d.date},${d.name},,,${d.amount},${d.paid ? 'Paid' : 'Pending'}`),
    ...expenses.map(e => `Expense,${e.date},${e.category} - ${e.description},,,${e.amount},`),
    '',
    'Summary,,,,,,,',
    `Total Sales,,,,,,${totalSales},`,
    `Total Due Given,,,,,,${totalDueGiven},`,
    `Total Due Collected,,,,,,${totalDueCollected},`,
    `Total Expenses,,,,,,${totalExpenses},`,
    `Net Cash,,,,,,${netCash},`
  ]
  const csv = csvLines.join('\n')

  // JSON content
  const json = JSON.stringify({
    date,
    generatedAt: new Date().toISOString(),
    summary: {
      totalSales,
      totalDueGiven,
      totalDueCollected,
      totalExpenses,
      netCash
    },
    sales,
    dues,
    expenses
  }, null, 2)

  // HTML email body
  const html = `
    <h2>📊 Pharmacy Daily Report - ${date}</h2>
    <table style="border-collapse: collapse; width: 100%; font-family: monospace;">
      <tr style="background: #047857; color: white;">
        <th style="padding: 8px; border: 1px solid #ddd;">Metric</th>
        <th style="padding: 8px; border: 1px solid #ddd;">Amount</th>
      </tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Total Sales</td><td style="padding: 8px; border: 1px solid #ddd;">৳${totalSales.toLocaleString()}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Total Due Given</td><td style="padding: 8px; border: 1px solid #ddd;">৳${totalDueGiven.toLocaleString()}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Total Due Collected</td><td style="padding: 8px; border: 1px solid #ddd;">৳${totalDueCollected.toLocaleString()}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Total Expenses</td><td style="padding: 8px; border: 1px solid #ddd;">৳${totalExpenses.toLocaleString()}</td></tr>
      <tr style="background: #f0fdf4;"><td style="padding: 8px; border: 1px solid #ddd;"><strong>Net Cash in Hand</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong>৳${netCash.toLocaleString()}</strong></td></tr>
    </table>
    <p style="margin-top: 20px; color: #666;">Generated at ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}</p>
    <hr>
    <p style="color: #999; font-size: 12px;">Pharmacy Accounting App - Automated Backup</p>
  `

  return { csv, json, html, summary: { totalSales, totalDueGiven, totalDueCollected, totalExpenses, netCash } }
}

async function uploadToDrive(fileName, content, mimeType) {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
  })

  const drive = google.drive({ version: 'v3', auth })
  const folderId = process.env.DRIVE_FOLDER_ID

  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : []
  }

  const media = {
    mimeType,
    body: content
  }

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id,webViewLink'
  })

  return response.data
}

async function sendEmail(subject, html, attachments = []) {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
  })

  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.OWNER_GMAIL,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken.token
    }
  })

  return transporter.sendMail({
    from: process.env.OWNER_GMAIL,
    to: process.env.OWNER_GMAIL,
    subject,
    html,
    attachments
  })
}

// Scheduled daily backup at 23:55 BDT (17:55 UTC)
export const dailyBackup = onSchedule(
  { schedule: '55 17 * * *', timeZone: 'Asia/Dhaka', secrets: ['GOOGLE_APPLICATION_CREDENTIALS', 'OWNER_GMAIL', 'DRIVE_FOLDER_ID'] },
  async (event) => {
    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
    logger.info(`Running scheduled backup for ${date}`)

    try {
      const { csv, json, html, summary } = await generateDailyReport(date)

      // Upload CSV to Drive
      const csvFile = await uploadToDrive(
        `pharmacy-backup-${date}.csv`,
        csv,
        'text/csv'
      )
      logger.info(`CSV uploaded: ${csvFile.webViewLink}`)

      // Upload JSON to Drive
      const jsonFile = await uploadToDrive(
        `pharmacy-backup-${date}.json`,
        json,
        'application/json'
      )
      logger.info(`JSON uploaded: ${jsonFile.webViewLink}`)

      // Send email
      await sendEmail(
        `📊 Pharmacy Daily Report - ${date}`,
        html,
        [
          { filename: `pharmacy-backup-${date}.csv`, content: csv },
          { filename: `pharmacy-backup-${date}.json`, content: json }
        ]
      )
      logger.info('Email sent successfully')

      // Store backup record
      await db.collection('backups').add({
        date,
        csvFileId: csvFile.id,
        jsonFileId: jsonFile.id,
        csvLink: csvFile.webViewLink,
        jsonLink: jsonFile.webViewLink,
        summary,
        createdAt: new Date()
      })

      logger.info('Daily backup completed successfully')
    } catch (error) {
      logger.error('Daily backup failed:', error)
      throw error
    }
  }
)

// Manual backup trigger
export const manualBackup = onRequest(
  { cors: true, secrets: ['GOOGLE_APPLICATION_CREDENTIALS', 'OWNER_GMAIL', 'DRIVE_FOLDER_ID'] },
  async (req, res) => {
    const date = req.query.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
    logger.info(`Manual backup triggered for ${date}`)

    try {
      const { csv, json, html, summary } = await generateDailyReport(date)

      const csvFile = await uploadToDrive(
        `pharmacy-backup-${date}.csv`,
        csv,
        'text/csv'
      )

      const jsonFile = await uploadToDrive(
        `pharmacy-backup-${date}.json`,
        json,
        'application/json'
      )

      await sendEmail(
        `📊 Pharmacy Daily Report (Manual) - ${date}`,
        html,
        [
          { filename: `pharmacy-backup-${date}.csv`, content: csv },
          { filename: `pharmacy-backup-${date}.json`, content: json }
        ]
      )

      await db.collection('backups').add({
        date,
        csvFileId: csvFile.id,
        jsonFileId: jsonFile.id,
        csvLink: csvFile.webViewLink,
        jsonLink: jsonFile.webViewLink,
        summary,
        manual: true,
        createdAt: new Date()
      })

      res.json({
        success: true,
        message: 'Backup completed and emailed',
        csvLink: csvFile.webViewLink,
        jsonLink: jsonFile.webViewLink,
        summary
      })
    } catch (error) {
      logger.error('Manual backup failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  }
)