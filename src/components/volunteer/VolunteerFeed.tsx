'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  QuerySnapshot,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  setDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, messagingPromise, storage } from '@/lib/firebaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { haversineDistance, LatLng } from '@/lib/geo';
import type { DonationRecord } from '@/types/donation';

const RADIUS_KM = 5;

export const VolunteerFeed = () => {
  const { user } = useAuth();
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (!('geolocation' in navigator)) {
      return 'Location is unavailable in this browser.';
    }
    return null;
  });
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [pushStatus, setPushStatus] = useState<'idle' | 'unsupported' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'donations'),
      where('status', 'in', ['open', 'claimed', 'picked_up']),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot: QuerySnapshot) => {
      setDonations(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<DonationRecord, 'id'>),
        }))
      );
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError(null);
      },
      () => setLocationError('Allow location to receive hyper-local requests.')
    );
  }, []);

  const nearbyDonations = useMemo(() => {
    if (!coords) return [];
    return donations
      .map((donation) => ({
        ...donation,
        distance: donation.coords ? haversineDistance(coords, donation.coords) : Infinity,
      }))
      .filter((donation) => donation.distance <= RADIUS_KM);
  }, [coords, donations]);

  const handleClaim = async (donationId: string) => {
    if (!user) return;
    const ref = doc(db, 'donations', donationId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const data = snapshot.data();
      if (!data || data.status !== 'open') {
        throw new Error('Already claimed');
      }
      transaction.update(ref, {
        status: 'claimed',
        claimedBy: user.uid,
        claimedByName: user.displayName ?? user.email,
        claimTimestamp: serverTimestamp(),
      });
    });
  };

  const handleOtpVerify = async (donationId: string) => {
    if (!otpInputs[donationId]) return;
    const snapshot = await getDoc(doc(db, 'donations', donationId));
    const data = snapshot.data();
    if (!data) return;
    if (data.otpCode === otpInputs[donationId]) {
      await updateDoc(snapshot.ref, {
        status: 'picked_up',
        pickupVerifiedAt: serverTimestamp(),
      });
      setOtpInputs((prev) => ({ ...prev, [donationId]: '' }));
    }
  };

  const handleProofUpload = async (
    donationId: string,
    type: 'pickupProofUrl' | 'distributionProofUrl',
    file: File
  ) => {
    if (!user) return;
    setUploading((prev) => ({ ...prev, [donationId]: true }));
    const storageRef = ref(
      storage,
  `proofs/${donationId}/${type}-${file.lastModified}-${file.size}-${file.name}`
    );
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    const updates: Record<string, unknown> = {
      [type]: url,
      lastProofAt: serverTimestamp(),
    };
    if (type === 'distributionProofUrl') {
      updates.status = 'completed';
    }
    await updateDoc(doc(db, 'donations', donationId), updates);
    setUploading((prev) => ({ ...prev, [donationId]: false }));
  };

  const requestPush = async () => {
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
      return;
    }
    const messaging = await messagingPromise;
    if (!messaging) {
      setPushStatus('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setPushStatus('denied');
      return;
    }
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      setPushStatus('unsupported');
      return;
    }
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
    const token = await getToken(messaging, { vapidKey });
    if (token && user) {
      await setDoc(
        doc(db, 'notificationTokens', user.uid),
        {
          token,
          userId: user.uid,
          role: 'volunteer',
          coords,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setPushStatus('granted');
    }
  };

  const subtitle = coords
    ? `Showing donations within ${RADIUS_KM} km of you`
    : 'Enable location for hyper-local requests';

  return (
    <section className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Nearby surplus food</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={requestPush}
            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700"
          >
            {pushStatus === 'granted' ? 'Push ready' : 'Enable push alerts'}
          </button>
        </div>
        {locationError && (
          <p className="mt-2 text-sm text-rose-600">{locationError}</p>
        )}
      </header>

      {!nearbyDonations.length && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Nothing within {RADIUS_KM} km yet. Stay online—new donations trigger a browser push instantly.
        </div>
      )}

      <div className="space-y-4">
        {nearbyDonations.map((donation) => (
          <article key={donation.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{donation.itemName}</p>
                <p className="text-sm text-slate-500">
                  {donation.quantityKg} kg ({donation.meals} meals) · {donation.distance.toFixed(1)} km away
                </p>
              </div>
              {donation.status === 'open' && (
                <button
                  type="button"
                  onClick={() => handleClaim(donation.id)}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Claim & lock
                </button>
              )}
              {donation.status !== 'open' && (
                <span className="text-xs font-semibold uppercase text-amber-600">
                  {donation.status.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <p>Pickup OTP from donor: keep it secret!</p>
              <p>Address: {donation.address}</p>
              {donation.bestBefore && <p>Best before: {new Date(donation.bestBefore).toLocaleString()}</p>}
            </div>

            {donation.status === 'claimed' && donation.claimedBy === user?.uid && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold">Enter OTP to confirm pickup</p>
                <div className="mt-2 flex gap-3">
                  <input
                    value={otpInputs[donation.id] ?? ''}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setOtpInputs((prev) => ({ ...prev, [donation.id]: event.target.value }))
                    }
                    placeholder="6-digit OTP"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleOtpVerify(donation.id)}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {donation.status === 'picked_up' && donation.claimedBy === user?.uid && (
              <div className="mt-4 space-y-3 rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold">Upload proof</p>
                <label className="flex flex-col gap-2 text-sm font-medium text-emerald-700">
                  Pickup photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleProofUpload(donation.id, 'pickupProofUrl', file);
                      }
                    }}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-emerald-700">
                  Distribution proof
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleProofUpload(donation.id, 'distributionProofUrl', file);
                      }
                    }}
                  />
                </label>
                {uploading[donation.id] && <p className="text-sm text-emerald-700">Uploading proof…</p>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
