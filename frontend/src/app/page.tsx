'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import { Card } from '../components/ui/card';
import { 
  Coffee, QrCode, Tablet, BarChart3, ShieldCheck, 
  ChevronRight, ArrowUpRight, Award, Zap, HelpCircle, Globe
} from 'lucide-react';

export default function SaaSLandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 glass-light dark:glass border-b border-border/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
              <Coffee className="w-5.5 h-5.5" />
            </div>
            <span className="font-serif font-black text-lg md:text-xl tracking-tight">
              Cafe<span className="text-primary font-sans">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-xs md:text-sm font-bold hover:bg-primary/95 shadow-md shadow-primary/15 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 text-center overflow-hidden border-b border-border/30">
        {/* Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase mb-2">
            <Award className="w-3.5 h-3.5" /> Production-Ready SaaS Platform
          </span>
          
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-foreground">
            The Smart Dining Loop <br />
            For Modern <span className="text-primary italic font-light">Cafes & Bistros</span>
          </h1>
          
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
            Create an online presence, generate dynamic QR codes for table ordering, manage kitchen pipelines in real-time, and track sales metrics seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-full shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all hover:scale-105 text-center flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              Configure Restaurant Now <ChevronRight className="w-4 h-4" />
            </Link>
            
            <Link
              href="/r/central-cafe"
              target="_blank"
              className="w-full sm:w-auto px-8 py-3.5 bg-secondary text-secondary-foreground border border-border/60 font-bold rounded-full transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              Demo Cafe Site <ArrowUpRight className="w-4 h-4 text-primary" />
            </Link>
          </div>
        </div>
      </section>

      {/* Core SaaS Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-primary text-xs font-bold tracking-wider uppercase">Features</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Complete Operations Suite
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            Everything your restaurant needs to automate ordering and analyze business growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Multi-Tenant Setup',
              desc: 'Every restaurant gets its own landing page and menu, fully custom branded.',
              icon: Globe,
            },
            {
              title: 'Contactless QR Menu',
              desc: 'Table-specific dynamic QRs automatically set customer table context.',
              icon: QrCode,
            },
            {
              title: 'Kitchen Dashboard',
              desc: 'Socket.io powered card dashboard optimized for cooking prep pipelines.',
              icon: Tablet,
            },
            {
              title: 'Sales Analytics',
              desc: 'Revenue lines, popular food items, and peak busy hours tracking charts.',
              icon: BarChart3,
            },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <Card key={i} className="border border-border/60 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-foreground">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Interactive Flow visual */}
      <section className="py-20 bg-stone-50 dark:bg-stone-900/30 border-y border-border/30">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-12">
          <div className="space-y-2">
            <span className="text-primary text-xs font-bold tracking-wider uppercase">How It Works</span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">Ordering Loop Lifecycle</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 text-sm">
            {[
              { step: '1', title: 'Scan Table QR', desc: 'Customer sits, scans table QR, and lands on table-specific menu.' },
              { step: '2', title: 'OTP & Checkout', desc: 'Customer selects item customizations, verifies phone via OTP, and checks out.' },
              { step: '3', title: 'Cook & Bill', desc: 'Kitchen accepts the real-time order, serves, completes order, and prints GST bill.' },
            ].map((s, i) => (
              <div key={i} className="space-y-3 p-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center mx-auto shadow-md">
                  {s.step}
                </div>
                <h4 className="font-bold text-foreground">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-16 text-center border-t border-border bg-stone-900 text-stone-400">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="flex items-center justify-center gap-2 text-stone-100">
            <Coffee className="w-7 h-7 text-primary" />
            <span className="font-serif font-black text-xl">CafeFlow</span>
          </div>
          
          <p className="text-xs max-w-sm mx-auto text-stone-500">
            SaaS Table Ordering platform built with Next.js 15, Express.js, Socket.io, and MongoDB.
          </p>

          <div className="flex justify-center gap-6 text-xs font-semibold pt-4">
            <Link href="/login" className="hover:text-primary transition-colors">Partner Sign In</Link>
            <Link href="/r/central-cafe" className="hover:text-primary transition-colors">Central Cafe Demo</Link>
            <Link href="/r/central-cafe/menu/table/3" className="hover:text-primary transition-colors">Sample Table 3 Scan</Link>
          </div>

          <div className="text-[10px] text-stone-600 pt-6">
            &copy; {new Date().getFullYear()} CafeFlow SaaS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
