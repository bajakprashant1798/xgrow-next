'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  FolderKanban,
  FileText,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getActiveClient, getActiveClientId } from '@/lib/client-auth';
import { getNotifications, markAllNotificationsAsRead, getClients } from '@/lib/db';
import { ClientModel, NotificationModel } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { user, isLoading, signOut } = useAuth();

  const [activeClient, setActiveClient] = useState<ClientModel | null>(null);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // If we're on the /client/login page, don't render portal header
  const isLoginPage = pathname === '/client/login';

  useEffect(() => {
    if (isLoginPage) return;

    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }

    async function load() {
      const client = await getActiveClient();
      setActiveClient(client);

      if (client) {
        const notifs = await getNotifications(client.id);
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }
    }
    load();
  }, [isLoginPage, isLoading, user, router]);

  const handleMarkAllRead = async () => {
    if (activeClient) {
      await markAllNotificationsAsRead(activeClient.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Authenticating client...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-20 border-b border-border bg-card/60 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        {/* Brand Logo & Client Badge */}
        <div className="flex items-center gap-4">
          <Link href="/client" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan/20 border border-cyan/40 flex items-center justify-center text-cyan font-black text-lg shadow-sm">
              X
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg tracking-tight text-foreground">
                  XGRO
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
                  Client Portal
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                {activeClient?.company_name || 'Project Workspace'}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-surface/60 p-1 rounded-full border border-border">
          <Link
            href="/client"
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              pathname === '/client'
                ? 'bg-cyan text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
          </Link>
          <a
            href="#milestones"
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Milestones
          </a>
          <a
            href="#updates"
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Project Updates
          </a>
          <a
            href="#invoices"
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Invoices & Quotes
          </a>
          <a
            href="#support"
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Assigned Team
          </a>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9 rounded-full border-border bg-surface/60"
              >
                <Bell className="h-4 w-4 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan text-[9px] font-black text-slate-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-2xl border-border">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-bold text-foreground">Project Updates</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-cyan font-bold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border py-1">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 text-xs ${!n.is_read ? 'bg-cyan/5' : ''}`}>
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>{n.title}</span>
                        {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-cyan" />}
                      </div>
                      <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Public Website Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex rounded-full text-xs font-semibold h-9 px-3.5 border-border bg-surface/60 hover:bg-secondary"
          >
            <Link href="/" target="_blank" className="flex items-center gap-1.5">
              <span>Main Website</span>
              <ExternalLink className="h-3 w-3 text-cyan" />
            </Link>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            className="h-9 w-9 rounded-full border-border bg-surface/60"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </Button>

          {/* Client Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 focus:outline-none">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan to-indigo-500 p-0.5 shadow-sm">
                  <div className="h-full w-full rounded-full bg-card flex items-center justify-center text-xs font-bold text-cyan">
                    {activeClient ? activeClient.name.slice(0, 2).toUpperCase() : 'CL'}
                  </div>
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold leading-none text-foreground">
                    {activeClient?.name || 'Client Account'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {activeClient?.company_name || 'Client'}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5 shadow-xl">
              <DropdownMenuLabel>
                <p className="text-xs font-bold">{activeClient?.name}</p>
                <p className="text-[10px] text-muted-foreground">{activeClient?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-2 text-xs py-2 cursor-pointer">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan" /> Switch to Admin Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/client/login" className="flex items-center gap-2 text-xs py-2 cursor-pointer">
                  <ExternalLink className="h-3.5 w-3.5" /> Switch Client Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs py-2 text-destructive cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Client Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:px-8 text-center text-xs text-muted-foreground bg-card/30">
        <p>
          © 2026 XGRO Agency. Need assistance with your project? Contact your dedicated manager on WhatsApp: +91 63953 19725.
        </p>
      </footer>
    </div>
  );
}
