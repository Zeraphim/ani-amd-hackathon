"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DispatchMap = dynamic(() => import("./DispatchMap"), { ssr: false });

type MapRoute = { destination: string; eta: string };

const DEFAULT_ROUTE: MapRoute = { destination: "Divisoria", eta: "6h · ₱44/kg" };

function formatClock(now: Date): { date: string; time: string } {
  const date = now
    .toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();
  const time = now
    .toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();
  return { date, time };
}

/** Event-driven modal — avoids re-rendering the showcase markup in page.tsx. */
export default function DispatchMapModal() {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState<MapRoute>(DEFAULT_ROUTE);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [clock, setClock] = useState(() => formatClock(new Date()));

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onRoute = (e: Event) => {
      const detail = (e as CustomEvent<Partial<MapRoute>>).detail;
      if (!detail?.destination) return;
      setRoute({
        destination: detail.destination,
        eta: detail.eta ?? DEFAULT_ROUTE.eta,
      });
    };
    window.addEventListener("ani:map-open", onOpen);
    window.addEventListener("ani:map-route", onRoute);
    return () => {
      window.removeEventListener("ani:map-open", onOpen);
      window.removeEventListener("ani:map-route", onRoute);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setDistanceKm(null);
    setClock(formatClock(new Date()));
    const iv = setInterval(() => setClock(formatClock(new Date())), 30000);
    return () => clearInterval(iv);
  }, [open, route.destination]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const handleDistance = useCallback((km: number) => {
    setDistanceKm(Math.round(km));
  }, []);

  const zoom = (delta: number) => {
    window.dispatchEvent(new CustomEvent("ani:map-zoom", { detail: { delta } }));
  };

  const recenter = () => window.dispatchEvent(new CustomEvent("ani:map-recenter"));

  if (!open) return null;

  return (
    <div
      className="modal-scrim map-scrim open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal map-modal">
        <div className="map-modal-head">
          <div>
            <span className="eyebrow">Live dispatch</span>
            <h3 id="map-modal-title">La Trinidad → {route.destination}</h3>
            <p className="muted map-modal-sub">
              {distanceKm != null ? `${distanceKm} km` : "Calculating route…"} · {route.eta} · en route
            </p>
          </div>
          <button type="button" className="map-close-btn" onClick={close} aria-label="Close map">
            ✕
          </button>
        </div>

        <div className="map-stage">
          <DispatchMap
            key={route.destination}
            destinationName={route.destination}
            eta={route.eta}
            onDistance={handleDistance}
          />

          <div className="map-overlay map-status" aria-live="polite">
            <div className="map-status-seg">
              <span className="map-status-ico" aria-hidden="true">
                📅
              </span>
              <span className="mono">{clock.date}</span>
              <span className="mono map-status-time">{clock.time}</span>
            </div>
            <div className="map-status-sep" aria-hidden="true" />
            <div className="map-status-seg">
              <span className="map-status-ico" aria-hidden="true">
                🚚
              </span>
              <span className="mono">LA TRINIDAD</span>
              <span className="mono map-status-muted">→ {route.destination.toUpperCase()}</span>
            </div>
          </div>

          <div className="map-overlay map-controls" aria-label="Map controls">
            <button type="button" className="map-ctrl" onClick={() => zoom(1)} aria-label="Zoom in">
              +
            </button>
            <button type="button" className="map-ctrl" onClick={() => zoom(-1)} aria-label="Zoom out">
              −
            </button>
            <button type="button" className="map-ctrl map-ctrl--track" onClick={recenter} aria-label="Track vehicle">
              🚚
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
