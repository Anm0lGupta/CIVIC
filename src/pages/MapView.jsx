// src/pages/MapView.jsx

import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default marker icon bug with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const createIcon = (color, neglected = false) =>
  L.divIcon({
    className: "",
    html: `
      <div style="position:relative">
        ${neglected ? `<div style="
          position:absolute; top:-4px; left:-4px; right:-4px; bottom:-4px;
          border-radius:50% 50% 50% 0; transform:rotate(-45deg);
          background:rgba(239,68,68,0.3);
          animation: pulse 1.5s infinite;
        "></div>` : ''}
        <div style="
          width:26px; height:26px;
          background:${color};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          ${neglected ? 'outline: 2px solid #ef4444; outline-offset: 2px;' : ''}
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -30],
  })

const urgencyIcons = {
  high: createIcon("#ef4444"),
  medium: createIcon("#f59e0b"),
  low: createIcon("#22c55e"),
}

const urgencyIconsNeglected = {
  high: createIcon("#ef4444", true),
  medium: createIcon("#f59e0b", true),
  low: createIcon("#22c55e", true),
}

const urgencyColors = {
  high: { bg: "bg-red-100", text: "text-red-700", label: "HIGH" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", label: "MEDIUM" },
  low: { bg: "bg-green-100", text: "text-green-700", label: "LOW" },
}

const statusColors = {
  open: "text-blue-600",
  in_progress: "text-purple-600",
  resolved: "text-green-600",
}

function isNeglected(complaint) {
  if (complaint.status === 'resolved') return false;
  if (complaint.timestamp === 'Just now') return false;
  const diffDays = Math.floor((new Date() - new Date(complaint.timestamp)) / (1000 * 60 * 60 * 24));
  return diffDays >= 30;
}

const DEFAULT_CENTER = [28.6139, 77.2090]
const DEFAULT_ZOOM = 12

// ── Heat Map Layer ─────────────────────────────────────────────────────────────
function HeatMapLayer({ points }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!map || points.length === 0) return

    // Dynamically load leaflet.heat from CDN
    if (!window.L.heatLayer) {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"
      script.onload = () => {
        if (heatLayerRef.current) map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = window.L.heatLayer(points, {
          radius: 35,
          blur: 25,
          maxZoom: 14,
          gradient: { 0.2: "#22c55e", 0.5: "#f59e0b", 0.8: "#ef4444", 1.0: "#7f1d1d" },
        }).addTo(map)
      }
      document.head.appendChild(script)
    } else {
      if (heatLayerRef.current) map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = window.L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 14,
        gradient: { 0.2: "#22c55e", 0.5: "#f59e0b", 0.8: "#ef4444", 1.0: "#7f1d1d" },
      }).addTo(map)
    }

    return () => {
      if (heatLayerRef.current) map.removeLayer(heatLayerRef.current)
    }
  }, [map, points])

  return null
}

export default function MapView({ complaints }) {
  const [filter, setFilter] = useState("all")
  const [viewMode, setViewMode] = useState("markers") // "markers" | "heatmap" | "both"

  const allWithCoords = (complaints || []).map((c, i) => ({
    ...c,
    lat: c.lat ?? DEFAULT_CENTER[0] + (Math.sin(i * 1.7) * 0.05),
    lng: c.lng ?? DEFAULT_CENTER[1] + (Math.cos(i * 1.3) * 0.05),
  }))

  const filtered = allWithCoords.filter(
    (c) => filter === "all" || c.urgency === filter
  )

  // Heat map points: [lat, lng, intensity]
  // High urgency = intensity 1.0, medium = 0.6, low = 0.3
  const heatPoints = filtered.map((c) => [
    c.lat, c.lng,
    c.urgency === "high" ? 1.0 : c.urgency === "medium" ? 0.6 : 0.3
  ])

  const neglectedCount = filtered.filter(isNeglected).length

  const showMarkers = viewMode === "markers" || viewMode === "both"
  const showHeat = viewMode === "heatmap" || viewMode === "both"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Top bar */}
      <div style={{ flexShrink: 0 }} className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Map View</h1>
          <p className="text-xs text-slate-500">
            {filtered.length} complaints
            {neglectedCount > 0 && (
              <span className="ml-2 text-red-600 font-semibold">· ⚠️ {neglectedCount} neglected</span>
            )}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { value: "markers", label: "📍 Markers" },
            { value: "heatmap", label: "🔥 Heat Map" },
            { value: "both", label: "⚡ Both" },
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === mode.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Urgency filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500">Filter:</span>
          {["all", "high", "medium", "low"].map((val) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === val
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {val === "all" ? "All" : val}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>Medium</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>Low</span>
          <span className="flex items-center gap-1 text-red-600 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-300 inline-block"></span>Neglected</span>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Heat map layer */}
          {showHeat && <HeatMapLayer points={heatPoints} />}

          {/* Markers */}
          {showMarkers && filtered.map((complaint) => {
            const neglected = isNeglected(complaint)
            const iconSet = neglected ? urgencyIconsNeglected : urgencyIcons
            return (
              <Marker
                key={complaint.id}
                position={[complaint.lat, complaint.lng]}
                icon={iconSet[complaint.urgency] || urgencyIcons.medium}
              >
                <Popup minWidth={230}>
                  <div style={{ padding: "4px" }}>
                    {neglected && (
                      <div style={{
                        background: "#fef2f2", border: "1px solid #fecaca",
                        borderRadius: "6px", padding: "6px 8px", marginBottom: "8px",
                        fontSize: "11px", color: "#dc2626", fontWeight: "bold"
                      }}>
                        ⚠️ Repeated Negligence — 30+ days without action
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "13px", color: "#0f172a", flex: 1 }}>{complaint.title}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${urgencyColors[complaint.urgency]?.bg} ${urgencyColors[complaint.urgency]?.text}`}>
                        {urgencyColors[complaint.urgency]?.label}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                      {complaint.description?.slice(0, 90)}...
                    </p>
                    <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span>📍 {complaint.location}</span>
                      {complaint.department && <span>🏛️ {complaint.department}</span>}
                      <span className={`font-semibold ${statusColors[complaint.status?.toLowerCase().replace(' ', '_')] || 'text-blue-600'}`}>
                        ● {complaint.status}
                      </span>
                      <span>👍 {complaint.upvotes} upvotes</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Heat map legend (when heat is active) */}
      {showHeat && (
        <div style={{
          position: "absolute", bottom: "30px", right: "16px",
          background: "white", borderRadius: "10px", padding: "10px 14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)", zIndex: 1000,
          fontSize: "11px", fontWeight: "600"
        }}>
          <p style={{ color: "#475569", marginBottom: "6px" }}>🔥 Complaint Intensity</p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "120px", height: "10px", borderRadius: "5px",
              background: "linear-gradient(to right, #22c55e, #f59e0b, #ef4444, #7f1d1d)"
            }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", marginTop: "3px" }}>
            <span>Low</span><span>High</span>
          </div>
        </div>
      )}
    </div>
  )
}