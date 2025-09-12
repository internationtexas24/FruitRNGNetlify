import { useState } from 'react';
import { UserFruit } from '@shared/schema';
import { fruitDatabase, getRarityColor } from '@/lib/fruit-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFruits: UserFruit[];
}

type RarityFilter = 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export function InventoryModal({ isOpen, onClose, userFruits }: InventoryModalProps) {
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');

  // Create a map of user fruits for quick lookup
  const userFruitMap = new Map(userFruits.map(fruit => [fruit.fruitId, fruit.quantity]));

  // Filter fruits based on selected rarity and whether user has them
  const filteredFruits = fruitDatabase.filter(fruit => {
    const hasThis = userFruitMap.has(fruit.id);
    if (!hasThis) return false;
    if (selectedRarity === 'all') return true;
    return fruit.rarity === selectedRarity;
  });

  // Calculate stats by rarity
  const statsByRarity = {
    common: userFruits.filter(userFruit => {
      const fruit = fruitDatabase.find(f => f.id === userFruit.fruitId);
      return fruit?.rarity === 'common';
    }).reduce((sum, fruit) => sum + (fruit.quantity || 0), 0),
    uncommon: userFruits.filter(userFruit => {
      const fruit = fruitDatabase.find(f => f.id === userFruit.fruitId);
      return fruit?.rarity === 'uncommon';
    }).reduce((sum, fruit) => sum + (fruit.quantity || 0), 0),
    rare: userFruits.filter(userFruit => {
      const fruit = fruitDatabase.find(f => f.id === userFruit.fruitId);
      return fruit?.rarity === 'rare';
    }).reduce((sum, fruit) => sum + (fruit.quantity || 0), 0),
    epic: userFruits.filter(userFruit => {
      const fruit = fruitDatabase.find(f => f.id === userFruit.fruitId);
      return fruit?.rarity === 'epic';
    }).reduce((sum, fruit) => sum + (fruit.quantity || 0), 0),
    legendary: userFruits.filter(userFruit => {
      const fruit = fruitDatabase.find(f => f.id === userFruit.fruitId);
      return fruit?.rarity === 'legendary';
    }).reduce((sum, fruit) => sum + (fruit.quantity || 0), 0),
  };

  const totalFruits = Object.values(statsByRarity).reduce((sum, count) => sum + count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden glassmorphism border-border" data-testid="modal-inventory">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center">
            🎒 Your Fruit Collection
          </DialogTitle>
          <p className="text-muted-foreground" data-testid="text-collection-summary">
            {totalFruits} fruits collected across all rarities
          </p>
        </DialogHeader>

        {/* Rarity Filter Tabs */}
        <div className="border-b border-border pb-4">
          <div className="flex space-x-2 overflow-x-auto">
            <Button
              onClick={() => setSelectedRarity('all')}
              variant={selectedRarity === 'all' ? 'default' : 'ghost'}
              size="sm"
              data-testid="filter-all"
            >
              All ({totalFruits})
            </Button>
            <Button
              onClick={() => setSelectedRarity('common')}
              variant={selectedRarity === 'common' ? 'default' : 'ghost'}
              size="sm"
              data-testid="filter-common"
            >
              Common ({statsByRarity.common})
            </Button>
            <Button
              onClick={() => setSelectedRarity('uncommon')}
              variant={selectedRarity === 'uncommon' ? 'default' : 'ghost'}
              size="sm"
              data-testid="filter-uncommon"
            >
              Uncommon ({statsByRarity.uncommon})
            </Button>
            <Button
              onClick={() => setSelectedRarity('rare')}
              variant={selectedRarity === 'rare' ? 'default' : 'ghost'}
              size="sm"
              data-testid="filter-rare"
            >
              Rare ({statsByRarity.rare})
            </Button>
            <Button
              onClick={() => setSelectedRarity('epic')}
              variant={selectedRarity === 'epic' ? 'default' : 'ghost'}
              size="sm"
              data-testid="filter-epic"
            >
              Epic ({statsByRarity.epic})
            </Button>
            <Button
              onClick={() => setSelectedRarity('legendary')}
              variant={selectedRarity === 'legendary' ? 'default' : 'ghost'}
              size="sm"
              data-testid="filter-legendary"
            >
              Legendary ({statsByRarity.legendary})
            </Button>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="overflow-y-auto max-h-96">
          {filteredFruits.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-fruits">
              <p className="text-muted-foreground">
                No {selectedRarity === 'all' ? '' : selectedRarity} fruits collected yet!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {filteredFruits.map((fruit) => {
                const quantity = userFruitMap.get(fruit.id) || 0;
                return (
                  <div
                    key={fruit.id}
                    className={`bg-card rounded-lg p-3 border-2 rarity-${fruit.rarity} relative group cursor-pointer hover:scale-105 transition-transform`}
                    data-testid={`inventory-fruit-${fruit.id}`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{fruit.emoji}</div>
                      <div className={`text-xs font-medium text-${getRarityColor(fruit.rarity)}`}>
                        {fruit.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fruit.chance}%
                      </div>
                      {quantity > 0 && (
                        <Badge
                          className={`absolute -top-2 -right-2 bg-${getRarityColor(fruit.rarity)} text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold`}
                          data-testid={`fruit-quantity-${fruit.id}`}
                        >
                          {quantity}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div data-testid="stat-common">
              <div className="text-2xl font-bold text-common">{statsByRarity.common}</div>
              <div className="text-xs text-muted-foreground">Common</div>
            </div>
            <div data-testid="stat-uncommon">
              <div className="text-2xl font-bold text-uncommon">{statsByRarity.uncommon}</div>
              <div className="text-xs text-muted-foreground">Uncommon</div>
            </div>
            <div data-testid="stat-rare">
              <div className="text-2xl font-bold text-rare">{statsByRarity.rare}</div>
              <div className="text-xs text-muted-foreground">Rare</div>
            </div>
            <div data-testid="stat-epic">
              <div className="text-2xl font-bold text-epic">{statsByRarity.epic}</div>
              <div className="text-xs text-muted-foreground">Epic</div>
            </div>
            <div data-testid="stat-legendary">
              <div className="text-2xl font-bold text-legendary">{statsByRarity.legendary}</div>
              <div className="text-xs text-muted-foreground">Legendary</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
