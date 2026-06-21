'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import ThemeToggle from '../../components/ThemeToggle';
import { 
  Loader2, LogOut, Coffee, ShieldCheck, Layers, 
  CheckCircle2, XCircle, ArrowUpRight, Globe, AlertTriangle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  address: string;
  contact: string;
  gstNumber?: string;
  taxRate: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, token, clearAuth } = useAuthStore();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticate role guard
  useEffect(() => {
    if (!token || !user || user.role !== 'super_admin') {
      router.push('/login');
    }
  }, [token, user, router]);

  const fetchAllRestaurants = async () => {
    setLoading(true);
    try {
      const response = await api.get('/restaurants');
      setRestaurants(response.data.data);
    } catch (err: any) {
      console.error('Fetch all restaurants error:', err);
      setError('Failed to retrieve restaurants list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchAllRestaurants();
    }
  }, [user]);

  const handleToggleStatus = async (restaurantId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change this restaurant status to ${nextStatus.toUpperCase()}?`)) return;

    try {
      const res = await api.patch(`/restaurants/${restaurantId}/status`, { status: nextStatus });
      if (res.data.success) {
        setRestaurants((prev) =>
          prev.map((r) => (r._id === restaurantId ? { ...r, status: nextStatus } : r))
        );
      }
    } catch (err: any) {
      alert('Failed to change status.');
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = restaurants.filter((r) => r.status === 'active').length;
  const suspendedCount = restaurants.filter((r) => r.status === 'suspended').length;

  return (
    <div className="bg-stone-50 dark:bg-stone-950 text-foreground min-h-screen flex flex-col">
      {/* Header bar */}
      <header className="bg-card text-card-foreground border-b border-border/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-black text-lg md:text-xl tracking-tight">CafeFlow SuperAdmin</h1>
            <span className="text-xs text-muted-foreground font-medium">SaaS Platform Manager</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs cursor-pointer gap-1.5 h-9">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Workspace panel */}
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Counter cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Registered Cafes', count: restaurants.length, desc: 'Total multi-tenant profiles', color: 'text-foreground' },
            { label: 'Active Services', count: activeCount, desc: 'Dine-in menu ordering enabled', color: 'text-emerald-600' },
            { label: 'Suspended Accounts', count: suspendedCount, desc: 'Subscription suspended', color: 'text-red-500' },
          ].map((card, i) => (
            <Card key={i} className="border border-border/40 p-5 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">{card.label}</span>
              <h3 className={`text-3xl font-black mt-2 ${card.color}`}>{card.count}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">{card.desc}</p>
            </Card>
          ))}
        </div>

        {/* Cafe Roster List */}
        <Card className="border border-border/60 shadow-md">
          <CardHeader className="border-b border-border/30 pb-3.5">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-serif font-black flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-primary" /> Registered Cafe Directory
                </CardTitle>
                <CardDescription className="text-xs">System-wide directory of all active and suspended tenants</CardDescription>
              </div>
            </div>
          </CardHeader>

          {restaurants.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground space-y-2">
              <Coffee className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <h4 className="font-serif font-bold">Directory is empty</h4>
              <p className="text-xs">No restaurant accounts have registered on the platform yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 text-muted-foreground border-b border-border font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Restaurant</th>
                    <th className="px-6 py-4">URL Sub-path</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Tax settings</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-foreground font-semibold">
                  {restaurants.map((rest) => (
                    <tr key={rest._id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-foreground">{rest.name}</div>
                        <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{rest.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/r/${rest.slug}`}
                          target="_blank"
                          className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          /r/{rest.slug} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{rest.contact}</td>
                      <td className="px-6 py-4">
                        GST Rate: {rest.taxRate}%
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={rest.status === 'active' ? 'success' : 'danger'} className="text-[9px] py-0.5 capitalize">
                          {rest.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant={rest.status === 'active' ? 'destructive' : 'outline'}
                          onClick={() => handleToggleStatus(rest._id, rest.status)}
                          className="text-xs h-8 cursor-pointer font-bold px-3.5"
                        >
                          {rest.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
