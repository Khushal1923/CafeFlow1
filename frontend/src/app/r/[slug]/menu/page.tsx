'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore, CartCustomization } from '../../../../store/cartStore';
import api from '../../../../lib/axios';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent } from '../../../../components/ui/card';
import ThemeToggle from '../../../../components/ThemeToggle';
import Link from 'next/link';
import { 
  Loader2, ShoppingBag, Search, Plus, Minus, X, Check, Coffee, 
  Trash2, Phone, User, ShieldCheck, ChevronRight, MessageSquare 
} from 'lucide-react';

interface CustomizationOption {
  name: string;
  extraPrice: number;
}

interface CustomizationGroup {
  name: string;
  type: 'single' | 'multiple';
  options: CustomizationOption[];
}

interface Dish {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  category: string;
  price: number;
  veg: boolean;
  available: boolean;
  customizations: CustomizationGroup[];
}

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  taxRate: number;
}

export default function CustomerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Zustand Cart Store
  const cartItems = useCartStore((state) => state.items);
  const cartRestaurantId = useCartStore((state) => state.restaurantId);
  const cartTableNumber = useCartStore((state) => state.tableNumber);
  const cartTaxRate = useCartStore((state) => state.taxRate);
  const setTableContext = useCartStore((state) => state.setTableContext);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const { subtotal, tax, total } = useCartStore((state) => state.getTotals)();

  // Component States
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart Drawer & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizationDish, setCustomizationDish] = useState<Dish | null>(null);
  
  // Customization selection state
  const [selectedCustomizations, setSelectedCustomizations] = useState<CartCustomization[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Checkout / OTP State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(120); // 2 minutes
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Categories List
  const categories = ['All', 'Coffee', 'Tea', 'Mocktails', 'Snacks', 'Breakfast', 'Lunch', 'Dinner', 'Desserts'];

  // Load Dishes & Restaurant Tenant details
  useEffect(() => {
    if (!slug) return;

    const loadMenu = async () => {
      try {
        const tenantRes = await api.get(`/restaurants/slug/${slug}`);
        const restData = tenantRes.data.data;
        setRestaurant(restData);

        const dishesRes = await api.get(`/dishes/slug/${slug}`);
        setDishes(dishesRes.data.data);

        // If table parameters are not initialized (direct web URL access), default to mock Table 1
        if (!cartTableNumber || cartRestaurantId !== restData._id) {
          setTableContext(restData._id, '1', restData.taxRate || 5);
        }
      } catch (err: any) {
        console.error('Menu load error:', err);
        setErrorMsg('Failed to load menu. Please check the URL.');
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [slug, cartTableNumber, cartRestaurantId, setTableContext]);

  // OTP Countdown effect
  useEffect(() => {
    if (!otpSent || otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-6 text-center">
        <h2 className="font-serif text-xl font-bold mb-2">Error</h2>
        <p className="text-muted-foreground">{errorMsg || 'Restaurant not found'}</p>
      </div>
    );
  }

  // Handle Add to Cart action
  const handleAddToCartClick = (dish: Dish) => {
    if (dish.customizations && dish.customizations.length > 0) {
      // Setup initial defaults for customizations
      const initialCusts: CartCustomization[] = [];
      dish.customizations.forEach((group) => {
        if (group.type === 'single' && group.options.length > 0) {
          initialCusts.push({
            name: group.name,
            selectedOption: group.options[0].name,
            extraPrice: group.options[0].extraPrice,
          });
        }
      });
      setSelectedCustomizations(initialCusts);
      setSpecialInstructions('');
      setCustomizationDish(dish);
    } else {
      // Add immediately if no customizations required
      addItem({
        dishId: dish._id,
        name: dish.name,
        price: dish.price,
        veg: dish.veg,
        category: dish.category,
        customizations: [],
        specialInstructions: '',
        image: dish.image,
      });
    }
  };

  // Toggle single customization (Radio behavior)
  const handleSingleCustSelect = (groupName: string, option: CustomizationOption) => {
    setSelectedCustomizations((prev) => {
      const filtered = prev.filter((c) => c.name !== groupName);
      return [
        ...filtered,
        { name: groupName, selectedOption: option.name, extraPrice: option.extraPrice },
      ];
    });
  };

  // Toggle multiple customizations (Checkbox behavior)
  const handleMultipleCustSelect = (groupName: string, option: CustomizationOption) => {
    setSelectedCustomizations((prev) => {
      const exists = prev.find((c) => c.name === groupName && c.selectedOption === option.name);
      if (exists) {
        return prev.filter((c) => !(c.name === groupName && c.selectedOption === option.name));
      } else {
        return [
          ...prev,
          { name: groupName, selectedOption: option.name, extraPrice: option.extraPrice },
        ];
      }
    });
  };

  // Confirm custom configurations and add to store
  const handleConfirmCustomizations = () => {
    if (!customizationDish) return;
    addItem({
      dishId: customizationDish._id,
      name: customizationDish.name,
      price: customizationDish.price,
      veg: customizationDish.veg,
      category: customizationDish.category,
      customizations: selectedCustomizations,
      specialInstructions,
      image: customizationDish.image,
    });
    setCustomizationDish(null);
  };

  // Compute live customization total preview
  const getCustomizationPreviewTotal = (): number => {
    if (!customizationDish) return 0;
    const extra = selectedCustomizations.reduce((acc, c) => acc + c.extraPrice, 0);
    return customizationDish.price + extra;
  };

  // Core OTP send logic — called by both the form submit and the Resend button
  const sendOtpRequest = async () => {
    setCheckoutError(null);

    if (!customerName || !phoneNumber) {
      setCheckoutError('Please enter your name and phone number.');
      return;
    }

    setOtpLoading(true);
    try {
      await api.post('/auth/otp/send', { phoneNumber });
      setOtpSent(true);
      setOtpCountdown(120);
    } catch (err: any) {
      console.error('[OTP Send] Failed:', err.response?.data || err.message);
      setCheckoutError(err.response?.data?.message || 'Failed to send verification OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Request SMS verification OTP (form submit handler)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtpRequest();
  };

  // Verify OTP and complete checkout placement
  const handleVerifyOtpAndPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!otpCode) {
      setCheckoutError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      // 1. Verify code
      await api.post('/auth/otp/verify', { phoneNumber, otp: otpCode });

      // 2. Verified! Proceed to place order
      const orderData = {
        restaurantId: restaurant._id,
        customerName,
        phoneNumber,
        tableNumber: cartTableNumber || '1',
        items: cartItems.map((item) => ({
          dishId: item.dishId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customizations: item.customizations,
          specialInstructions: item.specialInstructions,
        })),
      };

      const orderResponse = await api.post('/orders', orderData);
      const newOrder = orderResponse.data.data;

      // Reset state
      clearCart();
      setIsCheckoutOpen(false);
      setIsCartOpen(false);

      // Redirect to status tracker
      router.push(`/r/${slug}/order-status/${newOrder._id}`);
    } catch (err: any) {
      console.error('[OTP Verify / Order] Failed:', err.response?.data || err.message);
      setCheckoutError(err.response?.data?.message || 'Verification or order placement failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Filter logic
  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory = selectedCategory === 'All' || dish.category === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dish.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = !vegOnly || dish.veg;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div className="bg-background text-foreground min-h-screen pb-24 relative">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/r/${slug}`} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-serif font-bold text-sm group-hover:scale-105 transition-all">
              {restaurant.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm tracking-tight">{restaurant.name}</h2>
              <span className="text-[10px] bg-accent/60 text-accent-foreground border border-accent px-2 py-0.5 rounded-full font-bold">
                Dine-in: Table {cartTableNumber || '1'}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner Intro */}
      <section className="bg-stone-900 text-stone-100 py-8 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop" 
            alt="Hero Menu" 
            className="w-full h-full object-cover opacity-20 filter blur-[1px]" 
          />
        </div>
        <div className="relative z-10 space-y-1">
          <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-stone-50">Our Digital Menu</h1>
          <p className="text-xs text-stone-300">Tap items to customize, verify details, and check out table-side.</p>
        </div>
      </section>

      {/* Filters & Categories block */}
      <section className="sticky top-[61px] z-30 bg-background/95 backdrop-blur px-4 py-3 border-b border-border/40 space-y-3 shadow-sm">
        {/* Search & Veg Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full text-sm bg-secondary/60 border border-border/80 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            />
          </div>

          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              vegOnly 
                ? 'bg-green-600/10 text-green-600 border-green-600/20' 
                : 'bg-secondary/40 border-border text-muted-foreground'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${vegOnly ? 'bg-green-600' : 'border border-muted-foreground/60'}`} />
            Veg Only
          </button>
        </div>

        {/* Scrollable Categories selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground border-transparent shadow shadow-primary/10 scale-105'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Dishes Grid */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {filteredDishes.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Coffee className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <h3 className="font-serif font-bold text-muted-foreground">No dishes matching filters</h3>
            <p className="text-xs text-muted-foreground/80">Try modifying your search queries or category tags.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDishes.map((dish) => (
              <Card key={dish._id} className="overflow-hidden border border-border/60 hover:border-primary/20 shadow-sm transition-all duration-200">
                <CardContent className="p-0 flex min-h-[8rem] h-auto">
                  {/* Dish Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between pr-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 flex items-center justify-center border ${dish.veg ? 'bg-green-600 border-green-700/20' : 'bg-red-600 border-red-700/20'}`}>
                          <span className="w-1 h-1 bg-white rounded-full" />
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{dish.category}</span>
                      </div>
                      
                      <h3 className="font-serif font-bold text-sm md:text-base leading-snug">{dish.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{dish.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-extrabold text-sm text-foreground">Rs. {dish.price.toFixed(2)}</span>
                      
                      {!dish.available ? (
                        <Badge variant="secondary" className="text-[10px]">Out of stock</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToCartClick(dish)}
                          className="h-8 rounded-lg px-3 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer font-bold gap-1"
                        >
                          Add <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Dish Image */}
                  <div className="w-32 h-full relative shrink-0">
                    <img
                      src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=250&auto=format&fit=crop'}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    {!dish.available && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-[10px] font-bold text-stone-100 uppercase tracking-widest">Unavailable</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-primary/20 border border-primary/20 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-primary-foreground/90 uppercase tracking-wide">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items Added
              </h4>
              <span className="text-base font-extrabold">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1 font-bold text-xs bg-primary-foreground text-primary rounded-xl px-4 py-2.5 hover:bg-stone-50 transition-all cursor-pointer uppercase tracking-wider"
          >
            View Cart <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customization Selection Modal Overlay */}
      {customizationDish && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="bg-card text-card-foreground w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-border overflow-hidden shadow-2xl animate-slide-up sm:animate-fade-in max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base md:text-lg">{customizationDish.name}</h3>
                <span className="text-xs text-muted-foreground">Customize your dish preferences</span>
              </div>
              <button 
                onClick={() => setCustomizationDish(null)}
                className="p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
              {customizationDish.customizations.map((group) => (
                <div key={group.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground">{group.name}</h4>
                    <span className="text-[10px] bg-secondary text-muted-foreground font-semibold px-2 py-0.5 rounded-md">
                      {group.type === 'single' ? 'Select One (Required)' : 'Select Multiple'}
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {group.options.map((opt) => {
                      const isSelected = selectedCustomizations.some(
                        (c) => c.name === group.name && c.selectedOption === opt.name
                      );

                      return (
                        <button
                          key={opt.name}
                          onClick={() => 
                            group.type === 'single' 
                              ? handleSingleCustSelect(group.name, opt) 
                              : handleMultipleCustSelect(group.name, opt)
                          }
                          className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-foreground font-semibold'
                              : 'border-border bg-background text-muted-foreground hover:bg-secondary/40'
                          }`}
                        >
                          <span className="text-xs">{opt.name}</span>
                          <div className="flex items-center gap-2">
                            {opt.extraPrice > 0 && (
                              <span className="text-[10px] text-primary">+Rs.{opt.extraPrice}</span>
                            )}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3px]" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Instructions text area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" /> Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Make it extra hot, no onions, etc."
                  className="w-full text-xs bg-secondary/50 text-foreground border border-border rounded-xl p-3 h-20 resize-none outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                  maxLength={160}
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Item Total</span>
                <span className="font-extrabold text-lg text-foreground">Rs. {getCustomizationPreviewTotal().toFixed(2)}</span>
              </div>

              <Button onClick={handleConfirmCustomizations} className="px-6 cursor-pointer font-bold">
                Add to Cart <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Slider Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex justify-end">
          <div className="bg-card text-card-foreground w-full max-w-md h-full flex flex-col shadow-2xl border-l border-border animate-slide-left relative">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-base md:text-lg">Your Cart</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              /* Empty Cart Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 text-center">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-muted-foreground/60">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-muted-foreground">Cart is empty</h4>
                <p className="text-xs text-muted-foreground/80 max-w-xs">Scan menu and click Add on items to populate your order.</p>
                <Button onClick={() => setIsCartOpen(false)} className="mt-2 text-xs font-bold cursor-pointer">
                  Browse Menu
                </Button>
              </div>
            ) : (
              /* Cart Contents */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cartItems.map((item) => {
                    const extra = item.customizations.reduce((acc, c) => acc + c.extraPrice, 0);
                    const itemUnitTotal = item.price + extra;

                    return (
                      <div key={item.key} className="flex gap-3 bg-secondary/20 p-3.5 rounded-2xl border border-border/40 relative">
                        {/* Remove item button */}
                        <button
                          onClick={() => removeItem(item.key)}
                          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&auto=format&fit=crop'}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover border border-border/30 shrink-0"
                        />

                        <div className="flex-1 space-y-1 pr-6 text-xs">
                          <h4 className="font-serif font-bold text-foreground leading-snug">{item.name}</h4>
                          
                          {/* Customizations display */}
                          {item.customizations.length > 0 && (
                            <div className="text-[10px] text-muted-foreground leading-relaxed">
                              {item.customizations.map(c => `${c.name}: ${c.selectedOption}`).join(', ')}
                            </div>
                          )}

                          {/* Instructions */}
                          {item.specialInstructions && (
                            <div className="text-[9px] text-amber-600 dark:text-amber-400 italic">
                              * Note: "{item.specialInstructions}"
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-extrabold text-foreground">Rs. {(itemUnitTotal * item.quantity).toFixed(2)}</span>
                            
                            {/* Quantity buttons */}
                            <div className="flex items-center bg-background border border-border rounded-lg h-7 px-1">
                              <button 
                                onClick={() => updateQuantity(item.key, -1)}
                                className="p-1 hover:text-primary cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.key, 1)}
                                className="p-1 hover:text-primary cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal summaries and Checkout Button */}
                <div className="p-4 border-t border-border bg-secondary/15 space-y-4">
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-foreground font-semibold">Rs. {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({cartTaxRate}%)</span>
                      <span className="text-foreground font-semibold">Rs. {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-extrabold text-foreground">
                      <span>Grand Total</span>
                      <span className="text-primary text-base">Rs. {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button onClick={() => setIsCheckoutOpen(true)} className="w-full cursor-pointer font-bold">
                    Checkout Dine-In Order <ChevronRight className="w-4.5 h-4.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Verification & Checkout Overlay Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-base md:text-lg flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-primary animate-pulse" /> Customer Verification
              </h3>
              <button 
                onClick={() => {
                  setOtpSent(false);
                  setCheckoutError(null);
                  setIsCheckoutOpen(false);
                }}
                className="p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3.5 py-2.5 rounded-lg">
                {checkoutError}
              </div>
            )}

            {!otpSent ? (
              /* Request OTP form */
              <form onSubmit={handleRequestOtp} className="space-y-4 text-sm">
                <p className="text-xs text-muted-foreground">
                  Before placing your dine-in order, please complete a quick 1-step verification to link your order to your mobile number.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-xs bg-secondary/50 text-foreground border border-border rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +919876543210"
                        className="w-full text-xs bg-secondary/50 text-foreground border border-border rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={otpLoading} className="w-full mt-2 cursor-pointer font-bold">
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification OTP'}
                </Button>
              </form>
            ) : (
              /* Enter OTP form */
              <form onSubmit={handleVerifyOtpAndPlaceOrder} className="space-y-4 text-sm">
                <p className="text-xs text-muted-foreground">
                  We have dispatched a 6-digit verification code to <span className="font-bold text-foreground">{phoneNumber}</span>. 
                  (Check the backend terminal console for code logs).
                </p>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full text-center text-lg font-mono font-bold bg-secondary/50 text-foreground border border-border rounded-xl py-3 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all tracking-[0.4em]"
                    maxLength={6}
                  />
                </div>

                {/* Countdown / Resend */}
                <div className="text-center">
                  {otpCountdown > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Resend code in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtpRequest}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer focus:outline-none"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <Button type="submit" disabled={otpLoading} className="w-full mt-2 cursor-pointer font-bold">
                  {otpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    'Verify Code & Place Order'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
