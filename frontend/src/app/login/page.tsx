'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Loader2, Coffee, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, token, user } = useAuthStore();

  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Already logged in? Redirect
  useEffect(() => {
    if (token && user) {
      redirectUser(user.role);
    }
  }, [token, user]);

  const redirectUser = (role: string) => {
    if (role === 'super_admin') {
      router.push('/super-admin');
    } else if (role === 'restaurant_admin') {
      router.push('/admin/dashboard');
    } else if (role === 'staff') {
      router.push('/kitchen');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      const { token, user, restaurant } = response.data;
      setAuth(token, user, restaurant);
      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => {
        redirectUser(user.role);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      !restaurantName ||
      !address ||
      !contact ||
      !slug ||
      !adminName ||
      !registerEmail ||
      !registerPassword
    ) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register-restaurant', {
        restaurantName,
        address,
        contact,
        slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
        adminName,
        email: registerEmail,
        password: registerPassword,
      });

      const { token, user, restaurant } = response.data;
      setAuth(token, user, restaurant);
      setSuccessMsg('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Registration failed. Try changing the slug.');
    } finally {
      setLoading(false);
    }
  };

  // Generate URL slug preview
  const handleRestaurantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRestaurantName(val);
    // Simple slug generator
    const calculatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(calculatedSlug);
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-100 dark:bg-stone-950 overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="max-w-md w-full z-10 space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 mb-4 animate-bounce">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Cafe<span className="text-primary font-sans">Flow</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Seamless SaaS Platform for Restaurant Operations & QR Tables
          </p>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <Card className="border border-border bg-card shadow-2xl relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl font-bold font-serif">
              {isRegistering ? 'Register Your Cafe' : 'Staff & Partner Login'}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegistering
                ? 'Create your multi-tenant SaaS profile and configure QR menus'
                : 'Access your restaurant administration, tables, and kitchen dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRegistering ? (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Cafe/Restaurant Name
                    </label>
                    <input
                      type="text"
                      required
                      value={restaurantName}
                      onChange={handleRestaurantNameChange}
                      placeholder="e.g. Mocha Lounge"
                      className="w-full text-sm bg-background text-foreground border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Sub-path / Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                      placeholder="mocha-lounge"
                      className="w-full text-xs font-mono bg-background text-foreground border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 9999999999"
                      className="w-full text-sm bg-background text-foreground border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Restaurant Address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="12 Main St, City Centre"
                    className="w-full text-sm bg-background text-foreground border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div className="border-t border-border/60 my-4 pt-3">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-2">
                    Administrator Details
                  </span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        Admin Name
                      </label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-sm bg-background text-foreground border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        required
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="john@restaurant.com"
                        className="w-full text-sm bg-background text-foreground border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm bg-background text-foreground border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-4 cursor-pointer">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Registering Cafe...
                    </>
                  ) : (
                    'Launch My Restaurant'
                  )}
                </Button>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@centralcafe.com"
                    className="w-full text-sm bg-background text-foreground border border-border rounded-lg px-3.5 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm bg-background text-foreground border border-border rounded-lg pl-3.5 pr-10 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>

                <Button type="submit" disabled={loading} className="w-full cursor-pointer">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center border-t border-border/40 pt-4">
            <span className="text-sm text-muted-foreground">
              {isRegistering ? 'Already have an account?' : 'New Cafe Owner?'}
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setIsRegistering(!isRegistering);
                }}
                className="text-primary font-semibold hover:underline ml-1 focus:outline-none cursor-pointer"
              >
                {isRegistering ? 'Sign In here' : 'Register your restaurant'}
              </button>
            </span>

            {/* Quick Demo Credentials Help */}
            {!isRegistering && (
              <div className="text-[11px] text-left bg-stone-50 dark:bg-stone-900 border border-border/50 rounded-lg p-2.5 text-muted-foreground space-y-1">
                <span className="font-bold text-foreground">Quick Sandbox Logins:</span>
                <div>• Super Admin: <code className="bg-muted px-1 rounded text-foreground">superadmin@cafeflow.com</code> / <code className="bg-muted px-1 rounded text-foreground">superadmin123</code></div>
                <div>• Cafe Admin: <code className="bg-muted px-1 rounded text-foreground">admin@centralcafe.com</code> / <code className="bg-muted px-1 rounded text-foreground">admin123</code></div>
                <div>• Staff/Kitchen: <code className="bg-muted px-1 rounded text-foreground">staff@centralcafe.com</code> / <code className="bg-muted px-1 rounded text-foreground">staff123</code></div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
