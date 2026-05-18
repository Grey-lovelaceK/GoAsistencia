import { useState, useEffect } from "react";

export interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    lat: null, lng: null, accuracy: null, error: null, loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ lat: null, lng: null, accuracy: null, error: "Geolocalización no disponible", loading: false });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        }),
      (err) =>
        setState((prev) => ({ ...prev, error: err.message, loading: false })),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
