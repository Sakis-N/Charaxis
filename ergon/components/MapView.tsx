"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { btn, inputCls } from "./ui";

export type MapPoint = { lat: number; lng: number; title: string; sub?: string; href?: string; color?: string; label?: string };

const GREECE: [number, number] = [38.5, 23.5];

/** Χάρτης με σημεία (OpenStreetMap). Με `route` ενώνει τα σημεία με τη σειρά. */
export function MapView({ points, height = 480, route = false }: { points: MapPoint[]; height?: number; route?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: any;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current).setView(GREECE, 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const latlngs: [number, number][] = [];
      points.forEach((p) => {
        const ll: [number, number] = [p.lat, p.lng];
        latlngs.push(ll);
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${p.color || "#1f63c8"};color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);border-radius:999px;min-width:26px;height:26px;padding:0 6px;display:flex;align-items:center;justify-content:center;font:600 12px system-ui">${p.label ?? ""}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const html = `<b>${esc(p.title)}</b>${p.sub ? `<br>${esc(p.sub)}` : ""}${
          p.href ? `<br><a href="${p.href}">Άνοιγμα →</a>` : ""
        }<br><a target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}">Πλοήγηση</a>`;
        L.marker(ll, { icon }).addTo(map).bindPopup(html);
      });
      if (route && latlngs.length > 1) L.polyline(latlngs, { color: "#1f63c8", weight: 3, opacity: 0.6, dashArray: "6 6" }).addTo(map);
      if (latlngs.length === 1) map.setView(latlngs[0], 15);
      else if (latlngs.length > 1) map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, route]);
  return <div ref={ref} style={{ height }} className="z-0 w-full overflow-hidden rounded-xl border border-gray-200" />;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Επιλογή θέσης: κλικ στον χάρτη ή αναζήτηση διεύθυνσης (Nominatim). Γράφει lat/lng σε inputs. */
export function LocationPicker({ lat, lng, addressFieldIds = ["address", "city"] }: { lat?: number | null; lng?: number | null; addressFieldIds?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ lat: string; lng: string }>({ lat: lat != null ? String(lat) : "", lng: lng != null ? String(lng) : "" });
  const [msg, setMsg] = useState("");
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const place = (la: number, ln: number, zoom?: number) => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.setLatLng([la, ln]);
    else markerRef.current = L.circleMarker([la, ln], { radius: 9, color: "#fff", weight: 2, fillColor: "#1f63c8", fillOpacity: 1 }).addTo(map);
    if (zoom) map.setView([la, ln], zoom);
    setPos({ lat: la.toFixed(6), lng: ln.toFixed(6) });
  };

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      LRef.current = L;
      const map = L.map(ref.current).setView(lat != null && lng != null ? [lat, lng] : GREECE, lat != null ? 15 : 6);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
      if (lat != null && lng != null) place(lat, lng);
      map.on("click", (e: any) => place(e.latlng.lat, e.latlng.lng));
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const geocode = async () => {
    const q = addressFieldIds
      .map((id) => (document.getElementById(id) as HTMLInputElement | null)?.value)
      .filter(Boolean)
      .join(", ");
    if (!q) return setMsg("Συμπλήρωσε πρώτα διεύθυνση.");
    setMsg("Αναζήτηση…");
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gr&q=${encodeURIComponent(q)}`, { headers: { "Accept-Language": "el" } });
      const j = await r.json();
      if (!j[0]) return setMsg("Δεν βρέθηκε. Κάνε κλικ στον χάρτη.");
      place(Number(j[0].lat), Number(j[0].lon), 17);
      setMsg("Βρέθηκε — διόρθωσε με κλικ αν χρειάζεται.");
    } catch {
      setMsg("Αποτυχία αναζήτησης.");
    }
  };
  const gps = () => {
    if (!navigator.geolocation) return setMsg("Δεν υποστηρίζεται GPS.");
    setMsg("Λήψη θέσης…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        place(p.coords.latitude, p.coords.longitude, 17);
        setMsg("Τρέχουσα θέση.");
      },
      () => setMsg("Δεν δόθηκε άδεια θέσης."),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Γεωγρ. πλάτος</span>
          <input name="lat" value={pos.lat} onChange={(e) => setPos({ ...pos, lat: e.target.value })} className={`${inputCls} w-36`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Γεωγρ. μήκος</span>
          <input name="lng" value={pos.lng} onChange={(e) => setPos({ ...pos, lng: e.target.value })} className={`${inputCls} w-36`} />
        </label>
        <button type="button" onClick={geocode} className={btn.secondary}>
          📍 Από διεύθυνση
        </button>
        <button type="button" onClick={gps} className={btn.secondary}>
          🛰 Τρέχουσα θέση
        </button>
        <span className="text-xs text-gray-500">{msg}</span>
      </div>
      <div ref={ref} className="z-0 h-64 w-full overflow-hidden rounded-xl border border-gray-200" />
    </div>
  );
}
