// Offline storage system using localStorage for game data persistence
import { UserFruit, User, MarketplaceListing, Autoclicker, UserAutoclicker, TradeOffer } from "@shared/schema";

export interface OfflineGameData {
  user: {
    id: string;
    username: string;
    totalFruits: number;
    coins: number;
    email: string;
  };
  fruits: Array<{
    id: string;
    fruitId: string;
    quantity: number;
    firstObtained: string;
  }>;
  autoclickers: Array<{
    id: string;
    autoclickerId: string;
    quantity: number;
    lastClicked: string;
    purchasedAt: string;
  }>;
  marketplaceListings: Array<{
    id: string;
    sellerId: string;
    fruitId: string;
    quantity: number;
    pricePerUnit: number;
    createdAt: string;
  }>;
  gameSettings: {
    lastSaved: string;
    autoClickerActive: boolean;
  };
}

const STORAGE_KEY = 'fruit-game-offline-data';
const DEFAULT_AUTOCLICKERS = [
  {
    id: 'auto-1',
    name: 'Basic Clicker',
    description: 'Clicks 1 time per second',
    price: 100,
    clicksPerSecond: 1,
    emoji: '👆'
  },
  {
    id: 'auto-2', 
    name: 'Fast Clicker',
    description: 'Clicks 3 times per second',
    price: 500,
    clicksPerSecond: 3,
    emoji: '⚡'
  },
  {
    id: 'auto-3',
    name: 'Super Clicker', 
    description: 'Clicks 5 times per second',
    price: 1500,
    clicksPerSecond: 5,
    emoji: '🚀'
  },
  {
    id: 'auto-4',
    name: 'Ultimate Clicker',
    description: 'The best autoclicker - clicks 10 times per second!',
    price: 5000,
    clicksPerSecond: 10,
    emoji: '💎'
  }
];

class OfflineStorageManager {
  private data: OfflineGameData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): OfflineGameData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to load offline data, creating new game');
      }
    }
    
    return this.createNewGame();
  }

  private createNewGame(): OfflineGameData {
    return {
      user: {
        id: 'offline-user',
        username: 'Offline Player',
        totalFruits: 0,
        coins: 0,
        email: 'offline@game.local'
      },
      fruits: [],
      autoclickers: [],
      marketplaceListings: [],
      gameSettings: {
        lastSaved: new Date().toISOString(),
        autoClickerActive: false
      }
    };
  }

  private saveData(): void {
    this.data.gameSettings.lastSaved = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  // User operations
  getUser(): OfflineGameData['user'] {
    return this.data.user;
  }

  updateUserCoins(amount: number): void {
    this.data.user.coins = Math.max(0, this.data.user.coins + amount);
    this.saveData();
  }

  // Fruit operations
  getUserFruits(): OfflineGameData['fruits'] {
    return this.data.fruits;
  }

  addFruit(fruitId: string): void {
    const existingFruit = this.data.fruits.find(f => f.fruitId === fruitId);
    
    if (existingFruit) {
      existingFruit.quantity += 1;
    } else {
      this.data.fruits.push({
        id: `fruit-${Date.now()}-${Math.random()}`,
        fruitId,
        quantity: 1,
        firstObtained: new Date().toISOString()
      });
    }
    
    this.data.user.totalFruits += 1;
    // Give coins for collecting fruits
    this.data.user.coins += 10;
    this.saveData();
  }

  removeFruit(fruitId: string, quantity: number): boolean {
    const fruitIndex = this.data.fruits.findIndex(f => f.fruitId === fruitId);
    if (fruitIndex === -1) return false;
    
    const fruit = this.data.fruits[fruitIndex];
    if (fruit.quantity < quantity) return false;
    
    fruit.quantity -= quantity;
    if (fruit.quantity <= 0) {
      this.data.fruits.splice(fruitIndex, 1);
    }
    
    this.saveData();
    return true;
  }

  // Autoclicker operations
  getAvailableAutoclickers(): Array<Autoclicker> {
    return DEFAULT_AUTOCLICKERS;
  }

  getUserAutoclickers(): OfflineGameData['autoclickers'] {
    return this.data.autoclickers;
  }

  purchaseAutoclicker(autoclickerId: string): { success: boolean; message: string } {
    const autoclicker = DEFAULT_AUTOCLICKERS.find(a => a.id === autoclickerId);
    if (!autoclicker) {
      return { success: false, message: 'Autoclicker not found' };
    }

    if (this.data.user.coins < autoclicker.price) {
      return { success: false, message: 'Insufficient coins' };
    }

    const existing = this.data.autoclickers.find(a => a.autoclickerId === autoclickerId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.data.autoclickers.push({
        id: `user-auto-${Date.now()}`,
        autoclickerId,
        quantity: 1,
        lastClicked: new Date().toISOString(),
        purchasedAt: new Date().toISOString()
      });
    }

    this.data.user.coins -= autoclicker.price;
    this.saveData();
    return { success: true, message: 'Autoclicker purchased successfully!' };
  }

  // Marketplace operations (simplified for offline)
  getMarketplaceListings(): OfflineGameData['marketplaceListings'] {
    // In offline mode, show some sample listings from "other players"
    return [
      {
        id: 'sample-1',
        sellerId: 'other-player-1',
        fruitId: 'apple',
        quantity: 5,
        pricePerUnit: 15,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sample-2', 
        sellerId: 'other-player-2',
        fruitId: 'banana',
        quantity: 3,
        pricePerUnit: 20,
        createdAt: new Date().toISOString()
      }
    ];
  }

  // Auto-clicker functionality
  processAutoClickers(): number {
    let totalClicks = 0;
    const now = new Date().toISOString();
    
    this.data.autoclickers.forEach(userAuto => {
      const autoclicker = DEFAULT_AUTOCLICKERS.find(a => a.id === userAuto.autoclickerId);
      if (autoclicker) {
        totalClicks += autoclicker.clicksPerSecond * userAuto.quantity;
        userAuto.lastClicked = now;
      }
    });

    if (totalClicks > 0) {
      this.saveData();
    }
    
    return totalClicks;
  }

  // Reset game data
  resetGame(): void {
    this.data = this.createNewGame();
    this.saveData();
  }

  // Import/export for backup
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importData(dataString: string): boolean {
    try {
      const imported = JSON.parse(dataString);
      this.data = imported;
      this.saveData();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();