// Shared fruit utilities that can be used by both client and server

export interface Fruit {
  id: string;
  emoji: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  chance: number;
}

// Get sell price for a fruit based on its rarity
export const getFruitSellPrice = (rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): number => {
  // Price based on rarity (inversely related to chance)
  switch (rarity) {
    case 'common': return 5;
    case 'uncommon': return 15;
    case 'rare': return 50;
    case 'epic': return 200;
    case 'legendary': return 1000;
    default: return 1;
  }
};

// Get fruit data by ID - simplified for server use
export const getFruitRarity = (fruitId: string): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
  // Map fruit IDs to their rarity (simplified mapping for server-side use)
  const fruitRarityMap: Record<string, 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'> = {
    // Common fruits
    'apple': 'common',
    'pear': 'common',
    'melon': 'common',
    'watermelon': 'common',
    'tomato': 'common',
    'corn': 'common',
    'carrot': 'common',
    'potato': 'common',
    'peanuts': 'common',
    
    // Uncommon fruits
    'banana': 'uncommon',
    'orange': 'uncommon',
    'strawberry': 'uncommon',
    'lemon': 'uncommon',
    'coconut': 'uncommon',
    'eggplant': 'uncommon',
    'sweet-potato': 'uncommon',
    'chestnut': 'uncommon',
    
    // Rare fruits
    'grapes': 'rare',
    'kiwi': 'rare',
    'cherry': 'rare',
    'peach': 'rare',
    'avocado': 'rare',
    'mushroom': 'rare',
    'hot-pepper': 'rare',
    'bell-pepper': 'rare',
    'broccoli': 'rare',
    
    // Epic fruits
    'pineapple': 'epic',
    'mango': 'epic',
    
    // Legendary fruits
    'dragon-fruit': 'legendary'
  };
  
  return fruitRarityMap[fruitId] || 'common';
};