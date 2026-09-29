'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  Users,
  Layers,
  Clock,
  Activity,
  ArrowUpRight,
  Plus,
  ChevronRight,
  TrendingUp,
  Sparkles,
  DollarSign,
  AlertCircle,
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getProjects,
  getServices,
  getTeamMembers,
  getClients,
  subscribeToDataChanges,
} from '@/lib/db';
import { ProjectModel, ServiceModel, TeamMemberModel, ClientModel } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';

export default function AdminDashboardPage() {
  const { user, isAdmin, hasPermission } = useAuth();
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [team, setTeam] = useState<TeamMemberModel[]>([]);
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [p, s, t, c] = await Promise.all([
        getProjects(),
        getServices(),
        getTeamMembers(),
        getClients(),
      ]);
      setProjects(p);
      setServices(s);
      setTeam(t);
      setClients(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Compute key dashboard metrics
  const activeProjects = projects.filter((p) => p.status !== 'completed' && p.status !== 'delivered');
  const completedProjects = projects.filter((p) => p.status === 'completed' || p.status === 'delivered');
  const totalEmployees = team.length;
  const totalServices = services.length;
  
  // Pending tasks across all projects
  const allTasks = projects.flatMap((p) => p.tasks || []);
  const pendingTasks = allTasks.filter((t) => t.status !== 'done');

  // Total project pipeline value
  const totalValue = projects.reduce((acc, p) => acc + (p.project_value || 0), 0);

  // Recent activities & updates
  const recentUpdates = projects
    .flatMap((p) => (p.updates || []).map((u) => ({ ...u, projectName: p.project_name })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-card via-surface to-card border border-border/80 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-cyan animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan">
              Live Agency Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to XGRO Command Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
            Monitor active client pipelines, manage dynamic services, update milestones, and review employee tasks in real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {(isAdmin || hasPermission('projects', 'create_edit')) && (
            <Button asChild className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm">
              <Link href="/admin/projects">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Project
              </Link>
            </Button>
          )}
          {(isAdmin || hasPermission('services', 'view')) && (
            <Button asChild variant="outline" className="rounded-full text-xs font-semibold border-border">
              <Link href="/admin/services">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-cyan" /> Services CMS
              </Link>
            </Button>
          )}
          {!isAdmin && hasPermission('tasks', 'view') && (
            <Button asChild variant="outline" className="rounded-full text-xs font-semibold border-border">
              <Link href="/admin/team">
                <Users className="h-3.5 w-3.5 mr-1.5 text-cyan" /> Team Tasks
              </Link>
            </Button>
          )}
        </div>
        {/* Glow backdrop */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Active Projects */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/40 transition-all">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Projects
              </span>
              <div className="h-7 w-7 rounded-lg bg-cyan/15 text-cyan flex items-center justify-center">
                <FolderKanban className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading && projects.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded-lg my-0.5" />
            ) : (
              <div className="text-2xl font-extrabold text-foreground">{activeProjects.length}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-bold">● In progress</span>
            </p>
          </CardContent>
        </Card>

        {/* Completed Projects */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/40 transition-all">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Completed
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading && projects.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded-lg my-0.5" />
            ) : (
              <div className="text-2xl font-extrabold text-foreground">{completedProjects.length}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Shipped & Delivered</p>
          </CardContent>
        </Card>

        {/* Total Employees */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/40 transition-all">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Employees
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading && team.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded-lg my-0.5" />
            ) : (
              <div className="text-2xl font-extrabold text-foreground">{totalEmployees}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Design, Dev & SEO</p>
          </CardContent>
        </Card>

        {/* Total Services */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/40 transition-all">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Services
              </span>
              <div className="h-7 w-7 rounded-lg bg-cyan/15 text-cyan flex items-center justify-center">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading && services.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded-lg my-0.5" />
            ) : (
              <div className="text-2xl font-extrabold text-foreground">{totalServices}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Active on CMS</p>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/40 transition-all">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Pending Tasks
              </span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading && projects.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded-lg my-0.5" />
            ) : (
              <div className="text-2xl font-extrabold text-foreground">{pendingTasks.length}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Assigned to team</p>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/40 transition-all">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Pipeline Value
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading && projects.length === 0 ? (
              <Skeleton className="h-7 w-16 rounded-lg my-0.5" />
            ) : (
              <div className="text-xl font-extrabold text-foreground">
                ₹{(totalValue / 1000).toFixed(0)}k
              </div>
            )}
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Active Projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Active Projects & Milestones + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Projects Progress Table & Stages */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Active Projects & Progress
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Monitor live progress percentages, stages, and assigned leads.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-cyan font-bold hover:bg-cyan/10 rounded-full">
                <Link href="/admin/projects" className="flex items-center gap-1">
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6 pt-0 divide-y divide-border">
              {loading && projects.length === 0 ? (
                <div className="py-4 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex justify-between items-center py-2">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-44 rounded-md" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                      </div>
                      <Skeleton className="h-8 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No active projects found.
                </div>
              ) : (
                projects.map((project) => {
                const completedMs = (project.milestones || []).filter((m) => m.status === 'completed').length;
                const totalMs = (project.milestones || []).length;

                return (
                  <div key={project.id} className="py-4 first:pt-0 last:pb-0 group">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/projects/${project.id}`}
                            className="font-bold text-sm text-foreground hover:text-cyan transition-colors"
                          >
                            {project.project_name}
                          </Link>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0 border-cyan/30 text-cyan bg-cyan/10"
                          >
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                          <span>Client: <strong className="text-foreground">{project.client?.name || 'Assigned Client'}</strong></span>
                          <span>•</span>
                          <span>Service: {project.service_name}</span>
                          <span>•</span>
                          <span className="text-cyan font-semibold">
                            PM: {project.assigned_manager?.name || team.find(t => t.id === project.assigned_manager_id)?.name || 'Prashant Bajak'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-foreground">
                            {project.progress_percentage}%
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {completedMs}/{totalMs} Milestones
                          </span>
                        </div>
                        <Button asChild size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs border-border">
                          <Link href={`/admin/projects/${project.id}`}>
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }))}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(isAdmin || hasPermission('services', 'view')) && (
              <Link
                href="/admin/services"
                className="p-5 rounded-2xl border border-border bg-card/60 hover:border-cyan/50 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-cyan/15 text-cyan flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Services CMS</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Add, edit pricing, features, SEO info and order of services.
                </p>
              </Link>
            )}

            {(isAdmin || hasPermission('pricing', 'view')) && (
              <Link
                href="/admin/pricing"
                className="p-5 rounded-2xl border border-border bg-card/60 hover:border-cyan/50 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Pricing Plans</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage Starter, Growth & Scale plans, badges, and pricing cards.
                </p>
              </Link>
            )}

            {(isAdmin || hasPermission('cms_content', 'view')) && (
              <Link
                href="/admin/cms"
                className="p-5 rounded-2xl border border-border bg-card/60 hover:border-cyan/50 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Website Testimonials</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Edit reviews, client quotes, and frequently asked questions.
                </p>
              </Link>
            )}

            {(isAdmin || hasPermission('invoices', 'view')) && (
              <Link
                href="/admin/invoices"
                className="p-5 rounded-2xl border border-border bg-card/60 hover:border-cyan/50 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Invoices & Billing</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Issue branded invoices, quotations, and track payments.
                </p>
              </Link>
            )}

            {(isAdmin || hasPermission('team_roles', 'view')) && (
              <Link
                href="/admin/team"
                className="p-5 rounded-2xl border border-border bg-card/60 hover:border-cyan/50 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-cyan/15 text-cyan flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Team & Tasks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Oversee team members, assign tasks, and track statuses.
                </p>
              </Link>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Project Activities & Updates */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan" />
                  Recent Activities
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                  Live Log
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Latest updates posted to client dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 divide-y divide-border">
              {recentUpdates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No recent activities recorded.
                </p>
              ) : (
                recentUpdates.map((act) => (
                  <div key={act.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground truncate max-w-[170px]">
                        {act.projectName}
                      </span>
                      {act.progress_percent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan/10 text-cyan">
                          {act.progress_percent}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground/90 mt-1">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      "{act.message}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 mt-2">
                      <span>By {act.author_name}</span>
                      <span>
                        {new Date(act.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Team Workload Summary */}
          <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan" />
                Team Workload
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {team.slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center font-bold text-[11px] text-cyan">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
