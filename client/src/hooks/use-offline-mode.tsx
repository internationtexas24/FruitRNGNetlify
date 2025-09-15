import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { offlineStorage, OfflineGameData } from "@/lib/offline-storage";
import { generateRandomFruit } from "@/lib/fruit-data";

type OfflineModeContextType = {
  isOfflineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  offlineUser: OfflineGameData['user'];
  offlineFruits: OfflineGameData['fruits'];
  offlineAutoclickers: OfflineGameData['autoclickers'];
  
  // Offline game actions
  addOfflineFruit: (fruitId: string) => void;
  purchaseOfflineAutoclicker: (autoclickerId: string) => { success: boolean; message: string };
  processAutoClickers: () => number;
  resetOfflineGame: () => void;
  
  // Auto-clicker state
  autoClickerActive: boolean;
  setAutoClickerActive: (active: boolean) => void;
};

export const OfflineModeContext = createContext<OfflineModeContextType | null>(null);

export function OfflineModeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('offline-mode') === 'true';
    }
    return false;
  });
  const [offlineUser, setOfflineUser] = useState(offlineStorage.getUser());
  const [offlineFruits, setOfflineFruits] = useState(offlineStorage.getUserFruits());
  const [offlineAutoclickers, setOfflineAutoclickers] = useState(offlineStorage.getUserAutoclickers());
  const [autoClickerActive, setAutoClickerActive] = useState(false);

  // Auto-clicker effect
  useEffect(() => {
    if (!isOfflineMode || !autoClickerActive) return;

    const interval = setInterval(() => {
      const clicksGenerated = offlineStorage.processAutoClickers();
      if (clicksGenerated > 0) {
        // Generate random fruits based on auto-clicker performance
        for (let i = 0; i < clicksGenerated; i++) {
          const randomFruit = generateRandomFruit();
          offlineStorage.addFruit(randomFruit.id);
        }
        // Refresh the state
        refreshOfflineData();
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isOfflineMode, autoClickerActive]);

  const refreshOfflineData = () => {
    setOfflineUser(offlineStorage.getUser());
    setOfflineFruits(offlineStorage.getUserFruits());
    setOfflineAutoclickers(offlineStorage.getUserAutoclickers());
  };

  const setOfflineMode = (offline: boolean) => {
    setIsOfflineMode(offline);
    // Persist to localStorage
    localStorage.setItem('offline-mode', offline.toString());
    if (offline) {
      refreshOfflineData();
    }
  };

  const addOfflineFruit = (fruitId: string) => {
    offlineStorage.addFruit(fruitId);
    refreshOfflineData();
  };

  const purchaseOfflineAutoclicker = (autoclickerId: string): { success: boolean; message: string } => {
    const result = offlineStorage.purchaseAutoclicker(autoclickerId);
    if (result.success) {
      refreshOfflineData();
    }
    return result;
  };

  const processAutoClickers = (): number => {
    return offlineStorage.processAutoClickers();
  };

  const resetOfflineGame = () => {
    offlineStorage.resetGame();
    refreshOfflineData();
    setAutoClickerActive(false);
  };

  return (
    <OfflineModeContext.Provider
      value={{
        isOfflineMode,
        setOfflineMode,
        offlineUser,
        offlineFruits,
        offlineAutoclickers,
        addOfflineFruit,
        purchaseOfflineAutoclicker,
        processAutoClickers,
        resetOfflineGame,
        autoClickerActive,
        setAutoClickerActive,
      }}
    >
      {children}
    </OfflineModeContext.Provider>
  );
}

export function useOfflineMode() {
  const context = useContext(OfflineModeContext);
  if (!context) {
    throw new Error("useOfflineMode must be used within an OfflineModeProvider");
  }
  return context;
}