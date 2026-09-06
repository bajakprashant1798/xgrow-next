'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Download,
  Terminal,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getServices, getPricingPlans, getProjects, getClients } from '@/lib/db';

export default function SettingsPage() {
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [stats, setStats] = useState({ services: 0, plans: 0, projects: 0, clients: 0 });

  useEffect(() => {
    setSupabaseReady(isSupabaseConfigured());
    async function loadStats() {
      const [s, p, pr, c] = await Promise.all([
        getServices(),
        getPricingPlans(),
        getProjects(),
        getClients(),
      ]);
      setStats({
        services: s.length,
        plans: p.length,
        projects: pr.length,
        clients: c.length,
      });
    }
    loadStats();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleExportData = async () => {
    const [s, p, pr, c] = await Promise.all([
      getServices(),
      getPricingPlans(),
      getProjects(),
      getClients(),
    ]);
    const payload = JSON.stringify({ services: s, pricing: p, projects: pr, clients: c }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xgro-agency-data-${Date.now()}.json`;
    a.click();
    toast.success('Agency database export downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-cyan" />
          Database & System Configuration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Review Supabase PostgreSQL connectivity, Row-Level Security, and system storage state.
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-foreground">Supabase PostgreSQL</h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                    supabaseReady
                      ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                      : 'border-cyan/40 text-cyan bg-cyan/10'
                  }`}
                >
                  {supabaseReady ? 'Connected to Live DB' : 'Hybrid Local + Reactive Engine'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {supabaseReady
                  ? 'All records are synchronizing with your live Supabase cloud database.'
                  : 'Operating in ultra-fast hybrid reactive mode with zero-latency storage and instant state updates.'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportData}
            variant="outline"
            className="rounded-full text-xs font-bold border-border"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-cyan" /> Export Data JSON
          </Button>
        </div>

        {/* 3 Step Connection Guide */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            How to Connect Your Supabase Project (3 Easy Steps)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-surface/50 border border-border space-y-2">
              <span className="text-[10px] font-black uppercase text-cyan px-2 py-0.5 rounded bg-cyan/10">
                Step 1
              </span>
              <h5 className="font-bold text-xs text-foreground">Set Environment Variables</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add your Supabase project keys in <code className="text-cyan">.env.local</code>:
              </p>
              <div className="p-2 rounded-lg bg-card text-[10px] font-mono border border-border/80 text-foreground overflow-x-auto">
                NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co<br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-surface/50 border border-border space-y-2">
              <span className="text-[10px] font-black uppercase text-cyan px-2 py-0.5 rounded bg-cyan/10">
                Step 2
              </span>
              <h5 className="font-bold text-xs text-foreground">Run 1-Click SQL Migration</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Copy the schema from <code className="text-cyan">supabase/schema.sql</code> and paste it into the Supabase SQL Editor.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy('supabase/schema.sql')}
                className="w-full text-[11px] rounded-xl h-8 font-semibold"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy File Path
              </Button>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-surface/50 border border-border space-y-2">
              <span className="text-[10px] font-black uppercase text-cyan px-2 py-0.5 rounded bg-cyan/10">
                Step 3
              </span>
              <h5 className="font-bold text-xs text-foreground">Instant Sync & RLS</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The platform will automatically route all queries to Postgres with Row Level Security for client isolation!
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold">
                <ShieldCheck className="h-4 w-4" /> Ready for Production
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Storage & Table Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Services Stored</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.services}</p>
        </Card>
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pricing Tiers</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.plans}</p>
        </Card>
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Projects</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.projects}</p>
        </Card>
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client Profiles</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.clients}</p>
        </Card>
      </div>
    </div>
  );
}
