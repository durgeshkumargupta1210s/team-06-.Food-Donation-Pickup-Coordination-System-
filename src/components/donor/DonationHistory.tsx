    'use client';

import { useEffect, useState } from 'react';
import {
  QuerySnapshot,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700' },
  claimed: { label: 'Claimed', color: 'bg-amber-100 text-amber-700' },
  picked_up: { label: 'Picked up', color: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700' },
};

export const DonationHistory = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DocumentData[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'donations'),
      where('donorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      setDonations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  if (!donations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
        Your upcoming donations will show up here with OTP and claim status.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {donations.map((donation) => (
        <div key={donation.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{donation.itemName}</p>
              <p className="text-sm text-slate-500">
                {donation.quantityKg} kg · {donation.meals} meals · Posted{' '}
                {donation.createdAt?.toDate
                  ? formatDistanceToNow(donation.createdAt.toDate(), { addSuffix: true })
                  : 'recently'}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMap[donation.status]?.color}`}>
              {statusMap[donation.status]?.label}
            </span>
          </div>
          <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <p>
              Pickup OTP: <strong>{donation.otpCode}</strong>
            </p>
            <p>Address: {donation.address}</p>
            {donation.claimedByName && (
              <p>Claimed by: {donation.claimedByName}</p>
            )}
            {donation.bestBefore && <p>Best before: {new Date(donation.bestBefore).toLocaleString()}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};
