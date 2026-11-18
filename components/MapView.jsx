"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { VERIFICATION_COLOR, formatCzk } from "@/lib/records";

export default function MapView({ records, selectedId, onSelect }) {
  return (
    <MapContainer center={[49.8, 15.5]} zoom={7} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {records.map((r) => {
        const selected = r.id === selectedId;
        const isActive = r.status === "active" || r.price_type === "asking";
        return (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={selected ? 11 : isActive ? 8 : 7}
            pathOptions={{
              color: selected ? "#000" : isActive ? "#e5252a" : "#18181b",
              weight: selected ? 3.5 : isActive ? 2 : 1.5,
              fillColor: isActive ? "#e5252a" : (VERIFICATION_COLOR[r.verification_level] || "#2f62b5"),
              fillOpacity: isActive ? 0.75 : 0.9,
            }}
            eventHandlers={{
              click: () => onSelect(r),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
              <div style={{ padding: "3px 5px", fontSize: 12 }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: isActive ? "#e5252a" : "#2f62b5",
                  marginBottom: 2
                }}>
                  {isActive ? "● Active Listing (On Sale)" : "✓ Closed Past Transaction"}
                </div>
                <strong style={{ fontSize: 13, display: "block", marginBottom: 2 }}>{r.title}</strong>
                <div style={{ color: isActive ? "#e5252a" : "#111", fontWeight: 800, margin: "2px 0", fontSize: 13 }}>
                  {isActive ? `Asking: ${formatCzk(r.price_czk)}` : `Realized: ${formatCzk(r.price_czk)}`}
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>
                  {r.city} · {r.maker} {r.sale_date ? `· ${r.sale_date.slice(0, 4)}` : ""}
                </div>
                {r.verification_signature && (
                  <div style={{ marginTop: 5, fontFamily: "monospace", fontSize: 10, background: "#18181b", color: "#fff", padding: "1px 5px", borderRadius: 3, display: "inline-block" }}>
                    {r.verification_signature}
                  </div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
