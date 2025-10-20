export interface Fruit {
  id: string;
  emoji: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  chance: number;
}

export const fruitDatabase: Fruit[] = [
  // Common fruits (60% total)
  { id: "apple", emoji: "🍎", name: "Apple", rarity: "common", chance: 20 },
  { id: "pear", emoji: "🍐", name: "Pear", rarity: "common", chance: 18 },
  { id: "melon", emoji: "🍈", name: "Melon", rarity: "common", chance: 15 },
  {
    id: "watermelon",
    emoji: "🍉",
    name: "Watermelon",
    rarity: "common",
    chance: 7,
  },

  // Uncommon fruits (25% total)
  { id: "banana", emoji: "🍌", name: "Banana", rarity: "uncommon", chance: 8 },
  { id: "orange", emoji: "🍊", name: "Orange", rarity: "uncommon", chance: 7 },
  {
    id: "strawberry",
    emoji: "🍓",
    name: "Strawberry",
    rarity: "uncommon",
    chance: 6,
  },
  { id: "lemon", emoji: "🍋", name: "Lemon", rarity: "uncommon", chance: 4 },

  // Rare fruits (12% total)
  { id: "grapes", emoji: "🍇", name: "Grapes", rarity: "rare", chance: 4 },
  { id: "kiwi", emoji: "🥝", name: "Kiwi", rarity: "rare", chance: 3 },
  { id: "cherry", emoji: "🍑", name: "Cherry", rarity: "rare", chance: 3 },
  { id: "peach", emoji: "🍑", name: "Peach", rarity: "rare", chance: 2 },

  // Epic fruits (2.8% total)
  {
    id: "pineapple",
    emoji: "🍍",
    name: "Pineapple",
    rarity: "epic",
    chance: 1.5,
  },
  { id: "mango", emoji: "🥭", name: "Mango", rarity: "epic", chance: 1.3 },

  // Legendary fruits (0.2% total)
  {
    id: "dragon-fruit",
    emoji: "🐉",
    name: "Dragon Fruit",
    rarity: "legendary",
    chance: 0.2,
  },
  {
    id: "dragon-Lucky-Fruit",
    emoji: "🐉",
    name: "Dragon Lucky Fruit",
    rarity: "legendary",
    chance: 0.0000001,
  },

  // Additional fruits to reach 100
  {
    id: "coconut",
    emoji: "🥥",
    name: "Coconut",
    rarity: "uncommon",
    chance: 3,
  },
  { id: "avocado", emoji: "🥑", name: "Avocado", rarity: "rare", chance: 2 },
  { id: "tomato", emoji: "🍅", name: "Tomato", rarity: "common", chance: 5 },
  {
    id: "eggplant",
    emoji: "🍆",
    name: "Eggplant",
    rarity: "uncommon",
    chance: 2,
  },
  { id: "corn", emoji: "🌽", name: "Corn", rarity: "common", chance: 4 },
  { id: "carrot", emoji: "🥕", name: "Carrot", rarity: "common", chance: 4 },
  { id: "potato", emoji: "🥔", name: "Potato", rarity: "common", chance: 6 },
  {
    id: "sweet-potato",
    emoji: "🍠",
    name: "Sweet Potato",
    rarity: "uncommon",
    chance: 2,
  },
  { id: "mushroom", emoji: "🍄", name: "Mushroom", rarity: "rare", chance: 1 },
  {
    id: "chestnut",
    emoji: "🌰",
    name: "Chestnut",
    rarity: "uncommon",
    chance: 1.5,
  },
  { id: "peanuts", emoji: "🥜", name: "Peanuts", rarity: "common", chance: 3 },
  {
    id: "hot-pepper",
    emoji: "🌶️",
    name: "Hot Pepper",
    rarity: "rare",
    chance: 1.5,
  },
  {
    id: "bell-pepper",
    emoji: "🫑",
    name: "Bell Pepper",
    rarity: "uncommon",
    chance: 2,
  },
  {
    id: "cucumber",
    emoji: "🥒",
    name: "Cucumber",
    rarity: "common",
    chance: 3,
  },
  {
    id: "broccoli",
    emoji: "🥦",
    name: "Broccoli",
    rarity: "uncommon",
    chance: 1.8,
  },
  {
    id: "garlic",
    emoji: "🧄",
    name: "Garlic",
    rarity: "uncommon",
    chance: 1.7,
  },
  { id: "onion", emoji: "🧅", name: "Onion", rarity: "common", chance: 4 },
  { id: "bread", emoji: "🍞", name: "Bread", rarity: "common", chance: 5 },
  {
    id: "croissant",
    emoji: "🥐",
    name: "Croissant",
    rarity: "uncommon",
    chance: 2.5,
  },
  { id: "bagel", emoji: "🥯", name: "Bagel", rarity: "uncommon", chance: 2 },
  { id: "pretzel", emoji: "🥨", name: "Pretzel", rarity: "rare", chance: 1.2 },
  { id: "cheese", emoji: "🧀", name: "Cheese", rarity: "uncommon", chance: 3 },
  { id: "egg", emoji: "🥚", name: "Egg", rarity: "common", chance: 6 },
  { id: "bacon", emoji: "🥓", name: "Bacon", rarity: "rare", chance: 1.8 },
  { id: "steak", emoji: "🥩", name: "Steak", rarity: "epic", chance: 0.5 },
  {
    id: "chicken",
    emoji: "🍗",
    name: "Chicken",
    rarity: "uncommon",
    chance: 3.5,
  },
  { id: "turkey", emoji: "🦃", name: "Turkey", rarity: "rare", chance: 0.8 },
  { id: "ham", emoji: "🍖", name: "Ham", rarity: "uncommon", chance: 2.2 },
  { id: "hot-dog", emoji: "🌭", name: "Hot Dog", rarity: "common", chance: 4 },
  {
    id: "hamburger",
    emoji: "🍔",
    name: "Hamburger",
    rarity: "uncommon",
    chance: 3,
  },
  { id: "pizza", emoji: "🍕", name: "Pizza", rarity: "rare", chance: 2 },
  {
    id: "sandwich",
    emoji: "🥪",
    name: "Sandwich",
    rarity: "common",
    chance: 4,
  },
  { id: "taco", emoji: "🌮", name: "Taco", rarity: "uncommon", chance: 2.8 },
  {
    id: "burrito",
    emoji: "🌯",
    name: "Burrito",
    rarity: "uncommon",
    chance: 2.5,
  },
  { id: "pasta", emoji: "🍝", name: "Pasta", rarity: "common", chance: 3.5 },
  { id: "ramen", emoji: "🍜", name: "Ramen", rarity: "uncommon", chance: 2.3 },
  { id: "soup", emoji: "🍲", name: "Soup", rarity: "common", chance: 3 },
  { id: "salad", emoji: "🥗", name: "Salad", rarity: "uncommon", chance: 2.5 },
  { id: "popcorn", emoji: "🍿", name: "Popcorn", rarity: "common", chance: 3 },
  {
    id: "ice-cream",
    emoji: "🍦",
    name: "Ice Cream",
    rarity: "uncommon",
    chance: 2.8,
  },
  { id: "cake", emoji: "🍰", name: "Cake", rarity: "rare", chance: 1.5 },
  { id: "pie", emoji: "🥧", name: "Pie", rarity: "rare", chance: 1.3 },
  {
    id: "chocolate",
    emoji: "🍫",
    name: "Chocolate",
    rarity: "uncommon",
    chance: 3.2,
  },
  { id: "candy", emoji: "🍬", name: "Candy", rarity: "common", chance: 4 },
  {
    id: "lollipop",
    emoji: "🍭",
    name: "Lollipop",
    rarity: "common",
    chance: 3.5,
  },
  { id: "gummy", emoji: "🍱", name: "Gummy", rarity: "uncommon", chance: 2 },
  { id: "donut", emoji: "🍩", name: "Donut", rarity: "uncommon", chance: 2.5 },
  { id: "cookie", emoji: "🍪", name: "Cookie", rarity: "common", chance: 3.8 },
  { id: "honey", emoji: "🍯", name: "Honey", rarity: "rare", chance: 1.2 },
  { id: "milk", emoji: "🥛", name: "Milk", rarity: "common", chance: 4.5 },
  {
    id: "coffee",
    emoji: "☕",
    name: "Coffee",
    rarity: "uncommon",
    chance: 3.5,
  },
  { id: "tea", emoji: "🍵", name: "Tea", rarity: "uncommon", chance: 3 },
  { id: "wine", emoji: "🍷", name: "Wine", rarity: "epic", chance: 0.8 },
  { id: "beer", emoji: "🍺", name: "Beer", rarity: "rare", chance: 2 },
  {
    id: "cocktail",
    emoji: "🍸",
    name: "Cocktail",
    rarity: "epic",
    chance: 0.7,
  },
  { id: "juice", emoji: "🧃", name: "Juice", rarity: "common", chance: 4.2 },
  { id: "soda", emoji: "🥤", name: "Soda", rarity: "common", chance: 4.8 },
  { id: "rice", emoji: "🍚", name: "Rice", rarity: "common", chance: 5 },
  { id: "bento", emoji: "🍱", name: "Bento", rarity: "rare", chance: 1 },
  { id: "sushi", emoji: "🍣", name: "Sushi", rarity: "epic", chance: 1.2 },
  { id: "fish", emoji: "🐟", name: "Fish", rarity: "uncommon", chance: 2.8 },
  { id: "shrimp", emoji: "🍤", name: "Shrimp", rarity: "rare", chance: 1.5 },
  { id: "oyster", emoji: "🦪", name: "Oyster", rarity: "epic", chance: 0.3 },
  { id: "crab", emoji: "🦀", name: "Crab", rarity: "rare", chance: 0.9 },
  { id: "lobster", emoji: "🦞", name: "Lobster", rarity: "epic", chance: 0.4 },
  { id: "squid", emoji: "🦑", name: "Squid", rarity: "rare", chance: 0.7 },
  { id: "octopus", emoji: "🐙", name: "Octopus", rarity: "rare", chance: 0.6 },
  { id: "clam", emoji: "🦪", name: "Clam", rarity: "uncommon", chance: 1.8 },
  {
    id: "seaweed",
    emoji: "🌿",
    name: "Seaweed",
    rarity: "uncommon",
    chance: 2,
  },
  { id: "kelp", emoji: "🌾", name: "Kelp", rarity: "rare", chance: 0.8 },
  { id: "algae", emoji: "🦠", name: "Algae", rarity: "common", chance: 3 },
  {
    id: "plankton",
    emoji: "🦠",
    name: "Plankton",
    rarity: "uncommon",
    chance: 1.5,
  },
  { id: "coral", emoji: "🪸", name: "Coral", rarity: "epic", chance: 0.2 },
  {
    id: "pearl",
    emoji: "🫧",
    name: "Pearl",
    rarity: "legendary",
    chance: 0.05,
  },
  {
    id: "gold-apple",
    emoji: "🍎",
    name: "Golden Apple",
    rarity: "legendary",
    chance: 0.03,
  },
  {
    id: "diamond-fruit",
    emoji: "💎",
    name: "Diamond Fruit",
    rarity: "legendary",
    chance: 0.01,
  },
  {
    id: "star-fruit",
    emoji: "⭐",
    name: "Star Fruit",
    rarity: "legendary",
    chance: 0.02,
  },
  {
    id: "moon-fruit",
    emoji: "🌙",
    name: "Moon Fruit",
    rarity: "legendary",
    chance: 0.015,
  },
  {
    id: "sun-fruit",
    emoji: "☀️",
    name: "Sun Fruit",
    rarity: "legendary",
    chance: 0.01,
  },
  {
    id: "rainbow-fruit",
    emoji: "🌈",
    name: "Rainbow Fruit",
    rarity: "legendary",
    chance: 0.005,
  },
  {
    id: "crystal-fruit",
    emoji: "💠",
    name: "Crystal Fruit",
    rarity: "legendary",
    chance: 0.008,
  },
  {
    id: "cosmic-fruit",
    emoji: "🌌",
    name: "Cosmic Fruit",
    rarity: "legendary",
    chance: 0.003,
  },
  {
    id: "void-fruit",
    emoji: "🕳️",
    name: "Void Fruit",
    rarity: "legendary",
    chance: 0.002,
  },
  {
    id: "time-fruit",
    emoji: "⏰",
    name: "Time Fruit",
    rarity: "legendary",
    chance: 0.001,
  },
];

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case "common":
      return "common";
    case "uncommon":
      return "uncommon";
    case "rare":
      return "rare";
    case "epic":
      return "epic";
    case "legendary":
      return "legendary";
    default:
      return "common";
  }
};

export const generateRandomFruit = (): Fruit => {
  const random = Math.random() * 100;
  let cumulativeChance = 0;

  for (const fruit of fruitDatabase) {
    cumulativeChance += fruit.chance;
    if (random <= cumulativeChance) {
      return fruit;
    }
  }
  return fruitDatabase[0]; // Fallback
};

// Get sell price for a fruit based on its rarity
export const getFruitSellPrice = (fruitId: string): number => {
  const fruit = fruitDatabase.find((f) => f.id === fruitId);
  if (!fruit) return 1;

  // Price based on rarity (inversely related to chance)
  switch (fruit.rarity) {
    case "common":
      return 5;
    case "uncommon":
      return 15;
    case "rare":
      return 50;
    case "epic":
      return 200;
    case "legendary":
      return 1000;
    default:
      return 1;
  }
};
