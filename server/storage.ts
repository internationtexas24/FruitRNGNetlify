import { users, userFruits, type User, type InsertUser, type UserFruit, type InsertUserFruit } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

type SessionStore = session.Store;

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserFruits(userId: string): Promise<UserFruit[]>;
  addFruitToUser(userFruit: InsertUserFruit): Promise<UserFruit>;
  incrementUserFruit(userId: string, fruitId: string): Promise<UserFruit>;
  incrementTotalFruits(userId: string): Promise<void>;
  sessionStore: SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserFruits(userId: string): Promise<UserFruit[]> {
    return await db.select().from(userFruits).where(eq(userFruits.userId, userId));
  }

  async addFruitToUser(userFruit: InsertUserFruit): Promise<UserFruit> {
    const [fruit] = await db
      .insert(userFruits)
      .values(userFruit)
      .returning();
    return fruit;
  }

  async incrementUserFruit(userId: string, fruitId: string): Promise<UserFruit> {
    const existingFruits = await db
      .select()
      .from(userFruits)
      .where(sql`${userFruits.userId} = ${userId} AND ${userFruits.fruitId} = ${fruitId}`);
    
    const [existingFruit] = existingFruits;

    if (existingFruit) {
      const [updated] = await db
        .update(userFruits)
        .set({ quantity: sql`${userFruits.quantity} + 1` })
        .where(eq(userFruits.id, existingFruit.id))
        .returning();
      return updated;
    } else {
      return await this.addFruitToUser({ userId, fruitId, quantity: 1 });
    }
  }

  async incrementTotalFruits(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ totalFruits: sql`${users.totalFruits} + 1` })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
