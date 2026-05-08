import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'

function assertAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new ConvexError('ADMIN_PASSWORD not configured')
  if (password !== expected) throw new ConvexError('Unauthorized')
}

export const submitMessage = mutation({
  args: {
    recipient: v.string(),
    text: v.string(),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const recipient = args.recipient.trim()
    const text = args.text.trim()
    const signature = args.signature?.trim() || undefined

    if (recipient.length < 1 || recipient.length > 100) {
      throw new Error('recipient must be 1-100 characters')
    }
    if (text.length < 1 || text.length > 120) {
      throw new Error('text must be 1-120 characters')
    }
    if (signature !== undefined && signature.length > 50) {
      throw new Error('signature must be at most 50 characters')
    }

    await ctx.db.insert('messages', {
      recipient,
      text,
      signature,
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})

export const verifyAdminPassword = mutation({
  args: { adminPassword: v.string() },
  handler: async (_ctx, args) => {
    assertAdmin(args.adminPassword)
    return true
  },
})

export const getPendingMessages = query({
  args: { adminPassword: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    return await ctx.db
      .query('messages')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .order('desc')
      .collect()
  },
})

export const getAllMessages = query({
  args: {
    adminPassword: v.string(),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('approved'),
        v.literal('rejected'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    const base = ctx.db.query('messages')
    const filtered = args.status
      ? base.filter((q) => q.eq(q.field('status'), args.status))
      : base
    return await filtered.order('desc').collect()
  },
})

export const setMessageStatus = mutation({
  args: {
    messageId: v.id('messages'),
    adminPassword: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
    ),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    await ctx.db.patch(args.messageId, { status: args.status })
  },
})

export const updateMessage = mutation({
  args: {
    messageId: v.id('messages'),
    adminPassword: v.string(),
    recipient: v.string(),
    text: v.string(),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    const recipient = args.recipient.trim()
    const text = args.text.trim()
    const signature = args.signature?.trim() || undefined
    if (recipient.length < 1 || recipient.length > 100) {
      throw new Error('recipient must be 1-100 characters')
    }
    if (text.length < 1 || text.length > 120) {
      throw new Error('text must be 1-120 characters')
    }
    if (signature !== undefined && signature.length > 50) {
      throw new Error('signature must be at most 50 characters')
    }
    await ctx.db.patch(args.messageId, { recipient, text, signature })
  },
})

export const approveMessage = mutation({
  args: { messageId: v.id('messages'), adminPassword: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    await ctx.db.patch(args.messageId, { status: 'approved' })
  },
})

export const rejectMessage = mutation({
  args: { messageId: v.id('messages'), adminPassword: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    await ctx.db.patch(args.messageId, { status: 'rejected' })
  },
})

export const getApprovedMessages = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 9, 1), 64)
    return await ctx.db
      .query('messages')
      .filter((q) => q.eq(q.field('status'), 'approved'))
      .order('desc')
      .take(limit)
  },
})

const DEFAULT_WALL_ROWS = 3
const DEFAULT_WALL_COLS = 3

export const getWallSettings = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db.query('settings').first()
    return {
      rows: doc?.wallRows ?? DEFAULT_WALL_ROWS,
      cols: doc?.wallCols ?? DEFAULT_WALL_COLS,
      theme: doc?.wallTheme ?? 'blue',
      highlightedMessageId: doc?.highlightedMessageId ?? null,
    }
  },
})

export const setHighlightedMessage = mutation({
  args: {
    adminPassword: v.string(),
    messageId: v.union(v.id('messages'), v.null()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    const existing = await ctx.db.query('settings').first()
    const value = args.messageId ?? undefined
    if (existing) {
      await ctx.db.patch(existing._id, { highlightedMessageId: value })
    } else {
      await ctx.db.insert('settings', {
        wallRows: DEFAULT_WALL_ROWS,
        wallCols: DEFAULT_WALL_COLS,
        highlightedMessageId: value,
      })
    }
  },
})

const SEED_RECIPIENTS = [
  'plava košulja na stage-u',
  'Jovani, zna ona koja je',
  'DJ-u u prvom redu',
  'stari prijatelj na klupi u parku',
  'tipu sa žutim šeširom',
  'devojci sa belom narukvicom',
  'saputniku iz autobusa 25',
  'konobaru sa pivom u ruci',
  'devojci koja igra u prvom redu',
  'liku u majici od Jurke',
]

const SEED_TEXTS = [
  'Ono kad ti neko baci osmeh iz prvog reda to sam bio ja.',
  'Nadam se da je tvoja pesma. Nadam se da me prepoznaš.',
  'Smeh nam je bio glasniji od vetra. Vraćam se tim trenucima.',
  'Možda ostane samo osmeh. Na Jurci, to je sasvim dovoljno.',
  'Ako mi se javiš, biće ti drago. Obećavam.',
  'Tvoja energija mi je popravila dan. Hvala.',
  'Vidim te svakodnevno, ne smem da priđem.',
  'Kad zaigraš, ceo park stane. Bar meni.',
  'Pratim te kroz gužvu. Nikad nas niko ne vidi.',
  'Probaj da me pogledaš dva puta. Možda razumeš.',
]

const SEED_SIGNATURES: Array<string | undefined> = [
  'N.',
  '🫶',
  '🌿',
  '🍸',
  'anon',
  'M.',
  '👀',
  undefined,
  undefined,
  undefined,
]

export const clearAllMessages = mutation({
  args: { adminPassword: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    const messages = await ctx.db.query('messages').collect()
    for (const msg of messages) {
      await ctx.db.delete(msg._id)
    }
    return { deleted: messages.length }
  },
})

export const seedMessages = mutation({
  args: {
    adminPassword: v.string(),
    count: v.number(),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('approved'),
        v.literal('rejected'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    if (args.count < 1 || args.count > 100) {
      throw new Error('count must be 1-100')
    }
    const status = args.status ?? 'approved'
    const now = Date.now()
    for (let i = 0; i < args.count; i++) {
      const recipient =
        SEED_RECIPIENTS[Math.floor(Math.random() * SEED_RECIPIENTS.length)]
      const text =
        SEED_TEXTS[Math.floor(Math.random() * SEED_TEXTS.length)]
      const signature =
        SEED_SIGNATURES[Math.floor(Math.random() * SEED_SIGNATURES.length)]
      await ctx.db.insert('messages', {
        recipient,
        text,
        signature,
        status,
        createdAt: now - i * 1000,
      })
    }
    return { inserted: args.count }
  },
})

export const setWallSettings = mutation({
  args: {
    adminPassword: v.string(),
    rows: v.number(),
    cols: v.number(),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminPassword)
    if (args.rows < 1 || args.rows > 8) throw new Error('rows must be 1-8')
    if (args.cols < 1 || args.cols > 8) throw new Error('cols must be 1-8')
    const existing = await ctx.db.query('settings').first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        wallRows: args.rows,
        wallCols: args.cols,
      })
    } else {
      await ctx.db.insert('settings', {
        wallRows: args.rows,
        wallCols: args.cols,
      })
    }
  },
})
