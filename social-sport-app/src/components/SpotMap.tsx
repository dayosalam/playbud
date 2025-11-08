import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Spot } from "@/data/spots";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface SpotMapProps {
  spots: Spot[];
  selectedSpotId?: string | null;
  onMarkerClick?: (spotId: string) => void;
  defaultCenter?: [number, number];
}

export function SpotMap({
  spots,
  selectedSpotId,
  onMarkerClick,
  defaultCenter,
}: SpotMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<
    Array<{ id: string; marker: mapboxgl.Marker; element: HTMLElement }>
  >([]);
  const initialCenterRef = useRef<[number, number]>(
    defaultCenter ?? [-0.118092, 51.509865]
  );
  const spotsCount = spots.length;

  const center = useMemo<[number, number]>(() => {
    if (spots.length === 0) {
      return defaultCenter ?? [-0.118092, 51.509865]; // London fallback
    }

    const avgLng =
      spots.reduce((sum, spot) => sum + (spot.lng ?? 0), 0) / spots.length;
    const avgLat =
      spots.reduce((sum, spot) => sum + (spot.lat ?? 0), 0) / spots.length;

    if (Number.isFinite(avgLng) && Number.isFinite(avgLat)) {
      return [avgLng, avgLat];
    }

    return defaultCenter ?? [-0.118092, 51.509865];
  }, [spots, defaultCenter]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) {
      return;
    }

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenterRef.current,
      zoom: 10,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      markersRef.current.forEach((entry) => entry.marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !MAPBOX_TOKEN) {
      return;
    }

    mapRef.current.easeTo({ center });
  }, [center]);

  useEffect(() => {
    if (!mapRef.current || !MAPBOX_TOKEN || !defaultCenter || spotsCount > 0) {
      return;
    }

    mapRef.current.easeTo({ center: defaultCenter, zoom: 11 });
  }, [defaultCenter, spotsCount]);

  useEffect(() => {
    if (!mapRef.current || !MAPBOX_TOKEN) {
      return;
    }

    markersRef.current.forEach((entry) => entry.marker.remove());
    markersRef.current = [];

    if (spots.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    spots.forEach((spot) => {
      if (!Number.isFinite(spot.lng) || !Number.isFinite(spot.lat)) {
        return;
      }

      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "w-8 h-8 rounded-full border border-white bg-primary text-white shadow-lg flex items-center justify-center text-xs font-semibold transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40";
      el.dataset.spotId = spot.id;
      el.textContent = spot.sportCode?.slice(0, 2).toUpperCase() || "SP";

      el.addEventListener("click", () => {
        onMarkerClick?.(spot.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([spot.lng, spot.lat])
        .addTo(mapRef.current as mapboxgl.Map);

      markersRef.current.push({ id: spot.id, marker, element: el });
      bounds.extend([spot.lng, spot.lat]);
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
  }, [spots, onMarkerClick]);

  useEffect(() => {
    if (!mapRef.current || !MAPBOX_TOKEN) {
      return;
    }

    markersRef.current.forEach(({ id, element }) => {
      if (id === selectedSpotId) {
        element.classList.add("bg-primary", "scale-110");
      } else {
        element.classList.remove("scale-110");
      }
    });

    if (selectedSpotId) {
      const spot = spots.find((s) => s.id === selectedSpotId);
      if (spot && Number.isFinite(spot.lng) && Number.isFinite(spot.lat)) {
        mapRef.current.flyTo({
          center: [spot.lng, spot.lat],
          zoom: Math.max(mapRef.current.getZoom(), 12),
          essential: true,
        });
      }
    }
  }, [selectedSpotId, spots]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/50 text-center">
        <div className="rounded-full bg-muted p-4 shadow-sm">
          <span className="text-lg font-semibold text-muted-foreground">🗺️</span>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">
            Map unavailable
          </p>
          <p className="text-sm text-muted-foreground/80">
            Add `VITE_MAPBOX_TOKEN` to view nearby games on the map.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full rounded-l-xl" />;
}
