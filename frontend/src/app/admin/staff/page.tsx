'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  Loader2, Plus, Edit, Trash2, ShieldAlert, CheckCircle2, 
  Users, UserPlus, Mail, Shield, UserCheck, X 
} from 'lucide-react';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: 'restaurant_admin' | 'staff';
  createdAt: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'restaurant_admin'>('staff');
  const [formLoading, setFormLoading] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/staff');
      setStaff(response.data.data);
    } catch (err: any) {
      console.error('Fetch staff error:', err);
      setError('Failed to retrieve staff team roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('staff');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setEmail(member.email);
    setPassword('');
    setRole(member.role);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${staffName} from your roster?`)) return;

    try {
      await api.delete(`/staff/${staffId}`);
      setStaff((prev) => prev.filter((s) => s._id !== staffId));
    } catch (err: any) {
      alert('Failed to remove staff member.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || (!editingStaff && !password)) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const payload: any = { name, role };
    if (password) payload.password = password;
    
    // Email is only sent on creation for security
    if (!editingStaff) {
      payload.email = email;
    }

    setFormLoading(true);
    try {
      if (editingStaff) {
        // Edit mode
        await api.patch(`/staff/${editingStaff._id}`, payload);
      } else {
        // Create mode
        await api.post('/staff', payload);
      }
      fetchStaff();
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save staff member details.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-2xl tracking-tight">Staff Roster</h2>
          <p className="text-xs text-muted-foreground">Manage roles, register new staff members, and assign access permissions.</p>
        </div>

        <Button onClick={openAddModal} className="cursor-pointer gap-1.5 h-10 font-bold shadow-md">
          <UserPlus className="w-5 h-5" /> Add Staff Member
        </Button>
      </div>

      {/* Staff roster grid card */}
      <Card className="border border-border/60 shadow-md min-h-[50vh] flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-serif font-black">Active Team Roster</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              Active: {staff.length}
            </Badge>
          </div>
        </CardHeader>

        {loading ? (
          <div className="flex-1 flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-2" />
            <h4 className="font-serif font-bold">Roster empty</h4>
            <p className="text-xs max-w-xs">You have no other staff members registered. Click Add Staff above to create one.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/40 text-muted-foreground border-b border-border font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Added On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground font-semibold">
                {staff.map((member) => (
                  <tr key={member._id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={member.role === 'restaurant_admin' ? 'info' : 'outline'} className="text-[9px] py-0.5 capitalize">
                        {member.role === 'restaurant_admin' ? 'Cafe Admin' : 'Kitchen Staff'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-normal">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-1.5 rounded border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit member"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member._id, member.name)}
                          className="p-1.5 rounded border border-border bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Delete member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Staff Modal overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-base md:text-lg">
                {editingStaff ? 'Edit Staff Credentials' : 'Add Staff Member'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Miller"
                  className="w-full text-xs bg-secondary/40 text-foreground border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingStaff}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@centralcafe.com"
                  className="w-full text-xs bg-secondary/40 text-foreground border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Password {editingStaff && '(Leave blank to keep unchanged)'}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-secondary/40 text-foreground border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Assign System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full text-xs bg-secondary/40 text-foreground border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all cursor-pointer"
                >
                  <option value="staff">Kitchen Staff (Kitchen panel only)</option>
                  <option value="restaurant_admin">Cafe Admin (Full controls)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="w-1/2 cursor-pointer font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading} className="w-1/2 cursor-pointer font-bold">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
