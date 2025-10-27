import { getRarityColor } from "@/lib/fruit-data";
import { useEffect, useState } from "react";

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  tx: number;
  ty: number;
}

interface SpawnedFruit {
  id: string;
  fruit: any;
  x: number;
  y: number;
  timestamp: number;
}

interface GameAreaProps {
  onFruitSpawn: (x: number, y: number) => void;
  spawnedFruits: SpawnedFruit[];
  cooldownMs?: number;
  lastClickTime?: number;
  totalFruits?: number;
  rareCount?: number;
  onOpenInventory?: () => void;
  isOfflineMode?: boolean;
}

export function GameArea({
  onFruitSpawn,
  spawnedFruits,
  cooldownMs = 200,
  lastClickTime = 0,
  totalFruits = 0,
  rareCount = 0,
  onOpenInventory,
  isOfflineMode = false,
}: GameAreaProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const now = Date.now();
  const timeUntilNext = Math.max(0, cooldownMs - (now - lastClickTime));
  const isReady = timeUntilNext === 0;

  const handleClick = (e: React.MouseEvent) => {
    // Only spawn fruit if cooldown is ready
    if (!isReady) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    // Generate random position within the game area
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    onFruitSpawn(x, y);

    // Create particle burst
    createParticleBurst(e.clientX - rect.left, e.clientY - rect.top);
  };

  const createParticleBurst = (x: number, y: number) => {
    const colors = ['#ff0080', '#ff8c00', '#ffff00', '#00ff88', '#00b8ff', '#8000ff'];
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const velocity = 100 + Math.random() * 50;
      newParticles.push({
        id: `${Date.now()}-${i}`,
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        tx: Math.cos(angle) * velocity,
        ty: Math.sin(angle) * velocity,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  useEffect(() => {
    spawnedFruits.forEach(fruit => {
      createParticleBurst(fruit.x, fruit.y);
    });
  }, [spawnedFruits.length]);

  return (
    <div
      className="click-area absolute inset-0 flex items-center justify-center"
      onClick={handleClick}
      data-testid="game-area"
    >
      {/* Click Instructions */}
      <div className="text-center z-20 pointer-events-none">
        <div className="glassmorphism rounded-xl p-6 mb-4 inline-block">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ animation: 'rainbow-text 2s linear infinite' }}
            data-testid="text-instructions"
          >
            🎯 Click anywhere or press SPACE!
          </h2>
          <p className="text-muted-foreground" style={{ animation: 'rainbow-text 3s linear infinite' }}>
            Discover rare fruits with every click
          </p>
        </div>
        <div className="glassmorphism rounded-lg p-3 inline-block">
          <p className="text-sm" data-testid="text-cooldown" style={{ animation: 'rainbow-text 3s linear infinite' }}>
            Next fruit in:
            <span
              className={`font-bold ml-1 ${isReady ? "text-primary" : "text-muted-foreground"}`}
              style={{ animation: 'rainbow-text 2s linear infinite' }}
            >
              {isReady ? "Ready!" : `${(timeUntilNext / 1000).toFixed(1)}s`}
            </span>
          </p>
        </div>
      </div>

      {/* Spawned Fruits Container */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {/* Particle effects */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
              animation: 'particle-burst 1s ease-out forwards',
              '--tx': `${particle.tx}px`,
              '--ty': `${particle.ty}px`,
            } as React.CSSProperties}
          />
        ))}
        
        {spawnedFruits.map((spawnedFruit) => (
          <div
            key={spawnedFruit.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: spawnedFruit.x,
              top: spawnedFruit.y,
            }}
            data-testid={`spawned-fruit-${spawnedFruit.fruit.id}`}
          >
            <div
              className={`bg-card border-4 rarity-${spawnedFruit.fruit.rarity} rounded-lg p-3 animate-fruit-spawn z-40`}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.3), rgba(255, 200, 0, 0.3), rgba(0, 255, 128, 0.3), rgba(0, 128, 255, 0.3), rgba(200, 0, 255, 0.3))',
                backgroundSize: '400% 400%',
                animation: 'rainbow-bg 3s ease infinite, fruit-spawn 0.8s ease-out, rainbow-glow 2s ease-in-out infinite'
              }}
            >
              <div className="text-center">
                <div className="text-5xl mb-2" style={{ 
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 20px currentColor)',
                  animation: 'rainbow-text 3s linear infinite'
                }}>{spawnedFruit.fruit.emoji}</div>
                <div
                  className={`text-sm font-bold`}
                  style={{ animation: 'rainbow-text 2s linear infinite' }}
                >
                  {spawnedFruit.fruit.name}
                </div>
                <div className="text-xs" style={{ animation: 'rainbow-text 3s linear infinite' }}>
                  {spawnedFruit.fruit.chance}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
