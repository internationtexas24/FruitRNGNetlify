import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserFruitSchema, insertMarketplaceListingSchema, insertTradeOfferSchema, purchaseAutoclickerSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get user's fruit inventory
  app.get("/api/fruits", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const fruits = await storage.getUserFruits(req.user!.id);
      res.json(fruits);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch fruits" });
    }
  });

  // Add a fruit to user's inventory
  app.post("/api/fruits", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { fruitId } = req.body;
      if (!fruitId) {
        return res.status(400).json({ message: "Fruit ID is required" });
      }

      const userFruit = await storage.incrementUserFruit(req.user!.id, fruitId);
      await storage.incrementTotalFruits(req.user!.id);
      
      res.json(userFruit);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to add fruit" });
    }
  });

  // Marketplace routes
  app.get("/api/marketplace", async (req, res) => {
    try {
      const listings = await storage.getMarketplaceListings();
      res.json(listings);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch marketplace listings" });
    }
  });

  app.post("/api/marketplace", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const listingData = insertMarketplaceListingSchema.parse({
        ...req.body,
        sellerId: req.user!.id,
      });
      
      const listing = await storage.createMarketplaceListing(listingData);
      res.json(listing);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid listing data", error: error.message });
    }
  });

  app.delete("/api/marketplace/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const listing = await storage.getMarketplaceListingById(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Only allow seller to delete their own listing
      if (listing.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this listing" });
      }

      await storage.deleteMarketplaceListing(id);
      res.json({ message: "Listing deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  app.post("/api/marketplace/:id/buy", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const result = await storage.buyMarketplaceListing(req.user!.id, id);
      res.json(result);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to purchase item" 
      });
    }
  });

  // Autoclicker shop routes
  app.get("/api/autoclickers", async (req, res) => {
    try {
      const autoclickers = await storage.getAutoclickers();
      res.json(autoclickers);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch autoclickers" });
    }
  });

  app.get("/api/user-autoclickers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userAutoclickers = await storage.getUserAutoclickers(req.user!.id);
      res.json(userAutoclickers);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch user autoclickers" });
    }
  });

  app.post("/api/autoclickers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const validatedData = purchaseAutoclickerSchema.parse(req.body);
      const result = await storage.purchaseAutoclickerWithCoins(req.user!.id, validatedData.autoclickerId);
      
      if (result.success) {
        res.status(200).json({ message: result.message });
      } else {
        // Map specific error messages to appropriate status codes
        if (result.message === 'Autoclicker not found') {
          res.status(404).json({ message: "Autoclicker not found" });
        } else if (result.message === 'Insufficient coins') {
          res.status(400).json({ message: "Insufficient coins to purchase autoclicker" });
        } else {
          res.status(400).json({ message: "Failed to purchase autoclicker" });
        }
      }
    } catch (error: any) {
      console.error('Autoclicker purchase failed:', error);
      res.status(400).json({ message: "Failed to purchase autoclicker" });
    }
  });

  // Trading routes
  app.get("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const trades = await storage.getTradeOffers(req.user!.id);
      res.json(trades);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch trade offers" });
    }
  });

  app.get("/api/trades/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const trade = await storage.getTradeOfferById(id);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade offer not found" });
      }

      // Only allow sender or receiver to view the trade
      if (trade.senderId !== req.user!.id && trade.receiverId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this trade" });
      }

      res.json(trade);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch trade offer" });
    }
  });

  app.post("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const tradeData = insertTradeOfferSchema.parse({
        ...req.body,
        senderId: req.user!.id,
      });

      // Prevent self-trading
      if (tradeData.senderId === tradeData.receiverId) {
        return res.status(400).json({ message: "Cannot trade with yourself" });
      }
      
      const trade = await storage.createTradeOffer(tradeData);
      res.status(201).json(trade);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create trade offer" });
    }
  });

  app.post("/api/trades/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const trade = await storage.getTradeOfferById(id);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade offer not found" });
      }

      // Only receiver can accept a trade
      if (trade.receiverId !== req.user!.id) {
        return res.status(403).json({ message: "Only the receiver can accept this trade" });
      }

      if (trade.status !== 'pending') {
        return res.status(400).json({ message: "Trade offer is no longer pending" });
      }

      // Use the transfer method to handle the full trade
      const result = await storage.acceptTradeOfferWithTransfer(id);
      res.json(result);
    } catch (error: any) {
      console.error('Accept trade failed:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to accept trade" 
      });
    }
  });

  app.post("/api/trades/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const trade = await storage.getTradeOfferById(id);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade offer not found" });
      }

      // Only receiver can reject a trade
      if (trade.receiverId !== req.user!.id) {
        return res.status(403).json({ message: "Only the receiver can reject this trade" });
      }

      if (trade.status !== 'pending') {
        return res.status(400).json({ message: "Trade offer is no longer pending" });
      }

      await storage.rejectTradeOffer(id);
      res.json({ success: true, message: "Trade offer rejected" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to reject trade offer" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
