'use client';

import { FormEvent, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { MapPicker } from '@/components/MapPicker';
import { LatLng } from '@/lib/geo';
import { generateOtp } from '@/lib/otp';

export const DonationForm = () => {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [quantityKg, setQuantityKg] = useState(5);
  const [bestBefore, setBestBefore] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successOtp, setSuccessOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is disabled in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setError(null);
      },
      () => setError('Unable to read your location. Allow location access and retry.')
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Add a food photo. It helps volunteers assess freshness quickly.');
      return;
    }
    if (!coords) {
      setError('Drop a map pin or use your location so we can find you.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const storageRef = ref(storage, `donations/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);
      const otpCode = generateOtp();
      const donationRef = await addDoc(collection(db, 'donations'), {
        donorId: user.uid,
        donorName: user.displayName ?? user.email,
        itemName,
        quantityKg,
        meals: quantityKg * 4,
        bestBefore: bestBefore ? new Date(bestBefore).toISOString() : null,
        address,
        coords,
        photoUrl,
        status: 'open',
        otpCode,
        createdAt: serverTimestamp(),
      });

      setItemName('');
      setQuantityKg(5);
      setBestBefore('');
      setAddress('');
      setCoords(null);
      setFile(null);
      setSuccessOtp(otpCode);

      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ donationId: donationRef.id }),
        });
      } catch (notifyError) {
        console.warn('Unable to send push notification', notifyError);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to save donation. Check your Firebase access rules.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Share surplus food</h2>
          <p className="text-sm text-slate-500">Add quantity, freshness, and pickup location.</p>
        </div>
        <button
          type="button"
          onClick={handleLocate}
          className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600"
        >
          Use my location
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {successOtp && (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-700">
          Donation posted! Share this OTP with the volunteer at pickup: <strong>{successOtp}</strong>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Food description
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            required
            placeholder="e.g. Veg biryani trays"
            className="rounded-xl border border-slate-200 px-3 py-3"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Quantity (kg)
          <input
            type="number"
            min={1}
            step={0.5}
            value={quantityKg}
            onChange={(event) => setQuantityKg(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-3"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Best before
          <input
            type="datetime-local"
            value={bestBefore}
            onChange={(event) => setBestBefore(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Pickup address
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 px-3 py-3"
            placeholder="Apartment, landmark, instructions"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Food photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="rounded-xl border border-dashed border-slate-300 px-3 py-3"
            required
          />
        </label>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-600">Drop an exact pin</p>
        <div className="mt-2">
          <MapPicker value={coords} onChange={setCoords} />
        </div>
        {coords && (
          <p className="mt-2 text-xs text-slate-500">Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}</p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? 'Publishing...' : 'Publish donation'}
        </button>
        <p className="text-sm text-slate-500">Estimated meals rescued: {Math.round(quantityKg * 4)}</p>
      </div>
    </form>
  );
};
