import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { UserFruit } from "@shared/schema";
import { GameArea } from "@/components/game-area";
import { InventoryModal } from "@/components/inventory-modal";
import { MarketplaceModal } from "@/components/marketplace-modal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateRandomFruit } from "@/lib/fruit-data";
import { fruitDatabase } from "@/lib/fruit-data";
import { offlineStorage } from "@/lib/offline-storage";
import { Wifi, WifiOff, Coins, Zap, Play, Pause, RotateCcw, Package2, Store } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { 
    isOfflineMode, 
    setOfflineMode, 
    offlineUser, 
    offlineFruits, 
    offlineAutoclickers,
    addOfflineFruit,
    purchaseOfflineAutoclicker,
    resetOfflineGame,
    autoClickerActive,
    setAutoClickerActive
  } = useOfflineMode();
  
  const { toast } = useToast();
  const [showInventory, setShowInventory] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
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

  // Online mode queries
  const { data: userFruits = [] } = useQuery<UserFruit[]>({
    queryKey: ["/api/fruits"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !isOfflineMode && !!user, // Only fetch when online and authenticated
  });

  const { data: onlineAutoclickers = [] } = useQuery<any[]>({
    queryKey: ["/api/autoclickers"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user, // Fetch for both online and offline users
  });

  const { data: userAutoclickers = [] } = useQuery<any[]>({
    queryKey: ["/api/user-autoclickers"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !isOfflineMode && !!user, // Only fetch when online and authenticated
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

  const purchaseAutoclickerMutation = useMutation({
    mutationFn: async (autoclickerId: string) => {
      const res = await apiRequest("POST", "/api/autoclickers", { autoclickerId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-autoclickers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Purchase Successful!",
        description: "Autoclicker purchased successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get current user data based on mode
  const currentUser = isOfflineMode ? offlineUser : user;
  const currentFruits = isOfflineMode ? offlineFruits : userFruits;

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

    // Handle fruit collection based on mode
    if (isOfflineMode) {
      addOfflineFruit(fruit.id);
      toast({
        title: "Fruit collected!",
        description: `You found a ${fruit.name}! (+10 coins)`,
      });
    } else {
      addFruitMutation.mutate(fruit.id);
    }

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
  }, [lastClickTime, isOfflineMode]);

  const totalFruits = currentFruits.reduce(
    (sum, fruit) => sum + (fruit.quantity || 0),
    0,
  );
  
  const rareCount = currentFruits
    .filter((fruit: any) => {
      const fruitData = fruitDatabase.find((f: any) => f.id === fruit.fruitId);
      return (
        fruitData && ["rare", "epic", "legendary"].includes(fruitData.rarity)
      );
    })
    .reduce((sum, fruit) => sum + (fruit.quantity || 0), 0);

  const handleModeToggle = (offline: boolean) => {
    setOfflineMode(offline);
    if (offline) {
      toast({
        title: "Offline Mode Enabled",
        description: "You can now play without an internet connection!",
      });
    } else {
      toast({
        title: "Online Mode Enabled", 
        description: "Connected to online features and marketplace!",
      });
    }
  };

  const handleAutoclickerPurchase = (autoclickerId: string) => {
    if (isOfflineMode) {
      const result = purchaseOfflineAutoclicker(autoclickerId);
      toast({
        title: result.success ? "Purchase Successful!" : "Purchase Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } else {
      // Online mode - use the mutation
      purchaseAutoclickerMutation.mutate(autoclickerId);
    }
  };

  // Get autoclickers data based on mode
  const availableAutoclickers = isOfflineMode 
    ? offlineStorage.getAvailableAutoclickers() 
    : onlineAutoclickers;
  
  const currentUserAutoclickers = isOfflineMode 
    ? offlineAutoclickers 
    : userAutoclickers;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Mode Toggle Header */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOfflineMode ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {isOfflineMode ? "Offline Mode" : "Online Mode"}
              </span>
            </div>
            <Switch
              checked={isOfflineMode}
              onCheckedChange={handleModeToggle}
              data-testid="toggle-offline-mode"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {currentUser?.coins || 0} coins
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <Button
              onClick={() => setShowInventory(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              data-testid="button-inventory"
            >
              <Package2 className="h-4 w-4" />
              <span>Inventory</span>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button
              onClick={() => setShowMarketplace(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              data-testid="button-marketplace"
            >
              <Store className="h-4 w-4" />
              <span>Marketplace</span>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">
              {currentUser?.username || "Player"}
            </span>
          </div>
        </Card>

        {!isOfflineMode && (
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="outline"
            size="sm"
            data-testid="button-logout"
          >
            Logout
          </Button>
        )}
      </div>

      {/* Game Controls */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {isOfflineMode && (
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setAutoClickerActive(!autoClickerActive)}
                variant={autoClickerActive ? "default" : "outline"}
                size="sm"
                data-testid="toggle-autoclicker"
              >
                {autoClickerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                Auto-Clicker
              </Button>
              <Button
                onClick={resetOfflineGame}
                variant="outline"
                size="sm"
                data-testid="button-reset-game"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </Card>
        )}

        {/* Auto-clicker Shop - Now available for both modes */}
        <Card className="p-4 max-w-xs">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-sm">Auto-Clicker Shop</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            {availableAutoclickers.map((auto) => {
              const owned = currentUserAutoclickers.find(ua => ua.autoclickerId === auto.id);
              const canAfford = (currentUser?.coins || 0) >= auto.price;
              
              return (
                <div key={auto.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <span>{auto.emoji}</span>
                    <span className="font-medium">{auto.name}</span>
                    {owned && <Badge variant="secondary">{owned.quantity}</Badge>}
                  </div>
                  <Button
                    onClick={() => handleAutoclickerPurchase(auto.id)}
                    disabled={!canAfford}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2"
                    data-testid={`button-buy-autoclicker-${auto.id}`}
                  >
                    {auto.price}💰
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

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
          🍇
        </div>
        <div
          className="fruit-bg"
          style={{ top: "70%", left: "70%", animationDelay: "1.5s" }}
        >
          🍊
        </div>
        <div
          className="fruit-bg"
          style={{ top: "40%", left: "90%", animationDelay: "2s" }}
        >
          🍓
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10">
        <GameArea
          onFruitSpawn={handleFruitSpawn}
          spawnedFruits={spawnedFruits}
          totalFruits={totalFruits}
          rareCount={rareCount}
          onOpenInventory={() => setShowInventory(true)}
          isOfflineMode={isOfflineMode}
        />
      </div>

      {/* Inventory Modal */}
      <InventoryModal
        open={showInventory}
        onOpenChange={setShowInventory}
        fruits={currentFruits}
        isOfflineMode={isOfflineMode}
      />

      {/* Marketplace Modal */}
      <MarketplaceModal
        open={showMarketplace}
        onOpenChange={setShowMarketplace}
        userFruits={currentFruits}
        isOfflineMode={isOfflineMode}
      />

      {/* Game Instructions */}
      <div className="fixed bottom-4 left-4 z-50">
        <Card className="p-4 max-w-xs">
          <p className="text-sm text-muted-foreground">
            Click anywhere or press <kbd className="px-1 bg-muted rounded">Space</kbd> to collect fruits!
            {isOfflineMode && " Use auto-clickers to collect automatically!"}
          </p>
        </Card>
      </div>
    </div>
  );
}