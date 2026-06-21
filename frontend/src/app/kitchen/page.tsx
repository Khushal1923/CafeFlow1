'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import useSocket from '../../hooks/useSocket';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import ThemeToggle from '../../components/ThemeToggle';
import { 
  Loader2, LogOut, Clock, ChefHat, CheckSquare, BellRing, 
  Sparkles, Coffee, AlertTriangle, Play, CheckCircle2 
} from 'lucide-react';

interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: {
    name: string;
    selectedOption: string;
    extraPrice: number;
  }[];
  specialInstructions?: string;
}

interface Order {
  _id: string;
  customerName: string;
  phoneNumber: string;
  tableNumber: string;
  items: OrderItem[];
  status: 'received' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const { user, restaurant, clearAuth } = useAuthStore();
  const restaurantId = user?.restaurantId;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bind to socket updates for this restaurant room
  const socket = useSocket('restaurant', restaurantId);

  // Handle unauthorized users (ensure role is admin or staff)
  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'restaurant_admin')) {
      router.push('/login');
    }
  }, [user, router]);

  // Load active orders on mount
  useEffect(() => {
    if (!restaurantId) return;

    const fetchActiveOrders = async () => {
      try {
        const response = await api.get('/orders/my-restaurant');
        // Filter out completed and cancelled orders
        const active = response.data.data.filter(
          (o: Order) => o.status !== 'completed' && o.status !== 'cancelled'
        );
        setOrders(active);
      } catch (err: any) {
        console.error('Fetch active orders error:', err);
        setError('Failed to fetch orders list.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();
  }, [restaurantId]);

  // Hook socket triggers for real time order additions / modifications
  useEffect(() => {
    if (!socket) return;

    socket.on('new_order', (newOrder: Order) => {
      console.log('[Kitchen Socket] New order received:', newOrder._id);
      
      // Add to list if not already present
      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });

      // Play audio chime
      playChime();
    });

    socket.on('order_updated', (updatedOrder: Order) => {
      console.log('[Kitchen Socket] Order status updated elsewhere:', updatedOrder._id, updatedOrder.status);
      
      setOrders((prev) => {
        // If completed or cancelled, remove from dashboard list
        if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        
        // Otherwise, update in-place
        return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
      });
    });

    return () => {
      socket.off('new_order');
      socket.off('order_updated');
    };
  }, [socket]);

  const playChime = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioContext.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start();
      osc.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('Audio chime not allowed by browser permissions yet');
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      const updated = response.data.data;

      // Update in local state
      setOrders((prev) => {
        if (nextStatus === 'completed' || nextStatus === 'cancelled') {
          return prev.filter((o) => o._id !== orderId);
        }
        return prev.map((o) => (o._id === orderId ? updated : o));
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Helper to determine elapsed time string
  const getElapsedString = (createdAt: string): string => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    const elapsedMin = Math.floor(elapsedMs / 1000 / 60);
    
    if (elapsedMin < 1) return 'Just now';
    return `${elapsedMin}m ago`;
  };

  // Helper for status styling variables
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'received': return 'danger'; // Red badge for attention
      case 'accepted': return 'info';
      case 'preparing': return 'warning';
      case 'ready': return 'success';
      case 'served': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="bg-card text-card-foreground border-b border-border/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif font-black text-lg md:text-xl tracking-tight">
              {restaurant?.name || 'CafeFlow'} Kitchen
            </h1>
            <span className="text-xs text-muted-foreground font-medium">
              Staff Portal: {user?.name} ({user?.role === 'restaurant_admin' ? 'Admin' : 'Staff'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs cursor-pointer gap-1.5 h-9">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Panel grid */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Counter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending Approval', count: orders.filter((o) => o.status === 'received').length, color: 'text-red-500' },
            { label: 'Accepted / Queue', count: orders.filter((o) => o.status === 'accepted').length, color: 'text-blue-500' },
            { label: 'Active Cooking', count: orders.filter((o) => o.status === 'preparing').length, color: 'text-amber-500' },
            { label: 'Awaiting Service', count: orders.filter((o) => o.status === 'ready' || o.status === 'served').length, color: 'text-emerald-500' },
          ].map((card, i) => (
            <Card key={i} className="border border-border/40 p-4 shadow-sm flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
              <span className={`text-2xl font-black ${card.color}`}>{card.count}</span>
            </Card>
          ))}
        </div>

        {orders.length === 0 ? (
          /* Empty Active Queue */
          <div className="text-center py-24 border-2 border-dashed border-border/60 rounded-3xl space-y-3">
            <Coffee className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h2 className="font-serif font-bold text-muted-foreground text-lg">Kitchen Queue Clear!</h2>
            <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">There are no incoming active dine-in orders currently. Chime alerts will play when customers order.</p>
          </div>
        ) : (
          /* Active orders card grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order._id} className="border border-border/70 hover:border-primary/30 flex flex-col justify-between shadow shadow-stone-150/40 relative overflow-hidden">
                {/* Visual Status Indicator Strip */}
                <div className={`h-1.5 w-full absolute top-0 left-0 ${
                  order.status === 'received' ? 'bg-red-500 animate-pulse' :
                  order.status === 'accepted' ? 'bg-blue-500' :
                  order.status === 'preparing' ? 'bg-amber-500' :
                  order.status === 'ready' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-500'
                }`} />

                <CardHeader className="pb-2 pt-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Table number</span>
                      <h3 className="font-serif text-3xl font-extrabold text-foreground tracking-tight">
                        T-{order.tableNumber}
                      </h3>
                    </div>

                    <div className="text-right space-y-1.5">
                      <Badge variant={getStatusBadgeStyle(order.status) as any} className="text-[10px] py-0.5 capitalize font-extrabold">
                        {order.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-end font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getElapsedString(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Items List */}
                <CardContent className="py-3 flex-1">
                  <div className="divide-y divide-border/40 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-sm text-foreground">
                            {item.name} <span className="text-primary font-bold">x {item.quantity}</span>
                          </span>
                        </div>

                        {/* Customizations details */}
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="text-[10px] text-muted-foreground font-medium pl-2">
                            {item.customizations.map(c => `${c.name}: ${c.selectedOption}`).join(', ')}
                          </div>
                        )}

                        {/* Instructions */}
                        {item.specialInstructions && (
                          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] p-1.5 rounded-lg font-medium italic mt-1">
                            * note: "{item.specialInstructions}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Action buttons */}
                <div className="p-4 border-t border-border/40 bg-secondary/10 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                    className="px-3 py-2 bg-background border border-border text-destructive hover:bg-destructive/10 hover:border-destructive/30 rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0"
                    title="Cancel Order"
                  >
                    Cancel
                  </button>

                  <div className="flex-1">
                    {order.status === 'received' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'accepted')}
                        className="w-full text-xs font-bold gap-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/10"
                      >
                        Accept Order <CheckSquare className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {order.status === 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'preparing')}
                        className="w-full text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-amber-500/10"
                      >
                        Start Cooking <Play className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'ready')}
                        className="w-full text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-500/10"
                      >
                        Mark Ready <BellRing className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'served')}
                        className="w-full text-xs font-bold gap-1 bg-primary text-white cursor-pointer"
                      >
                        Mark Served <Coffee className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {order.status === 'served' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'completed')}
                        className="w-full text-xs font-bold gap-1 bg-stone-900 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-50 dark:text-stone-950 text-white cursor-pointer"
                      >
                        Complete & Bill <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
