import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, check, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull(),
  totalFruits: integer("total_fruits").default(0),
  coins: integer("coins").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  coinsNonNegative: check("coins_non_negative", sql`${table.coins} >= 0`),
  totalFruitsNonNegative: check("total_fruits_non_negative", sql`${table.totalFruits} >= 0`),
}));

export const userFruits = pgTable("user_fruits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fruitId: text("fruit_id").notNull(),
  quantity: integer("quantity").default(1),
  firstObtained: timestamp("first_obtained").defaultNow(),
});

// All relations are defined after all table definitions to avoid Temporal Dead Zone issues

// Marketplace listings table
export const marketplaceListings = pgTable("marketplace_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fruitId: text("fruit_id").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  quantityPositive: check("quantity_positive", sql`${table.quantity} > 0`),
  pricePositive: check("price_positive", sql`${table.pricePerUnit} > 0`),
}));

// Autoclickers table
export const autoclickers = pgTable("autoclickers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  clicksPerSecond: integer("clicks_per_second").notNull(),
  emoji: text("emoji").notNull(),
}, (table) => ({
  pricePositive: check("price_positive", sql`${table.price} > 0`),
  clicksPositive: check("clicks_positive", sql`${table.clicksPerSecond} > 0`),
}));

// User autoclickers table
export const userAutoclickers = pgTable("user_autoclickers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  autoclickerId: varchar("autoclicker_id").notNull().references(() => autoclickers.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  lastClicked: timestamp("last_clicked").defaultNow(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
}, (table) => ({
  uniqueUserAutoclicker: unique("unique_user_autoclicker").on(table.userId, table.autoclickerId),
  quantityPositive: check("quantity_positive", sql`${table.quantity} > 0`),
}));

// Trading system table
export const tradeOffers = pgTable("trade_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderFruitId: text("sender_fruit_id").notNull(),
  senderQuantity: integer("sender_quantity").notNull(),
  receiverFruitId: text("receiver_fruit_id").notNull(),
  receiverQuantity: integer("receiver_quantity").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  statusValid: check("status_valid", sql`${table.status} IN ('pending', 'accepted', 'rejected', 'cancelled')`),
  senderQuantityPositive: check("sender_quantity_positive", sql`${table.senderQuantity} > 0`),
  receiverQuantityPositive: check("receiver_quantity_positive", sql`${table.receiverQuantity} > 0`),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  username: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertUserFruitSchema = createInsertSchema(userFruits).pick({
  userId: true,
  fruitId: true,
  quantity: true,
});

// Relations moved to end of file to avoid Temporal Dead Zone issues

// Schema definitions for new tables
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).pick({
  sellerId: true,
  fruitId: true,
  quantity: true,
  pricePerUnit: true,
});

export const insertAutoclickerSchema = createInsertSchema(autoclickers).pick({
  name: true,
  description: true,
  price: true,
  clicksPerSecond: true,
  emoji: true,
});

export const insertUserAutoclickerSchema = createInsertSchema(userAutoclickers).pick({
  userId: true,
  autoclickerId: true,
  quantity: true,
});

export const insertTradeOfferSchema = createInsertSchema(tradeOffers).pick({
  senderId: true,
  receiverId: true,
  senderFruitId: true,
  senderQuantity: true,
  receiverFruitId: true,
  receiverQuantity: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type UserFruit = typeof userFruits.$inferSelect;
export type InsertUserFruit = z.infer<typeof insertUserFruitSchema>;

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;

export type Autoclicker = typeof autoclickers.$inferSelect;
export type InsertAutoclicker = z.infer<typeof insertAutoclickerSchema>;

export type UserAutoclicker = typeof userAutoclickers.$inferSelect;
export type InsertUserAutoclicker = z.infer<typeof insertUserAutoclickerSchema>;

export type TradeOffer = typeof tradeOffers.$inferSelect;
export type InsertTradeOffer = z.infer<typeof insertTradeOfferSchema>;

// ALL RELATIONS DEFINED AFTER ALL TABLES TO AVOID TEMPORAL DEAD ZONE ISSUES
export const usersRelations = relations(users, ({ many }) => ({
  fruits: many(userFruits),
  marketplaceListings: many(marketplaceListings),
  userAutoclickers: many(userAutoclickers),
  sentTrades: many(tradeOffers, { relationName: "sender" }),
  receivedTrades: many(tradeOffers, { relationName: "receiver" }),
}));

export const userFruitsRelations = relations(userFruits, ({ one }) => ({
  user: one(users, {
    fields: [userFruits.userId],
    references: [users.id],
  }),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one }) => ({
  seller: one(users, {
    fields: [marketplaceListings.sellerId],
    references: [users.id],
  }),
}));

export const autoclickersRelations = relations(autoclickers, ({ many }) => ({
  userAutoclickers: many(userAutoclickers),
}));

export const userAutoclickersRelations = relations(userAutoclickers, ({ one }) => ({
  user: one(users, {
    fields: [userAutoclickers.userId],
    references: [users.id],
  }),
  autoclicker: one(autoclickers, {
    fields: [userAutoclickers.autoclickerId],
    references: [autoclickers.id],
  }),
}));

export const tradeOffersRelations = relations(tradeOffers, ({ one }) => ({
  sender: one(users, {
    fields: [tradeOffers.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [tradeOffers.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));
