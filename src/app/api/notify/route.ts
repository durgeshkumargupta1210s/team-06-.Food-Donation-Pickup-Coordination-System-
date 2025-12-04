import { NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebaseAdmin';
import { haversineDistance } from '@/lib/geo';

const MAX_DISTANCE_KM = 5;

export async function POST(request: Request) {
  try {
    const { donationId } = await request.json();
    if (!donationId) {
      return NextResponse.json({ error: 'donationId is required' }, { status: 400 });
    }

    const donationSnap = await adminDb.collection('donations').doc(donationId).get();
    if (!donationSnap.exists) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    const donation = donationSnap.data();
    if (!donation) {
      return NextResponse.json({ error: 'Donation payload missing' }, { status: 422 });
    }
    const donationCoords = donation?.coords;
    const tokensSnap = await adminDb.collection('notificationTokens').get();
    const targets = tokensSnap.docs
      .map((doc) => doc.data())
      .filter((token) => token.token)
      .filter((token) => {
        if (!donationCoords || !token.coords) return true;
        return haversineDistance(donationCoords, token.coords) <= MAX_DISTANCE_KM + 0.3;
      });

    if (!targets.length) {
      return NextResponse.json({ delivered: 0, message: 'No volunteer tokens stored yet.' });
    }

    await adminMessaging.sendEachForMulticast({
      tokens: targets.map((token) => token.token),
      notification: {
        title: `${donation.itemName} nearby (${donation.quantityKg} kg)`,
        body: `${donation.donorName ?? 'Donor'} · ${donation.address}`,
      },
      data: {
        donationId,
        itemName: donation.itemName,
        quantityKg: String(donation.quantityKg),
      },
    });

    return NextResponse.json({ delivered: targets.length });
  } catch (error) {
    console.error('[notify] error', error);
    return NextResponse.json({ error: 'FCM not configured' }, { status: 500 });
  }
}
