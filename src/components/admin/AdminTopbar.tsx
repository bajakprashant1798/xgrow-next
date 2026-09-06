'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  Plus,
  Layers,
  FolderKanban,
  CreditCard,
  User,
  LogOut,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getNotifications, markAllNotificationsAsRead } from '@/lib/db';
import { NotificationModel } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';

export function AdminTopbar() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    async function loadNotifs() {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <header className="h-20 border-b border-border bg-card/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="relative w-full max-w-md hidden sm:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects, services, clients, tasks (⌘K)..."
          className="pl-10 pr-4 h-10 rounded-full bg-surface/60 border-border/80 text-xs focus-visible:ring-cyan"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Quick Action Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-4 h-9 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Quick Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Add New
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/admin/projects" className="flex items-center gap-2 cursor-pointer font-medium text-xs py-2">
                <FolderKanban className="h-4 w-4 text-cyan" /> New Client Project
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/services" className="flex items-center gap-2 cursor-pointer font-medium text-xs py-2">
                <Layers className="h-4 w-4 text-cyan" /> Add Service
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/pricing" className="flex items-center gap-2 cursor-pointer font-medium text-xs py-2">
                <CreditCard className="h-4 w-4 text-cyan" /> Add Pricing Tier
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              <span className="text-xs font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-cyan font-bold hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border py-1">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className={`p-3 text-xs ${!n.is_read ? 'bg-cyan/5' : ''}`}>
                    <div className="flex items-center justify-between font-semibold text-foreground">
                      <span>{n.title}</span>
                      {!n.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                      )}
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

        {/* View Public Website Shortcut */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:inline-flex rounded-full text-xs font-semibold h-9 px-3.5 border-border bg-surface/60 hover:bg-secondary"
        >
          <Link href="/" target="_blank" className="flex items-center gap-1.5">
            <span>Public Site</span>
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

        {/* User Profile Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 focus:outline-none">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan to-indigo-500 p-0.5 shadow-sm">
                <div className="h-full w-full rounded-full bg-card flex items-center justify-center text-xs font-bold text-cyan">
                  {user ? user.name.slice(0, 2).toUpperCase() : 'PB'}
                </div>
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold leading-none text-foreground">
                  {user?.name || 'Prashant Bajak'}
                </p>
                <p className="text-[10px] text-cyan font-bold mt-0.5">
                  {user?.email === 'bajakprashant1998@gmail.com' ? 'Super Admin' : (user?.role ? user.role.toUpperCase() : 'Admin')}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5 shadow-xl">
            <DropdownMenuLabel>
              <p className="text-xs font-bold">{user?.name || 'Prashant Bajak'}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{user?.email || 'bajakprashant1998@gmail.com'}</p>
              <Badge className="mt-1.5 bg-cyan text-slate-950 text-[9px] uppercase font-black">
                {user?.email === 'bajakprashant1998@gmail.com' ? 'Super Admin' : user?.role || 'Admin'}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" target="_blank" className="flex items-center gap-2 text-xs py-2 cursor-pointer">
                <ExternalLink className="h-3.5 w-3.5 text-cyan" /> View Public Website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center gap-2 text-xs py-2 cursor-pointer">
                <User className="h-3.5 w-3.5 text-cyan" /> Profile & Database Status
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/client" className="flex items-center gap-2 text-xs py-2 cursor-pointer">
                <Sparkles className="h-3.5 w-3.5 text-cyan" /> Switch to Client View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="flex items-center gap-2 text-xs py-2 text-destructive cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
