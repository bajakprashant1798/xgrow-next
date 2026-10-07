'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ArrowUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Trash2,
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
import { getActiveClient } from '@/lib/client-auth';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  clearAllClientNotifications,
  syncClientDueDatesNotifications,
  subscribeToDataChanges,
} from '@/lib/db';
import { ClientModel, NotificationModel } from '@/lib/supabase/types';
import { Logo } from '@/components/site/Logo';
import { useAuth } from '@/lib/auth-context';

function formatNotificationTime(dateStr?: string) {
  if (!dateStr) return 'Recent';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { user, isLoading, signOut, isAdmin, isTeam } = useAuth();

  const [activeClient, setActiveClient] = useState<ClientModel | null>(null);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // If we're on the /client/login page, don't render portal header
  const isLoginPage = pathname === '/client/login';

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 280;
      setShowScrollTop((prev) => (prev !== shouldShow ? shouldShow : prev));

      const sectionIds = ['billing', 'invoices', 'support', 'updates', 'milestones', 'services'];
      const scrollPos = window.scrollY + 200;

      // Check if near the very bottom of the page
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
        setActiveSection((prev) => (prev !== 'billing' ? 'billing' : prev));
        return;
      }

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          const target = id === 'invoices' || id === 'support' ? 'billing' : id;
          setActiveSection((prev) => (prev !== target ? target : prev));
          return;
        }
      }
      setActiveSection((prev) => (prev !== 'dashboard' ? 'dashboard' : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    setActiveSection('dashboard');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash) {
        window.history.replaceState(null, '', '/client');
      }
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id === 'invoices' || id === 'support' ? 'billing' : id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  };

  useEffect(() => {
    if (isLoginPage) return;

    if (!isLoading && !user) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('xgro_current_auth_user') : null;
      if (!stored) {
        router.replace('/login');
        return;
      }
    }

    let isMounted = true;

    async function load() {
      const client = await getActiveClient();
      if (!isMounted) return;
      setActiveClient(client);

      if (client) {
        const notifs = await getNotifications(client.id, client.email);
        if (isMounted) {
          setNotifications(notifs);
        }
      }
    }

    load();

    // One-time background due date check on mount
    getActiveClient().then((c) => {
      if (c && isMounted) {
        syncClientDueDatesNotifications(c).then(() => {
          if (isMounted) load();
        });
      }
    });

    const unsubscribe = subscribeToDataChanges(load);
    const onFocus = () => {
      if (isMounted) load();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onFocus);
    const interval = setInterval(load, 15000);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onFocus);
      clearInterval(interval);
    };
  }, [isLoginPage, isLoading, user, router]);

  const handleMarkAllRead = async () => {
    if (activeClient) {
      await markAllNotificationsAsRead(activeClient.id, activeClient.email);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = async () => {
    if (activeClient) {
      await clearAllClientNotifications(activeClient.id, activeClient.email);
      setNotifications([]);
    }
  };

  const handleNotificationClick = async (notif: NotificationModel) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }

    if (notif.link) {
      if (notif.link.includes('#')) {
        const hash = notif.link.split('#')[1];
        scrollToSection(hash);
      } else {
        router.push(notif.link);
      }
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
      <header className="h-16 sm:h-20 border-b border-border bg-card/90 backdrop-blur-xl px-3.5 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors gap-2">
        {/* Brand Logo & Client Badge */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">
          <Logo
            href="/client"
            onClick={handleScrollToTop}
            badge="Client Portal"
            subtitle={activeClient?.company_name || 'Project Workspace'}
          />
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-surface/60 p-1 rounded-full border border-border">
          <button
            onClick={handleScrollToTop}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeSection === 'dashboard'
                ? 'bg-cyan text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => scrollToSection('services')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeSection === 'services'
                ? 'bg-cyan text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Our Services
          </button>
          <button
            onClick={() => scrollToSection('milestones')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeSection === 'milestones'
                ? 'bg-cyan text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => scrollToSection('updates')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeSection === 'updates'
                ? 'bg-cyan text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Project Updates
          </button>
          <button
            onClick={() => scrollToSection('billing')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeSection === 'billing'
                ? 'bg-cyan text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Billing & Support
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full border-border bg-surface/60"
              >
                <Bell className="h-4 w-4 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-cyan text-[10px] font-black text-slate-950 shadow-md ring-2 ring-background z-20 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 rounded-2xl p-2 shadow-2xl border-border bg-card/95 backdrop-blur-xl">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Project Alerts & Updates</span>
                  {unreadCount > 0 && (
                    <span className="bg-cyan/15 text-cyan text-[10px] font-black px-2 py-0.5 rounded-full border border-cyan/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-cyan font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-[10px] text-muted-foreground hover:text-destructive hover:underline"
                      title="Clear all notifications"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/60 py-1 space-y-0.5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                    <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-semibold text-foreground">No new notifications</p>
                    <p className="text-[11px]">Due dates and project changes will alert here.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isDueDate = n.type === 'due_date' || n.title.toLowerCase().includes('due') || n.title.toLowerCase().includes('delivery') || n.title.toLowerCase().includes('completion');
                    const isInvoice = n.type === 'invoice' || n.title.toLowerCase().includes('invoice') || n.title.toLowerCase().includes('quotation');
                    const isTimeline = n.type === 'service_timeline' || n.title.toLowerCase().includes('timeline') || n.title.toLowerCase().includes('scope');

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`group p-3 text-xs rounded-xl transition-all cursor-pointer hover:bg-surface/80 relative ${
                          !n.is_read ? 'bg-cyan/5 border-l-2 border-cyan' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isDueDate
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : isInvoice
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isTimeline
                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                              : 'bg-cyan/15 text-cyan border border-cyan/30'
                          }`}>
                            {isDueDate ? (
                              <Clock className="h-3.5 w-3.5" />
                            ) : isInvoice ? (
                              <FileText className="h-3.5 w-3.5" />
                            ) : isTimeline ? (
                              <Sparkles className="h-3.5 w-3.5" />
                            ) : (
                              <FolderKanban className="h-3.5 w-3.5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-foreground text-[12px] truncate">
                                {n.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                {formatNotificationTime(n.created_at)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            {n.link && (
                              <span className="mt-1 text-[10px] text-cyan font-semibold flex items-center gap-1 hover:underline">
                                View details →
                              </span>
                            )}
                          </div>

                          {/* Delete Action Button */}
                          <button
                            onClick={(e) => handleDeleteNotification(e, n.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground p-1 transition-opacity absolute right-2 top-3 rounded-md hover:bg-destructive/10"
                            title="Delete notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
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
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full border-border bg-surface/60"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </Button>

          {/* Client Account Menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1 sm:pl-2 focus:outline-none">
                <div className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-cyan to-indigo-500 p-0.5 shadow-sm">
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
            <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5 shadow-xl bg-card/95 backdrop-blur-xl z-50 border-border">
              <DropdownMenuLabel>
                <p className="text-xs font-bold text-foreground">{activeClient?.name || user?.name}</p>
                <p className="text-[10px] text-muted-foreground">{activeClient?.email || user?.email}</p>
                {(activeClient?.company_name || user?.company_name) && (
                  <p className="text-[10px] text-cyan font-medium mt-0.5">{activeClient?.company_name || user?.company_name}</p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(isAdmin || isTeam) && user?.role !== 'client' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2 text-xs py-2 cursor-pointer font-semibold text-cyan">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan" /> Return to Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs py-2 text-destructive cursor-pointer font-medium"
              >
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar (Sticky & Horizontally Scrollable) */}
      <div className="md:hidden border-b border-border bg-card/85 backdrop-blur-md px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar sticky top-16 sm:top-20 z-30 shadow-sm">
        <button
          onClick={handleScrollToTop}
          className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
            activeSection === 'dashboard'
              ? 'bg-cyan text-slate-950 shadow-sm'
              : 'bg-surface/80 text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => scrollToSection('services')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
            activeSection === 'services'
              ? 'bg-cyan text-slate-950 shadow-sm'
              : 'bg-surface/80 text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          Our Services
        </button>
        <button
          onClick={() => scrollToSection('milestones')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
            activeSection === 'milestones'
              ? 'bg-cyan text-slate-950 shadow-sm'
              : 'bg-surface/80 text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          Milestones
        </button>
        <button
          onClick={() => scrollToSection('updates')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
            activeSection === 'updates'
              ? 'bg-cyan text-slate-950 shadow-sm'
              : 'bg-surface/80 text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          Updates
        </button>
        <button
          onClick={() => scrollToSection('billing')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
            activeSection === 'billing'
              ? 'bg-cyan text-slate-950 shadow-sm'
              : 'bg-surface/80 text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          Billing & Support
        </button>
      </div>

      {/* Main Client Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full bg-cyan text-slate-950 font-bold shadow-lg shadow-cyan/25 flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in duration-200 border border-cyan/40"
          title="Scroll to Top"
          aria-label="Scroll to Top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:px-8 text-center text-xs text-muted-foreground bg-card/30">
        <p>
          © 2026 XGRO Agency. Need assistance with your project? Contact your dedicated manager on WhatsApp: +91 63953 19725.
        </p>
      </footer>
    </div>
  );
}
