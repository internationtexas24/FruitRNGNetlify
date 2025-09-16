import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserFruit, MarketplaceListing } from '@shared/schema';
import { fruitDatabase, getRarityColor } from '@/lib/fruit-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingCart, Store, Coins, Package, User, Clock } from 'lucide-react';

interface MarketplaceModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  userFruits?: UserFruit[];
  isOfflineMode?: boolean;
}

// Extended marketplace listing type with seller info
interface MarketplaceListingWithSeller extends MarketplaceListing {
  sellerName?: string;
}

// Form schema for creating listings
const createListingSchema = z.object({
  fruitId: z.string().min(1, "Please select a fruit"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  pricePerUnit: z.coerce.number().min(1, "Price must be at least 1 coin"),
});

type CreateListingForm = z.infer<typeof createListingSchema>;

// Static class maps to avoid dynamic Tailwind classes
const rarityBadgeClasses = {
  common: 'bg-gray-500 text-white',
  uncommon: 'bg-green-500 text-white',
  rare: 'bg-blue-500 text-white',
  epic: 'bg-purple-500 text-white',
  legendary: 'bg-yellow-500 text-white',
};

const rarityBorderClasses = {
  common: 'border-gray-300',
  uncommon: 'border-green-300', 
  rare: 'border-blue-300',
  epic: 'border-purple-300',
  legendary: 'border-yellow-300',
};

export function MarketplaceModal({ 
  open, 
  onOpenChange, 
  isOpen, 
  onClose, 
  userFruits = [],
  isOfflineMode = false 
}: MarketplaceModalProps) {
  // Handle both prop patterns
  const modalOpen = open ?? isOpen ?? false;
  const handleOpenChange = onOpenChange ?? ((open: boolean) => !open && onClose?.());
  const { toast } = useToast();

  // Queries for marketplace data
  const { data: marketplaceListings = [], isLoading: listingsLoading } = useQuery<MarketplaceListingWithSeller[]>({
    queryKey: ["/api/marketplace"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !isOfflineMode && modalOpen,
  });

  // Create listing form
  const form = useForm<CreateListingForm>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      fruitId: "",
      quantity: 1,
      pricePerUnit: 10,
    },
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const res = await apiRequest("POST", `/api/marketplace/${listingId}/buy`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fruits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Purchase Successful!",
        description: "The item has been added to your inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to complete the purchase.",
        variant: "destructive",
      });
    },
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (data: CreateListingForm) => {
      const res = await apiRequest("POST", "/api/marketplace", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fruits"] });
      form.reset();
      toast({
        title: "Listing Created!",
        description: "Your item is now available in the marketplace.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Listing Failed",
        description: error.message || "Unable to create the listing.",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (listingId: string) => {
    purchaseMutation.mutate(listingId);
  };

  const handleCreateListing = (data: CreateListingForm) => {
    createListingMutation.mutate(data);
  };

  // Get fruit data for listings
  const getListingFruitData = (fruitId: string) => {
    return fruitDatabase.find(f => f.id === fruitId);
  };

  // Get user's fruit quantity
  const getUserFruitQuantity = (fruitId: string) => {
    const userFruit = userFruits.find(f => f.fruitId === fruitId);
    return userFruit?.quantity || 0;
  };

  // Filter sellable fruits (user has quantity > 0)
  const sellableFruits = userFruits.filter(userFruit => (userFruit.quantity || 0) > 0);

  if (isOfflineMode) {
    return (
      <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="modal-marketplace">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Store className="mr-2 h-6 w-6" />
              Marketplace
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Marketplace Unavailable</p>
            <p className="text-muted-foreground">
              The marketplace requires an internet connection. Switch to online mode to trade with other players!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden" data-testid="modal-marketplace">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Store className="mr-2 h-6 w-6" />
            Marketplace
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Buy and sell fruits with other players
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="buy" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="flex items-center" data-testid="tab-buy">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Items
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center" data-testid="tab-sell">
              <Package className="mr-2 h-4 w-4" />
              Sell Items
            </TabsTrigger>
          </TabsList>

          {/* Buy Items Tab */}
          <TabsContent value="buy" className="flex-1 overflow-hidden">
            <div className="h-96 overflow-hidden">
              <ScrollArea className="h-full">
                {listingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Skeleton className="h-12 w-12 rounded-lg" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </div>
                            <Skeleton className="h-9 w-20" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : marketplaceListings.length === 0 ? (
                  <div className="text-center py-8" data-testid="text-no-listings">
                    <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No Items Available</p>
                    <p className="text-muted-foreground">
                      No one is selling items right now. Check back later or be the first to create a listing!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {marketplaceListings.map((listing) => {
                      const fruitData = getListingFruitData(listing.fruitId);
                      if (!fruitData) return null;

                      const totalPrice = listing.pricePerUnit * listing.quantity;
                      const isExpensive = totalPrice > 1000; // Highlight expensive items

                      return (
                        <Card 
                          key={listing.id} 
                          className={`transition-all hover:shadow-md ${isExpensive ? 'border-yellow-200 dark:border-yellow-800' : ''}`}
                          data-testid={`listing-${listing.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-lg border-2 ${rarityBorderClasses[fruitData.rarity as keyof typeof rarityBorderClasses]} bg-card`}>
                                  <div className="text-2xl">{fruitData.emoji}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium">{fruitData.name}</h3>
                                    <Badge 
                                      className={rarityBadgeClasses[fruitData.rarity as keyof typeof rarityBadgeClasses]}
                                      data-testid={`badge-rarity-${listing.id}`}
                                    >
                                      {fruitData.rarity}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                      <Package className="mr-1 h-3 w-3" />
                                      <span data-testid={`quantity-${listing.id}`}>{listing.quantity}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Coins className="mr-1 h-3 w-3" />
                                      <span data-testid={`price-${listing.id}`}>{listing.pricePerUnit} each</span>
                                    </div>
                                    <div className="flex items-center">
                                      <User className="mr-1 h-3 w-3" />
                                      <span data-testid={`seller-${listing.id}`}>
                                        {listing.sellerName || 'Anonymous'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <div className="text-lg font-bold flex items-center justify-end">
                                  <Coins className="mr-1 h-4 w-4 text-yellow-500" />
                                  <span data-testid={`total-price-${listing.id}`}>{totalPrice}</span>
                                </div>
                                <Button
                                  onClick={() => handlePurchase(listing.id)}
                                  disabled={purchaseMutation.isPending}
                                  className="w-full"
                                  data-testid={`button-buy-${listing.id}`}
                                >
                                  {purchaseMutation.isPending ? "Buying..." : "Buy Now"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Sell Items Tab */}
          <TabsContent value="sell" className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
              {/* Create Listing Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Create Listing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateListing)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fruitId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fruit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-fruit">
                                  <SelectValue placeholder="Select a fruit to sell" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sellableFruits.map((userFruit) => {
                                  const fruitData = getListingFruitData(userFruit.fruitId);
                                  if (!fruitData) return null;
                                  
                                  return (
                                    <SelectItem 
                                      key={userFruit.fruitId} 
                                      value={userFruit.fruitId}
                                      data-testid={`option-fruit-${userFruit.fruitId}`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <span>{fruitData.emoji}</span>
                                        <span>{fruitData.name}</span>
                                        <Badge variant="secondary">
                                          {userFruit.quantity || 0} available
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max={form.watch("fruitId") ? getUserFruitQuantity(form.watch("fruitId")) : 999}
                                placeholder="How many to sell"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pricePerUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Unit (coins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Price per fruit"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("quantity") && form.watch("pricePerUnit") && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span>Total listing value:</span>
                            <div className="flex items-center font-medium">
                              <Coins className="mr-1 h-3 w-3 text-yellow-500" />
                              <span data-testid="text-total-value">
                                {(form.watch("quantity") || 0) * (form.watch("pricePerUnit") || 0)} coins
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={createListingMutation.isPending || sellableFruits.length === 0}
                        className="w-full"
                        data-testid="button-create-listing"
                      >
                        {createListingMutation.isPending ? "Creating..." : "Create Listing"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* User Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Your Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {sellableFruits.length === 0 ? (
                      <div className="text-center py-8" data-testid="text-no-sellable">
                        <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No fruits available to sell. Collect some fruits first!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sellableFruits.map((userFruit) => {
                          const fruitData = getListingFruitData(userFruit.fruitId);
                          if (!fruitData) return null;

                          return (
                            <div 
                              key={userFruit.fruitId}
                              className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                              data-testid={`inventory-fruit-${userFruit.fruitId}`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="text-lg">{fruitData.emoji}</div>
                                <div>
                                  <div className="font-medium text-sm">{fruitData.name}</div>
                                  <div className={`text-xs text-${getRarityColor(fruitData.rarity)}`}>
                                    {fruitData.rarity}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" data-testid={`inventory-quantity-${userFruit.fruitId}`}>
                                {userFruit.quantity || 0}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}