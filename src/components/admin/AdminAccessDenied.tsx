'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

interface AdminAccessDeniedProps {
  moduleName?: string;
  requiredAction?: string;
}

export function AdminAccessDenied({
  moduleName = 'this section',
  requiredAction,
}: AdminAccessDeniedProps) {
  const { user, role, rolesList } = useAuth();
  const currentRoleObj = rolesList.find((r) => r.key === role || r.id === role);
  const roleName = currentRoleObj?.name || (role ? role.replace('_', ' ').toUpperCase() : 'Staff Member');

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-3xl border-border bg-card/80 backdrop-blur-xl shadow-2xl p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
          <ShieldAlert className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-bold">
            <Lock className="h-3 w-3" /> Access Restricted
          </div>
          <h2 className="text-xl font-bold text-foreground">Permission Required</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current role <span className="font-semibold text-foreground">({roleName})</span> does not have authorization to view or manage <span className="font-semibold text-foreground">{moduleName}</span>.
            {requiredAction && ` (Requires "${requiredAction}" permission).`}
          </p>
        </div>

        <div className="pt-2 border-t border-border flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            variant="default"
            className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs h-9 px-5"
          >
            <Link href="/admin">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-border text-xs h-9 px-5 font-semibold"
          >
            <Link href="/admin/projects">View Assigned Projects</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
