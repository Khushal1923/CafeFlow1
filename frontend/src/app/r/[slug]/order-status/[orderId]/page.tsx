'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSocket from '../../../../../hooks/useSocket';
import api from '../../../../../lib/axios';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../../../components/ui/card';
import ThemeToggle from '../../../../../components/ThemeToggle';
import { 
  Loader2, Coffee, CheckCircle2, ChefHat, Bell, Sparkles, 
  Receipt, Download, Printer, ArrowLeft, MessageSquare, AlertCircle, Plus
} from 'lucide-react';
import Link from 'next/link';

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
  restaurantId: string;
  customerName: string;
  phoneNumber: string;
  tableNumber: string;
  items: OrderItem[];
  status: 'received' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
}

interface Bill {
  billNumber: string;
  pdfUrl?: string;
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  
  const slug = params.slug as string;
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket listener for this order room
  const socket = useSocket('order', orderId);

  // Load initial order details
  useEffect(() => {
    if (!orderId) return;

    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data.data);

        // Check if bill already exists (if completed)
        if (response.data.data.status === 'completed') {
          fetchBillDetails();
        }
      } catch (err: any) {
        console.error('Fetch order error:', err);
        setError('We could not find this order. Please make sure the ID is correct.');
      } finally {
        setLoading(false);
      }
    };

    const fetchBillDetails = async () => {
      try {
        const billRes = await api.get(`/bills/order/${orderId}`);
        if (billRes.data.success) {
          setBill(billRes.data.data);
        }
      } catch (err) {
        console.log('Bill not generated yet');
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Hook socket triggers for real time state updates
  useEffect(() => {
    if (!socket) return;

    // Listen to status changes
    socket.on('order_status_updated', (updatedOrder: Order) => {
      console.log('[Socket] Order status updated:', updatedOrder.status);
      setOrder(updatedOrder);

      if (updatedOrder.status === 'completed') {
        // Trigger bill fetch
        api.get(`/bills/order/${orderId}`)
          .then((res) => {
            if (res.data.success) setBill(res.data.data);
          })
          .catch((err) => console.log('Bill generation in progress...'));
      }
    });

    // Listen to billing outputs
    socket.on('bill_ready', (billRecord: Bill) => {
      console.log('[Socket] Invoice generated:', billRecord.billNumber);
      setBill(billRecord);
    });

    return () => {
      socket.off('order_status_updated');
      socket.off('bill_ready');
    };
  }, [socket, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-3" />
        <h2 className="font-serif text-xl font-bold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href={`/r/${slug}/menu`} className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all">
          Back to Menu
        </Link>
      </div>
    );
  }

  // Map progress phases
  const getStatusPhase = (): number => {
    switch (order.status) {
      case 'received': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'served': return 4;
      case 'completed': return 5;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentPhase = getStatusPhase();

  // Helper to draw milestone state
  const milestones = [
    { label: 'Received', desc: 'Placed successfully', icon: Sparkles },
    { label: 'Accepted', desc: 'Sent to kitchen', icon: CheckCircle2 },
    { label: 'Preparing', desc: 'Chef cooking', icon: ChefHat },
    { label: 'Ready', desc: 'Awaiting server', icon: Bell },
    { label: 'Served', desc: 'Dishes served', icon: Coffee },
  ];

  const getBackendBillUrl = (pdfPath: string): string => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // pdfPath will look like "/bills/INV-XXX.pdf"
    // Extract filename
    const filename = pdfPath.split('/').pop() || '';
    return `${apiBaseUrl}/api/bills/download/${filename}`;
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-12">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href={`/r/${slug}/menu`} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>
        <h2 className="font-serif font-bold text-sm tracking-tight text-center">Track Order</h2>
        <ThemeToggle />
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* Status tracker visual */}
        <Card className="border border-border/60 shadow-lg p-5 space-y-6 overflow-hidden relative">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest block">Live Status</span>
            <h2 className="font-serif text-2xl font-black capitalize text-foreground">
              {order.status === 'cancelled' ? 'Order Cancelled' : milestones[Math.min(Math.max(0, currentPhase), 4)].label}
            </h2>
            <p className="text-xs text-muted-foreground">
              {order.status === 'cancelled'
                ? 'We apologize, your order has been cancelled by staff.'
                : 'Your order updates instantly as our chefs start preparing.'}
            </p>
          </div>

          {/* Cancelled Alert */}
          {order.status === 'cancelled' ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>We apologize, this order was cancelled. Please speak with cafe staff or place a new order.</span>
            </div>
          ) : (
            /* Milestone timelines */
            <div className="relative pt-3 pb-4">
              <div className="absolute top-[28px] left-[20px] right-[20px] h-1 bg-secondary rounded-full -z-10">
                <div 
                  className="h-full bg-primary transition-all duration-700 rounded-full" 
                  style={{ width: `${(Math.min(currentPhase, 4) / 4) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center relative">
                {milestones.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx <= currentPhase;
                  const isCurrent = idx === currentPhase;

                  return (
                    <div key={idx} className="flex flex-col items-center space-y-2">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20 animate-pulse'
                          : isActive 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-background border-border text-muted-foreground'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="text-center hidden sm:block">
                        <h4 className={`text-[10px] font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Invoice Generator Card (Only active when bill is generated) */}
        {bill && (
          <Card className="border border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/5 shadow-md p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-extrabold text-sm md:text-base">GST Bill Invoice Ready</h3>
                <p className="text-xs text-muted-foreground">Settlement Code: {bill.billNumber}</p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              {bill.pdfUrl && (
                <>
                  <a
                    href={getBackendBillUrl(bill.pdfUrl || '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial"
                  >
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1 border-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </Button>
                  </a>
                  <button
                    onClick={() => {
                      const win = window.open(getBackendBillUrl(bill.pdfUrl || ''), '_blank');
                      if (win) win.focus();
                    }}
                    className="p-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-secondary cursor-pointer"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Order Items Summary */}
        <Card className="border border-border/60 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-serif font-black">Order Summary</CardTitle>
                <CardDescription className="text-xs">Dine-in Table {order.tableNumber}</CardDescription>
              </div>
              <Badge variant={order.status === 'cancelled' ? 'danger' : 'outline'} className="text-[10px] py-0.5 capitalize">
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* List */}
            <div className="divide-y divide-border/40">
              {order.items.map((item, idx) => {
                const extra = item.customizations
                  ? item.customizations.reduce((acc, c) => acc + c.extraPrice, 0)
                  : 0;
                const priceTotal = (item.price + extra) * item.quantity;

                return (
                  <div key={idx} className="py-3 flex justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground text-xs">
                        {item.name} <span className="text-primary font-bold">x {item.quantity}</span>
                      </span>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          {item.customizations.map(c => `${c.name}: ${c.selectedOption}`).join(', ')}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="text-[9px] text-amber-600 dark:text-amber-400 italic">
                          * Instructions: "{item.specialInstructions}"
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-foreground">Rs. {priceTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Calculations */}
            <div className="border-t border-border/50 pt-3 space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground font-semibold">Rs. {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST</span>
                <span className="text-foreground font-semibold">Rs. {order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-extrabold text-foreground">
                <span>Grand Total</span>
                <span className="text-primary text-base">Rs. {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/10 border-t border-border/30 justify-between items-center py-3.5 text-[11px] text-muted-foreground">
            <span>Client: {order.customerName}</span>
            <span>Placed: {new Date(order.createdAt).toLocaleTimeString()}</span>
          </CardFooter>
        </Card>

        {/* Order More Items CTA Button */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <div className="text-center pt-2">
            <Link 
              href={`/r/${slug}/menu`} 
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3 w-full bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-amber-500/10 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4.5 h-4.5" /> Order More Items
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
