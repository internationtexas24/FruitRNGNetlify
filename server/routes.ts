import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserFruitSchema } from "@shared/schema";

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

  const httpServer = createServer(app);

  return httpServer;
}
