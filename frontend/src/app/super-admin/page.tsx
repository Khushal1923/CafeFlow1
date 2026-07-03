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
  theme?: {
    primaryColor?: string;
    darkMode?: boolean;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  instagramUrl?: string;
  googleMapsUrl?: string;
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

  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    contact: '',
    gstNumber: '',
    taxRate: 5,
    primaryColor: '#d97706',
    latitude: '',
    longitude: '',
    instagramUrl: '',
    googleMapsUrl: '',
  });

  const handleOpenEditModal = (rest: Restaurant) => {
    setEditingRestaurant(rest);
    setEditForm({
      name: rest.name,
      address: rest.address,
      contact: rest.contact,
      gstNumber: rest.gstNumber || '',
      taxRate: rest.taxRate,
      primaryColor: rest.theme?.primaryColor || '#d97706',
      latitude: rest.location?.latitude?.toString() || '',
      longitude: rest.location?.longitude?.toString() || '',
      instagramUrl: rest.instagramUrl || '',
      googleMapsUrl: rest.googleMapsUrl || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;

    try {
      const payload = {
        name: editForm.name,
        address: editForm.address,
        contact: editForm.contact,
        gstNumber: editForm.gstNumber,
        taxRate: Number(editForm.taxRate),
        theme: {
          primaryColor: editForm.primaryColor,
        },
        location: {
          latitude: editForm.latitude ? Number(editForm.latitude) : undefined,
          longitude: editForm.longitude ? Number(editForm.longitude) : undefined,
        },
        instagramUrl: editForm.instagramUrl,
        googleMapsUrl: editForm.googleMapsUrl,
      };

      const res = await api.patch(`/restaurants/${editingRestaurant._id}`, payload);
      if (res.data.success) {
        const updatedRest = res.data.data;
        setRestaurants((prev) =>
          prev.map((r) => (r._id === editingRestaurant._id ? updatedRest : r))
        );
        setEditingRestaurant(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update restaurant details.');
    }
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
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(rest)}
                          className="text-xs h-8 cursor-pointer font-bold px-3 border-border hover:bg-secondary transition-colors"
                        >
                          Edit Profile
                        </Button>
                        <Button
                          size="sm"
                          variant={rest.status === 'active' ? 'destructive' : 'outline'}
                          onClick={() => handleToggleStatus(rest._id, rest.status)}
                          className="text-xs h-8 cursor-pointer font-bold px-3.5"
                        >
                          {rest.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {editingRestaurant && (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-2xl p-6 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="font-serif font-bold text-base md:text-lg">
                  Customize Cafe Website: {editingRestaurant.name}
                </h3>
                <button
                  onClick={() => setEditingRestaurant(null)}
                  className="p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Cafe Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={editForm.contact}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                      className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Address Location</label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">GST/VAT Number (Optional)</label>
                    <input
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      placeholder="e.g. 22AAAAA1111A1Z1"
                      className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={editForm.taxRate}
                      onChange={(e) => setEditForm({ ...editForm, taxRate: Number(e.target.value) })}
                      className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-[10px]">Branding & Aesthetics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Primary Website Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={editForm.primaryColor}
                          onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })}
                          className="w-10 h-8 border border-border rounded cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={editForm.primaryColor}
                          onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })}
                          className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-1.5 font-mono text-center uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-[10px]">Social Links & Coordinates</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Instagram URL</label>
                      <input
                        type="url"
                        value={editForm.instagramUrl}
                        onChange={(e) => setEditForm({ ...editForm, instagramUrl: e.target.value })}
                        placeholder="https://instagram.com/cafe"
                        className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Google Maps URL</label>
                      <input
                        type="url"
                        value={editForm.googleMapsUrl}
                        onChange={(e) => setEditForm({ ...editForm, googleMapsUrl: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Latitude (Geofencing)</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        placeholder="e.g. 28.6139"
                        className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Longitude (Geofencing)</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        placeholder="e.g. 77.2090"
                        className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 flex justify-end gap-3.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingRestaurant(null)}
                    className="cursor-pointer font-bold px-4 text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="cursor-pointer font-bold px-5 text-xs h-9"
                  >
                    Save Customizations
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
