import { 
  users, userFruits, marketplaceListings, autoclickers, userAutoclickers, tradeOffers,
  type User, type InsertUser, type UserFruit, type InsertUserFruit,
  type MarketplaceListing, type InsertMarketplaceListing,
  type Autoclicker, type InsertAutoclicker,
  type UserAutoclicker, type InsertUserAutoclicker,
  type TradeOffer, type InsertTradeOffer
} from "@shared/schema";
import { getFruitSellPrice, getFruitRarity } from "@shared/fruit-utils";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

type SessionStore = session.Store;

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(userId: string, amount: number): Promise<void>;
  
  // User fruits operations
  getUserFruits(userId: string): Promise<UserFruit[]>;
  addFruitToUser(userFruit: InsertUserFruit): Promise<UserFruit>;
  incrementUserFruit(userId: string, fruitId: string): Promise<UserFruit>;
  decrementUserFruit(userId: string, fruitId: string, amount: number): Promise<boolean>;
  incrementTotalFruits(userId: string): Promise<void>;
  sellFruitForCoins(userId: string, fruitId: string, quantity: number): Promise<{ success: boolean; message: string; coinsEarned?: number }>;
  
  // Marketplace operations
  getMarketplaceListings(): Promise<MarketplaceListing[]>;
  getMarketplaceListingById(listingId: string): Promise<MarketplaceListing | undefined>;
  createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  deleteMarketplaceListing(listingId: string): Promise<void>;
  buyMarketplaceListing(buyerId: string, listingId: string): Promise<{ success: boolean; message: string }>;
  
  // Autoclicker operations
  getAutoclickers(): Promise<Autoclicker[]>;
  getAutoclickerById(autoclickerId: string): Promise<Autoclicker | undefined>;
  createAutoclicker(autoclicker: InsertAutoclicker): Promise<Autoclicker>;
  getUserAutoclickers(userId: string): Promise<UserAutoclicker[]>;
  purchaseAutoclicker(userAutoclicker: InsertUserAutoclicker): Promise<UserAutoclicker>;
  purchaseAutoclickerWithCoins(userId: string, autoclickerId: string): Promise<{ success: boolean; message: string }>;
  
  // Trading operations
  getTradeOffers(userId: string): Promise<TradeOffer[]>;
  getTradeOfferById(tradeId: string): Promise<TradeOffer | undefined>;
  createTradeOffer(tradeOffer: InsertTradeOffer): Promise<TradeOffer>;
  acceptTradeOffer(tradeId: string): Promise<void>;
  rejectTradeOffer(tradeId: string): Promise<void>;
  acceptTradeOfferWithTransfer(tradeId: string): Promise<{ success: boolean; message: string }>;
  
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

  async sellFruitForCoins(userId: string, fruitId: string, quantity: number): Promise<{ success: boolean; message: string; coinsEarned?: number }> {
    if (quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than 0' };
    }

    return await db.transaction(async (tx) => {
      try {
        // Get fruit rarity to calculate price
        const rarity = getFruitRarity(fruitId);
        const pricePerFruit = getFruitSellPrice(rarity);
        const totalCoins = pricePerFruit * quantity;

        // Atomically decrement user's fruit with conditional check
        const fruitResult = await tx
          .update(userFruits)
          .set({ quantity: sql`${userFruits.quantity} - ${quantity}` })
          .where(and(
            eq(userFruits.userId, userId),
            eq(userFruits.fruitId, fruitId),
            sql`${userFruits.quantity} >= ${quantity}`
          ))
          .returning();

        if (fruitResult.length === 0) {
          throw new Error('Insufficient fruit quantity');
        }

        // If quantity becomes 0, remove the fruit entry
        const updatedFruit = fruitResult[0];
        if (updatedFruit.quantity === 0) {
          await tx
            .delete(userFruits)
            .where(eq(userFruits.id, updatedFruit.id));
        }

        // Add coins to user
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${totalCoins}` })
          .where(eq(users.id, userId));

        return { 
          success: true, 
          message: `Sold ${quantity} ${fruitId} for ${totalCoins} coins`,
          coinsEarned: totalCoins 
        };
      } catch (error) {
        console.error('Error in sellFruitForCoins:', error);
        const errorMessage = error instanceof Error ? error.message : 'Sell failed';
        throw new Error(errorMessage);
      }
    });
  }

  async updateUserCoins(userId: string, amount: number): Promise<void> {
    await db
      .update(users)
      .set({ coins: sql`${users.coins} + ${amount}` })
      .where(eq(users.id, userId));
  }

  async decrementUserFruit(userId: string, fruitId: string, amount: number): Promise<boolean> {
    const existingFruits = await db
      .select()
      .from(userFruits)
      .where(and(eq(userFruits.userId, userId), eq(userFruits.fruitId, fruitId)));
    
    const [existingFruit] = existingFruits;
    if (!existingFruit || !existingFruit.quantity || existingFruit.quantity < amount) {
      return false; // Not enough fruits
    }

    const newQuantity = existingFruit.quantity - amount;
    if (newQuantity <= 0) {
      await db.delete(userFruits).where(eq(userFruits.id, existingFruit.id));
    } else {
      await db
        .update(userFruits)
        .set({ quantity: newQuantity })
        .where(eq(userFruits.id, existingFruit.id));
    }
    return true;
  }

  // Marketplace operations
  async getMarketplaceListings(): Promise<MarketplaceListing[]> {
    return await db.select().from(marketplaceListings);
  }

  async getMarketplaceListingById(listingId: string): Promise<MarketplaceListing | undefined> {
    const [listing] = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, listingId));
    return listing || undefined;
  }

  async createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    return await db.transaction(async (tx) => {
      // Atomically verify and reserve fruit using conditional decrement - prevents overselling races
      const sellerFruitResult = await tx
        .update(userFruits)
        .set({ quantity: sql`${userFruits.quantity} - ${listing.quantity}` })
        .where(and(
          eq(userFruits.userId, listing.sellerId), 
          eq(userFruits.fruitId, listing.fruitId),
          sql`${userFruits.quantity} >= ${listing.quantity}`
        ))
        .returning();

      if (sellerFruitResult.length === 0) {
        throw new Error("Insufficient fruit to create listing");
      }

      // If quantity becomes 0, remove the fruit entry
      const updatedFruit = sellerFruitResult[0];
      if (updatedFruit.quantity === 0) {
        await tx
          .delete(userFruits)
          .where(eq(userFruits.id, updatedFruit.id));
      }

      // Create the marketplace listing
      const [created] = await tx
        .insert(marketplaceListings)
        .values(listing)
        .returning();
      
      return created;
    });
  }

  async deleteMarketplaceListing(listingId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Atomically delete the listing and get its data - prevents race with concurrent purchases
      const [listing] = await tx
        .delete(marketplaceListings)
        .where(eq(marketplaceListings.id, listingId))
        .returning();
        
      if (!listing) {
        return; // Listing doesn't exist or was already deleted, nothing to do
      }

      // Restore fruit back to seller using the atomically retrieved listing data
      const existingFruit = await tx
        .select()
        .from(userFruits)
        .where(and(eq(userFruits.userId, listing.sellerId), eq(userFruits.fruitId, listing.fruitId)));

      if (existingFruit.length > 0) {
        // Update existing fruit quantity
        await tx
          .update(userFruits)
          .set({ quantity: sql`${userFruits.quantity} + ${listing.quantity}` })
          .where(eq(userFruits.id, existingFruit[0].id));
      } else {
        // Create new fruit entry for seller
        await tx
          .insert(userFruits)
          .values({
            userId: listing.sellerId,
            fruitId: listing.fruitId,
            quantity: listing.quantity
          });
      }
    });
  }

  async buyMarketplaceListing(buyerId: string, listingId: string): Promise<{ success: boolean; message: string }> {
    return await db.transaction(async (tx) => {
      try {
        // Atomically claim the listing by deleting it first - this prevents race conditions
        const [listing] = await tx
          .delete(marketplaceListings)
          .where(eq(marketplaceListings.id, listingId))
          .returning();
          
        if (!listing) {
          throw new Error("Listing not found or already sold");
        }

        // Prevent users from buying their own listings
        if (listing.sellerId === buyerId) {
          throw new Error("Cannot buy your own listing");
        }

        // Calculate total cost
        const totalCost = listing.pricePerUnit * listing.quantity;

        // Deduct coins from buyer with conditional update to prevent race conditions
        const buyerUpdateResult = await tx
          .update(users)
          .set({ coins: sql`${users.coins} - ${totalCost}` })
          .where(and(eq(users.id, buyerId), sql`${users.coins} >= ${totalCost}`))
          .returning();

        if (buyerUpdateResult.length === 0) {
          throw new Error("Insufficient coins");
        }

        // Add coins to seller
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${totalCost}` })
          .where(eq(users.id, listing.sellerId));

        // Transfer fruit to buyer (no need to check seller inventory since listing creation already reserved it)
        const existingBuyerFruit = await tx
          .select()
          .from(userFruits)
          .where(and(eq(userFruits.userId, buyerId), eq(userFruits.fruitId, listing.fruitId)));

        if (existingBuyerFruit.length > 0) {
          // Update existing fruit quantity
          await tx
            .update(userFruits)
            .set({ quantity: sql`${userFruits.quantity} + ${listing.quantity}` })
            .where(eq(userFruits.id, existingBuyerFruit[0].id));
        } else {
          // Create new fruit entry for buyer
          await tx
            .insert(userFruits)
            .values({
              userId: buyerId,
              fruitId: listing.fruitId,
              quantity: listing.quantity
            });
        }

        return { success: true, message: "Purchase completed successfully" };
      } catch (error) {
        console.error('Error in buyMarketplaceListing:', error);
        // Use error message from thrown errors for better feedback
        const errorMessage = error instanceof Error ? error.message : "Transaction failed";
        throw new Error(errorMessage); // Ensure transaction is rolled back
      }
    });
  }

  // Autoclicker operations
  async getAutoclickers(): Promise<Autoclicker[]> {
    return await db.select().from(autoclickers);
  }

  async getAutoclickerById(autoclickerId: string): Promise<Autoclicker | undefined> {
    const [autoclicker] = await db.select().from(autoclickers).where(eq(autoclickers.id, autoclickerId));
    return autoclicker || undefined;
  }

  async createAutoclicker(autoclicker: InsertAutoclicker): Promise<Autoclicker> {
    const [created] = await db
      .insert(autoclickers)
      .values(autoclicker)
      .returning();
    return created;
  }

  async getUserAutoclickers(userId: string): Promise<UserAutoclicker[]> {
    return await db.select().from(userAutoclickers).where(eq(userAutoclickers.userId, userId));
  }

  async purchaseAutoclicker(userAutoclicker: InsertUserAutoclicker): Promise<UserAutoclicker> {
    const [created] = await db
      .insert(userAutoclickers)
      .values(userAutoclicker)
      .returning();
    return created;
  }

  // Trading operations
  async getTradeOffers(userId: string): Promise<TradeOffer[]> {
    return await db
      .select()
      .from(tradeOffers)
      .where(sql`${tradeOffers.senderId} = ${userId} OR ${tradeOffers.receiverId} = ${userId}`);
  }

  async getTradeOfferById(tradeId: string): Promise<TradeOffer | undefined> {
    const [trade] = await db.select().from(tradeOffers).where(eq(tradeOffers.id, tradeId));
    return trade || undefined;
  }

  async createTradeOffer(tradeOffer: InsertTradeOffer): Promise<TradeOffer> {
    const [created] = await db
      .insert(tradeOffers)
      .values(tradeOffer)
      .returning();
    return created;
  }

  async acceptTradeOffer(tradeId: string): Promise<void> {
    await db
      .update(tradeOffers)
      .set({ status: 'accepted', respondedAt: sql`NOW()` })
      .where(eq(tradeOffers.id, tradeId));
  }

  async rejectTradeOffer(tradeId: string): Promise<void> {
    await db
      .update(tradeOffers)
      .set({ status: 'rejected', respondedAt: sql`NOW()` })
      .where(eq(tradeOffers.id, tradeId));
  }

  async purchaseAutoclickerWithCoins(userId: string, autoclickerId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await db.transaction(async (tx) => {
        // Get autoclicker details
        const [autoclicker] = await tx.select().from(autoclickers).where(eq(autoclickers.id, autoclickerId));
        if (!autoclicker) {
          return { success: false, message: 'Autoclicker not found' };
        }

        // Check if user already owns this autoclicker
        const [existing] = await tx.select().from(userAutoclickers)
          .where(and(eq(userAutoclickers.userId, userId), eq(userAutoclickers.autoclickerId, autoclickerId)));
        
        if (existing) {
          // Increment quantity if already owned
          await tx
            .update(userAutoclickers)
            .set({ quantity: sql`${userAutoclickers.quantity} + 1` })
            .where(eq(userAutoclickers.id, existing.id));
          return { success: true, message: 'Autoclicker quantity increased' };
        }

        // Deduct coins from user (with conditional check)
        const [user] = await tx
          .update(users)
          .set({ coins: sql`${users.coins} - ${autoclicker.price}` })
          .where(and(eq(users.id, userId), sql`${users.coins} >= ${autoclicker.price}`))
          .returning();

        if (!user) {
          return { success: false, message: 'Insufficient coins' };
        }

        // Add autoclicker to user
        await tx
          .insert(userAutoclickers)
          .values({ userId, autoclickerId, quantity: 1 });

        return { success: true, message: 'Autoclicker purchased successfully' };
      });
    } catch (error) {
      return { success: false, message: 'Purchase failed' };
    }
  }

  async acceptTradeOfferWithTransfer(tradeId: string): Promise<{ success: boolean; message: string }> {
    return await db.transaction(async (tx) => {
      try {
        // Atomically claim the trade by updating status - prevents race conditions
        const [trade] = await tx
          .update(tradeOffers)
          .set({ status: 'accepted', respondedAt: sql`NOW()` })
          .where(and(eq(tradeOffers.id, tradeId), eq(tradeOffers.status, 'pending')))
          .returning();
          
        if (!trade) {
          throw new Error("Trade offer not found or already processed");
        }

        // Validate sender has enough fruits
        const senderFruits = await tx
          .select()
          .from(userFruits)
          .where(and(eq(userFruits.userId, trade.senderId), eq(userFruits.fruitId, trade.senderFruitId)));
        
        const [senderFruit] = senderFruits;
        if (!senderFruit || !senderFruit.quantity || senderFruit.quantity < trade.senderQuantity) {
          return { success: false, message: "Sender doesn't have enough fruits" };
        }

        // Validate receiver has enough fruits
        const receiverFruits = await tx
          .select()
          .from(userFruits)
          .where(and(eq(userFruits.userId, trade.receiverId), eq(userFruits.fruitId, trade.receiverFruitId)));
        
        const [receiverFruit] = receiverFruits;
        if (!receiverFruit || !receiverFruit.quantity || receiverFruit.quantity < trade.receiverQuantity) {
          return { success: false, message: "Receiver doesn't have enough fruits" };
        }

        // Deduct fruits from sender with conditional update
        const senderUpdateResult = await tx
          .update(userFruits)
          .set({ quantity: sql`${userFruits.quantity} - ${trade.senderQuantity}` })
          .where(and(
            eq(userFruits.id, senderFruit.id),
            sql`${userFruits.quantity} >= ${trade.senderQuantity}`
          ))
          .returning();

        if (senderUpdateResult.length === 0) {
          return { success: false, message: "Sender insufficient fruits (race condition)" };
        }

        // Deduct fruits from receiver with conditional update
        const receiverUpdateResult = await tx
          .update(userFruits)
          .set({ quantity: sql`${userFruits.quantity} - ${trade.receiverQuantity}` })
          .where(and(
            eq(userFruits.id, receiverFruit.id),
            sql`${userFruits.quantity} >= ${trade.receiverQuantity}`
          ))
          .returning();

        if (receiverUpdateResult.length === 0) {
          return { success: false, message: "Receiver insufficient fruits (race condition)" };
        }

        // Clean up zero quantity entries
        await tx.delete(userFruits).where(and(eq(userFruits.quantity, 0)));

        // Give receiver fruits to sender
        const existingSenderReceiverFruit = await tx
          .select()
          .from(userFruits)
          .where(and(eq(userFruits.userId, trade.senderId), eq(userFruits.fruitId, trade.receiverFruitId)));

        if (existingSenderReceiverFruit.length > 0) {
          await tx
            .update(userFruits)
            .set({ quantity: sql`${userFruits.quantity} + ${trade.receiverQuantity}` })
            .where(eq(userFruits.id, existingSenderReceiverFruit[0].id));
        } else {
          await tx
            .insert(userFruits)
            .values({
              userId: trade.senderId,
              fruitId: trade.receiverFruitId,
              quantity: trade.receiverQuantity
            });
        }

        // Give sender fruits to receiver
        const existingReceiverSenderFruit = await tx
          .select()
          .from(userFruits)
          .where(and(eq(userFruits.userId, trade.receiverId), eq(userFruits.fruitId, trade.senderFruitId)));

        if (existingReceiverSenderFruit.length > 0) {
          await tx
            .update(userFruits)
            .set({ quantity: sql`${userFruits.quantity} + ${trade.senderQuantity}` })
            .where(eq(userFruits.id, existingReceiverSenderFruit[0].id));
        } else {
          await tx
            .insert(userFruits)
            .values({
              userId: trade.receiverId,
              fruitId: trade.senderFruitId,
              quantity: trade.senderQuantity
            });
        }

        // Update trade status to accepted
        await tx
          .update(tradeOffers)
          .set({ status: 'accepted', respondedAt: sql`NOW()` })
          .where(eq(tradeOffers.id, tradeId));

        return { success: true, message: "Trade completed successfully" };
      } catch (error) {
        console.error('Error in acceptTradeOfferWithTransfer:', error);
        return { success: false, message: "Transaction failed" };
      }
    });
  }
}

export const storage = new DatabaseStorage();
