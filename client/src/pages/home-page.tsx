import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { UserFruit } from "@shared/schema";
import { GameArea } from "@/components/game-area";
import { InventoryModal } from "@/components/inventory-modal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { generateRandomFruit } from "@/lib/fruit-data";
import { fruitDatabase } from "@/lib/fruit-data";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showInventory, setShowInventory] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [spawnedFruits, setSpawnedFruits] = useState<
    Array<{
      id: string;
      fruit: any;
      x: number;
      y: number;
      timestamp: number;
    }>
  >([]);

  const cooldownMs = 200;

  const { data: userFruits = [] } = useQuery<UserFruit[]>({
    queryKey: ["/api/fruits"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const addFruitMutation = useMutation({
    mutationFn: async (fruitId: string) => {
      const res = await apiRequest("POST", "/api/fruits", { fruitId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fruits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to collect fruit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFruitSpawn = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastClickTime < cooldownMs) {
      return;
    }

    setLastClickTime(now);
    const fruit = generateRandomFruit();

    const spawnedFruit = {
      id: Math.random().toString(36),
      fruit,
      x,
      y,
      timestamp: now,
    };

    setSpawnedFruits((prev) => [...prev, spawnedFruit]);
    addFruitMutation.mutate(fruit.id);

    // Remove spawned fruit after animation
    setTimeout(() => {
      setSpawnedFruits((prev) => prev.filter((f) => f.id !== spawnedFruit.id));
    }, 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        handleFruitSpawn(centerX, centerY);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lastClickTime]);

  const totalFruits = userFruits.reduce(
    (sum, fruit) => sum + (fruit.quantity || 0),
    0,
  );
  const rareCount = userFruits
    .filter((fruit: UserFruit) => {
      // Count rare, epic, and legendary fruits
      const fruitData = fruitDatabase.find((f: any) => f.id === fruit.fruitId);
      return (
        fruitData && ["rare", "epic", "legendary"].includes(fruitData.rarity)
      );
    })
    .reduce((sum, fruit) => sum + (fruit.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated Background Fruits */}
      <div className="fixed inset-0 z-0">
        <div
          className="fruit-bg"
          style={{ top: "10%", left: "5%", animationDelay: "0s" }}
        >
          🍎
        </div>
        <div
          className="fruit-bg"
          style={{ top: "20%", left: "80%", animationDelay: "0.5s" }}
        >
          🍌
        </div>
        <div
          className="fruit-bg"
          style={{ top: "60%", left: "15%", animationDelay: "1s" }}
        >
          🍊
        </div>
        <div
          className="fruit-bg"
          style={{ top: "80%", left: "70%", animationDelay: "1.5s" }}
        >
          🍇
        </div>
        <div
          className="fruit-bg"
          style={{ top: "30%", left: "90%", animationDelay: "2s" }}
        >
          🍓
        </div>
        <div
          className="fruit-bg"
          style={{ top: "50%", left: "5%", animationDelay: "2.5s" }}
        >
          🥝
        </div>
        <div
          className="fruit-bg"
          style={{ top: "70%", left: "85%", animationDelay: "3s" }}
        >
          🍑
        </div>
        <div
          className="fruit-bg"
          style={{ top: "15%", left: "60%", animationDelay: "3.5s" }}
        >
          🍍
        </div>
        <div
          className="fruit-bg"
          style={{ top: "90%", left: "30%", animationDelay: "4s" }}
        >
          🥭
        </div>
        <div
          className="fruit-bg"
          style={{ top: "40%", left: "45%", animationDelay: "4.5s" }}
        >
          🍈
        </div>
      </div>

      {/* Top Navigation */}
      <nav className="game-ui absolute top-0 left-0 right-0 z-50 p-4">
        <div className="glassmorphism rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary flex items-center">
              <span className="text-3xl mr-2">🍎</span>
              Fruit RNG
            </h1>
            <div className="text-sm text-muted-foreground">
              {user?.username || "Guest"}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <i className="fas fa-coins text-legendary"></i>
                <span data-testid="total-fruits">{totalFruits}</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-star text-epic"></i>
                <span data-testid="rare-count">{rareCount}</span>
              </div>
            </div>

            <Button
              onClick={() => setShowInventory(true)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              data-testid="button-inventory"
            >
              <i className="fas fa-backpack mr-2"></i>
              Inventory
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="destructive"
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Game Area */}
      <GameArea
        onFruitSpawn={handleFruitSpawn}
        spawnedFruits={spawnedFruits}
        cooldownMs={cooldownMs}
        lastClickTime={lastClickTime}
      />

      {/* Mobile Click Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          handleFruitSpawn(x, y);
        }}
        className="game-ui fixed bottom-6 right-6 w-16 h-16 bg-primary rounded-full shadow-xl text-2xl hover:bg-primary/80 transform hover:scale-110 animate-pulse-glow z-40 lg:hidden"
        data-testid="button-mobile-click"
      >
        🍎
      </Button>

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        userFruits={userFruits}
      />
    </div>
  );
}
