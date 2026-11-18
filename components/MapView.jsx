"use client";
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { STATUS_COLOR, STATUS_LABEL, formatCzk, statusOf } from "@/lib/records";

// Many lots share one location (the city of their auction house). To keep them clickable,
// markers that share a location are spread on a small spiral for DISPLAY ONLY.
// The stored coordinates are the real auction-house city and are never changed.
function displayPositions(records) {
  const groups = new Map();
  for (const r of records) {
    if (r.lat == null || r.lng == null) continue;
    const key = `${Number(r.lat).toFixed(4)},${Number(r.lng).toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const out = [];
  for (const list of groups.values()) {
    list.forEach((r, i) => {
      if (i === 0) return out.push([r, [r.lat, r.lng]]);
      // Golden-angle spiral, ~150 m per ring step
      const angle = i * 2.39996;
      const dist = 0.0013 * Math.sqrt(i);
      const lat = Number(r.lat) + dist * Math.cos(angle);
      const lng = Number(r.lng) + (dist * Math.sin(angle)) / Math.cos((Number(r.lat) * Math.PI) / 180);
      out.push([r, [lat, lng]]);
    });
  }
  return out;
}

const PRICE_PREFIX = {
  sold: "Hammer price",
  active: "Current price",
  unsold: "Starting price (unsold)",
};

export default function MapView({ records, selectedId, onSelect }) {
  const points = useMemo(() => displayPositions(records), [records]);

  return (
    <MapContainer center={[49.8, 15.5]} zoom={7} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map(([r, pos]) => {
        const selected = r.id === selectedId;
        const status = statusOf(r);
        const color = STATUS_COLOR[status];
        return (
          <CircleMarker
            key={r.id}
            center={pos}
            radius={selected ? 11 : status === "active" ? 7 : 6}
            pathOptions={{
              color: selected ? "#000" : "#18181b",
              weight: selected ? 3.5 : 1,
              fillColor: color,
              fillOpacity: status === "unsold" ? 0.6 : 0.85,
            }}
            eventHandlers={{ click: () => onSelect(r) }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
              <div style={{ padding: "3px 5px", fontSize: 12, maxWidth: 260 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color, marginBottom: 2 }}>
                  {STATUS_LABEL[status]}
                </div>
                <strong style={{ fontSize: 13, display: "block", marginBottom: 2, whiteSpace: "normal" }}>{r.title}</strong>
                <div style={{ fontWeight: 800, margin: "2px 0", fontSize: 13 }}>
                  {PRICE_PREFIX[status]}: {formatCzk(r.price_czk)}
                </div>
                <div style={{ fontSize: 11, color: "#666", whiteSpace: "normal" }}>
                  {r.source_name} · {r.city}
                  {r.sale_date ? ` · ${r.sale_date}` : ""}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
