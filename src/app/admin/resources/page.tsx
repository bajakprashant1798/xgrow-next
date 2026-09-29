'use client';

import { AdminResourcesManager } from '@/components/admin/AdminResourcesManager';
import { useAuth } from '@/lib/auth-context';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

export default function AdminResourcesPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canView = isAdmin || hasPermission('cms_content', 'view');

  if (!canView) {
    return <AdminAccessDenied moduleName="Free Resources Hub" requiredAction="View CMS Content" />;
  }

  return (
    <div className="space-y-6">
      <AdminResourcesManager />
    </div>
  );
}
