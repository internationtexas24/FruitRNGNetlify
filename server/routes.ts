import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserFruitSchema, insertMarketplaceListingSchema } from "@shared/schema";

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

  const httpServer = createServer(app);

  return httpServer;
}
