'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  CreditCard,
  Briefcase,
  Users,
  UserCheck,
  FileText,
  Settings,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FolderKanban,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/site/Logo';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: SidebarItem[] = [
  {
    title: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users Management',
    href: '/admin/users',
    icon: Users,
    badge: 'Admin',
  },
  {
    title: 'Client Accounts',
    href: '/admin/clients',
    icon: Building,
  },
  {
    title: 'Services CMS',
    href: '/admin/services',
    icon: Layers,
  },
  {
    title: 'Pricing Plans',
    href: '/admin/pricing',
    icon: CreditCard,
  },
  {
    title: 'Projects & Milestones',
    href: '/admin/projects',
    icon: FolderKanban,
    badge: 'Live',
  },
  {
    title: 'Team & Tasks',
    href: '/admin/team',
    icon: UserCheck,
  },
  {
    title: 'Roles & Permissions',
    href: '/admin/roles',
    icon: ShieldCheck,
  },
  {
    title: 'Website CMS',
    href: '/admin/cms',
    icon: FileText,
  },
  {
    title: 'Database & Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col justify-between hidden md:flex h-screen sticky top-0 overflow-y-auto z-40">
      <div>
        {/* Logo & Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-border">
          <Logo href="/admin" badge="Admin" subtitle="Agency Control Center" />
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1.5">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Core Management
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:bg-cyan dark:text-cyan-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-primary-foreground dark:text-cyan-foreground' : 'text-cyan'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 uppercase font-extrabold tracking-wider ${
                      isActive
                        ? 'border-transparent bg-white/20 text-white dark:bg-black/20 dark:text-black'
                        : 'border-cyan/30 bg-cyan/10 text-cyan'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Quick Switchers */}
      <div className="p-4 border-t border-border bg-surface/40 m-4 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
          <span>Portals</span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <Link
          href="/client"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-card border border-border text-foreground hover:border-cyan/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
            Client Portal
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-card/50 border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <span>View Public Site</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
