import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull(),
  totalFruits: integer("total_fruits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userFruits = pgTable("user_fruits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fruitId: text("fruit_id").notNull(),
  quantity: integer("quantity").default(1),
  firstObtained: timestamp("first_obtained").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  fruits: many(userFruits),
}));

export const userFruitsRelations = relations(userFruits, ({ one }) => ({
  user: one(users, {
    fields: [userFruits.userId],
    references: [users.id],
  }),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type UserFruit = typeof userFruits.$inferSelect;
export type InsertUserFruit = z.infer<typeof insertUserFruitSchema>;
