"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  distanceKm,
  fetchRoutePolyline,
  LA_TRINIDAD,
  pointAlongRoute,
  resolveDestination,
  type LatLngTuple,
} from "@/lib/dispatch-locations";

export type DispatchMapProps = {
  destinationName: string;
  eta?: string;
  onDistance?: (km: number) => void;
};

const ROUTE_COLOR = "#4FA84E";
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

function makeIcon(html: string, size: number, anchorY = size / 2): L.DivIcon {
  return L.divIcon({
    className: "dispatch-map-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, anchorY],
  });
}

const ORIGIN_ICON = makeIcon(
  '<div class="map-pin map-pin--origin"><span></span></div>',
  28
);
const DEST_ICON = makeIcon(
  '<div class="map-pin map-pin--dest"><span></span></div>',
  28
);
const TRUCK_ICON = makeIcon(
  '<div class="map-truck" aria-hidden="true">🚚</div>',
  36,
  18
);

export default function DispatchMap({ destinationName, eta, onDistance }: DispatchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<LatLngTuple[]>([]);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const destination = resolveDestination(destinationName);
    const dist = distanceKm(LA_TRINIDAD, destination);
    onDistance?.(dist);

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer(TILE_URL, {
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    const originMarker = L.marker([LA_TRINIDAD.lat, LA_TRINIDAD.lng], { icon: ORIGIN_ICON })
      .addTo(map)
      .bindTooltip(`<b>${LA_TRINIDAD.name}</b><br>${LA_TRINIDAD.label}`, {
        direction: "top",
        offset: [0, -12],
        className: "dispatch-map-tooltip",
      });

    const destMarker = L.marker([destination.lat, destination.lng], { icon: DEST_ICON })
      .addTo(map)
      .bindTooltip(`<b>${destination.name}</b><br>${destination.label}${eta ? `<br>${eta}` : ""}`, {
        direction: "top",
        offset: [0, -12],
        className: "dispatch-map-tooltip",
      });

    void originMarker;
    void destMarker;

    let polyline: L.Polyline | null = null;
    let cancelled = false;

    const fitRoute = () => {
      if (polyline) map.fitBounds(polyline.getBounds(), { padding: [56, 56], animate: true });
    };

    const onZoom = (e: Event) => {
      const delta = (e as CustomEvent<{ delta: number }>).detail?.delta ?? 0;
      if (delta > 0) map.zoomIn();
      else if (delta < 0) map.zoomOut();
    };
    const onRecenter = () => {
      if (truckRef.current) {
        map.setView(truckRef.current.getLatLng(), Math.max(map.getZoom(), 9), { animate: true });
      } else {
        fitRoute();
      }
    };
    window.addEventListener("ani:map-zoom", onZoom);
    window.addEventListener("ani:map-recenter", onRecenter);

    fetchRoutePolyline(LA_TRINIDAD, destination).then((route) => {
      if (cancelled || !mapRef.current) return;
      routeRef.current = route;

      polyline = L.polyline(route, {
        color: ROUTE_COLOR,
        weight: 6,
        opacity: 0.92,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      const truck = L.marker(route[0], { icon: TRUCK_ICON, zIndexOffset: 500 }).addTo(map);
      truckRef.current = truck;

      fitRoute();

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        truck.setLatLng(route[route.length - 1]);
        return;
      }

      const duration = 28000;
      startRef.current = performance.now();

      const animate = (now: number) => {
        if (!truckRef.current || !routeRef.current.length) return;
        const elapsed = (now - startRef.current) % duration;
        const fraction = elapsed / duration;
        const pos = pointAlongRoute(routeRef.current, fraction);
        truckRef.current.setLatLng(pos);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("ani:map-zoom", onZoom);
      window.removeEventListener("ani:map-recenter", onRecenter);
      truckRef.current = null;
      routeRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [destinationName, eta, onDistance]);

  return <div ref={containerRef} className="dispatch-map-canvas" role="img" aria-label="Live dispatch route map" />;
}
