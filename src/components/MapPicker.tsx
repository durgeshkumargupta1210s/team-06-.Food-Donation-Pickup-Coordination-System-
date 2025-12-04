'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import type { LatLng } from '@/lib/geo';

const mapContainerStyle = { width: '100%', height: '260px', borderRadius: '1rem' } as const;

export const MapPicker = ({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (coords: LatLng) => void;
}) => {
  const [internalCenter, setInternalCenter] = useState<LatLng>(
    value ?? { lat: 12.978369, lng: 77.640833 }
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: apiKey ?? '',
  });

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    setInternalCenter(coords);
    onChange(coords);
  };

  const center = useMemo(() => value ?? internalCenter, [value, internalCenter]);

  if (!apiKey) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map-based pin drops.
      </p>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={14}
      options={{ disableDefaultUI: true, clickableIcons: false }}
      onClick={handleMapClick}
    >
      {center && <MarkerF position={center} />}
    </GoogleMap>
  );
};
