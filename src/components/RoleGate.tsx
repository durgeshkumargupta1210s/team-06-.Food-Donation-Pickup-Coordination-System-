'use client';

import { ReactNode, useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';

const ROLES: { value: UserRole; label: string; helper: string }[] = [
  { value: 'donor', label: 'Donor', helper: 'Post surplus food and share OTP at pickup.' },
  { value: 'volunteer', label: 'Volunteer / NGO', helper: 'Claim nearby donations and deliver them safely.' },
  { value: 'admin', label: 'Admin', helper: 'Track system health and metrics.' },
];

export const RoleGate = ({ role, children }: { role: UserRole; children: ReactNode }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-slate-500">
        Loading workspace…
      </div>
    );
  }

  if (profile?.role === role) {
    return <>{children}</>;
  }

  return <RoleSelector desiredRole={role} />;
};

const RoleSelector = ({ desiredRole }: { desiredRole: UserRole }) => {
  const { updateRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(desiredRole);
  const [organization, setOrganization] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async () => {
    setSubmitting(true);
    await updateRole(selectedRole, organization);
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">Choose how you want to help</h2>
      <p className="mt-2 text-slate-500">
        Pick the workspace you need today. You can always switch later from the header menu.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {ROLES.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => setSelectedRole(role.value)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedRole === role.value
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 hover:border-emerald-200'
            }`}
          >
            <p className="text-lg font-semibold">{role.label}</p>
            <p className="text-sm text-slate-500">{role.helper}</p>
          </button>
        ))}
      </div>

      {selectedRole !== 'admin' && (
        <div className="mt-6">
          <label className="text-sm font-medium text-slate-600">Organization (optional)</label>
          <input
            type="text"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            placeholder="e.g. Community Kitchen #9"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleUpdate}
        className="mt-6 w-full rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : `Switch to ${selectedRole}`}
      </button>
    </div>
  );
};
