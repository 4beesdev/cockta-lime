import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
  messages: defineTable({
    recipient: v.string(),
    text: v.string(),
    signature: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
    ),
    createdAt: v.number(),
  }),
  settings: defineTable({
    wallRows: v.number(),
    wallCols: v.number(),
    wallTheme: v.optional(v.union(v.literal('blue'), v.literal('yellow'))),
    highlightedMessageId: v.optional(v.id('messages')),
  }),
})
