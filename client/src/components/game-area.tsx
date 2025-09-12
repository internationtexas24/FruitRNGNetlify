import { getRarityColor } from '@/lib/fruit-data';

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
  cooldownMs: number;
  lastClickTime: number;
}

export function GameArea({ onFruitSpawn, spawnedFruits, cooldownMs, lastClickTime }: GameAreaProps) {
  const now = Date.now();
  const timeUntilNext = Math.max(0, cooldownMs - (now - lastClickTime));
  const isReady = timeUntilNext === 0;

  const handleClick = (e: React.MouseEvent) => {
    onFruitSpawn(e.clientX, e.clientY);
  };

  return (
    <div 
      className="click-area absolute inset-0 flex items-center justify-center"
      onClick={handleClick}
      data-testid="game-area"
    >
      {/* Click Instructions */}
      <div className="text-center z-20 pointer-events-none">
        <div className="glassmorphism rounded-xl p-6 mb-4 inline-block">
          <h2 className="text-3xl font-bold mb-2" data-testid="text-instructions">
            🎯 Click anywhere or press SPACE!
          </h2>
          <p className="text-muted-foreground">Discover rare fruits with every click</p>
        </div>
        <div className="glassmorphism rounded-lg p-3 inline-block">
          <p className="text-sm" data-testid="text-cooldown">
            Next fruit in: 
            <span className={`font-bold ml-1 ${isReady ? 'text-primary' : 'text-muted-foreground'}`}>
              {isReady ? 'Ready!' : `${(timeUntilNext / 1000).toFixed(1)}s`}
            </span>
          </p>
        </div>
      </div>

      {/* Spawned Fruits Container */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {spawnedFruits.map((spawnedFruit) => (
          <div
            key={spawnedFruit.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: spawnedFruit.x, 
              top: spawnedFruit.y 
            }}
            data-testid={`spawned-fruit-${spawnedFruit.fruit.id}`}
          >
            <div className={`bg-card border-2 rarity-${spawnedFruit.fruit.rarity} rounded-lg p-3 animate-fruit-spawn z-40`}>
              <div className="text-center">
                <div className="text-4xl mb-2">{spawnedFruit.fruit.emoji}</div>
                <div className={`text-sm font-bold text-${getRarityColor(spawnedFruit.fruit.rarity)}`}>
                  {spawnedFruit.fruit.name}
                </div>
                <div className="text-xs text-muted-foreground">
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
