import { AuthGate } from '@/components/AuthGate';
import { RoleGate } from '@/components/RoleGate';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  return (
    <AuthGate>
      <RoleGate role="admin">
        <AdminDashboard />
      </RoleGate>
    </AuthGate>
  );
}
