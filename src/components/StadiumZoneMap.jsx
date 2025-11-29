// StadiumZoneMap.jsx
import { useEffect, useMemo, useState } from "react";

/** Config base de zonas (posiciones/medidas/colores) */
const ZONES_BASE = [
  // Escenario: decorativo, no seleccionable
  {
    id: "escenario",
    label: "ESCENARIO",
    color: "#111827",
    type: "rect",
    x: 350,
    y: 120,
    w: 300,
    h: 70,
    rx: 16,
  },

  // ====== Segmentación HORIZONTAL de la antigua ZONA A (x:270 y:220 w:460 h:260) en A–C ======
  // 260 / 3 = 86.666...
  {
    id: "zona_a",
    label: "ZONA A",
    color: "#ef4444",
    type: "rect",
    x: 270,
    y: 220,
    w: 460,
    h: 86.67,
    rx: 18,
  },
  {
    id: "zona_b",
    label: "ZONA B",
    color: "#f97316",
    type: "rect",
    x: 270,
    y: 306.67,
    w: 460,
    h: 86.67,
    rx: 18,
  },
  {
    id: "zona_c",
    label: "ZONA C",
    color: "#eab308",
    type: "rect",
    x: 270,
    y: 393.34,
    w: 460,
    h: 86.66, // resto para cerrar exacto 260
    rx: 18,
  },

  // ====== Segmentación HORIZONTAL de la antigua ZONA B (x:230 y:500 w:540 h:200) en D–F ======
  // 200 / 3 = 66.666...
  {
    id: "zona_d",
    label: "ZONA D",
    color: "#38bdf8",
    type: "rect",
    x: 230,
    y: 500,
    w: 540,
    h: 66.67,
    rx: 50,
  },
  {
    id: "zona_e",
    label: "ZONA E",
    color: "#3b82f6",
    type: "rect",
    x: 230,
    y: 566.67,
    w: 540,
    h: 66.67,
    rx: 50,
  },
  {
    id: "zona_f",
    label: "ZONA F",
    color: "#8b5cf6",
    type: "rect",
    x: 230,
    y: 633.34,
    w: 540,
    h: 66.66, // resto para cerrar exacto 200
    rx: 50,
  },

  // ====== Tribunas se mantienen ======
  {
    id: "oriente",
    label: "ORIENTE",
    color: "#22c55e",
    type: "rect",
    x: 80,
    y: 240,
    w: 160,
    h: 580,
    rx: 24,
  },
  {
    id: "occidente",
    label: "OCCIDENTE",
    color: "#22c55e",
    type: "rect",
    x: 760,
    y: 240,
    w: 160,
    h: 580,
    rx: 24,
  },
  {
    id: "norte",
    label: "TRIBUNA NORTE",
    color: "#a78bfa",
    type: "rect",
    x: 230,
    y: 730,
    w: 540,
    h: 140,
    rx: 70,
  },
];

export default function StadiumZoneMap({
  className = "",
  initialState,            // puede ser { id: boolean } o { id: "available"|"selected"|"blocked" }
  onChange,                // ( {selected, blocked, map} ) => void
  nameEnabled  = "zones_enabled",
  nameSelected = "zones_selected",
  nameState    = "zones_state",
}) {
  function normalize(val, def = "available") {
    if (val === true)  return "available";
    if (val === false) return "blocked";
    if (val === "available" || val === "selected" || val === "blocked") return val;
    return def;
  }

  const [state, setState] = useState(() => {
    const s = {};
    for (const z of ZONES_BASE) s[z.id] = normalize(initialState?.[z.id], "available");
    return s;
  });

  const [mode, setMode] = useState("select"); // "select" | "block"

  const selectedIds = useMemo(
    () => Object.entries(state).filter(([k,v]) => v === "selected" && k !== "escenario").map(([k]) => k),
    [state]
  );
  const blockedIds = useMemo(
    () => Object.entries(state).filter(([k,v]) => v === "blocked" && k !== "escenario").map(([k]) => k),
    [state]
  );
  const enabledIds = useMemo(
    () => Object.entries(state).filter(([k,v]) => v !== "blocked" && k !== "escenario").map(([k]) => k),
    [state]
  );

  useEffect(() => {
    onChange?.({ selected: selectedIds, blocked: blockedIds, map: { ...state } });
  }, [selectedIds, blockedIds, state, onChange]);

  const patternId = useMemo(
    () => `disabledPattern-${Math.random().toString(36).slice(2)}`,
    []
  );

  function applyModeTo(id) {
    if (id === "escenario") return;
    setState((s) => {
      const curr = s[id];

      if (mode === "block") {
        const next = curr === "blocked" ? "available" : "blocked";
        return { ...s, [id]: next };
      }

      if (curr === "blocked") return s;
      if (curr === "selected") return { ...s, [id]: "available" };

      const ns = { ...s };
      for (const k of Object.keys(ns)) {
        if (k === "escenario") continue;
        if (k !== id && ns[k] === "selected") ns[k] = "available";
      }
      ns[id] = "selected";
      return ns;
    });
  }

  function setAll(val) {
    setState((s) => {
      const ns = { ...s };
      for (const z of ZONES_BASE) {
        if (z.id !== "escenario") ns[z.id] = val;
      }
      return ns;
    });
  }

  function fillOf(zid) {
    const st = state[zid];
    if (st === "blocked") return "#9ca3af";
    const z = ZONES_BASE.find(zz => zz.id === zid);
    return z?.color ?? "#9ca3af";
  }
  function strokeOf(zid) {
    return state[zid] === "blocked" ? "#e5e7eb" : "#ffffff";
  }
  const amber = "#f59e0b";

  function Zone({ z }) {
    const interactive = z.id !== "escenario";
    const st = state[z.id];
    const isBlocked = st === "blocked";
    const isSelected = st === "selected";

    return (
      <g
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : -1}
        aria-pressed={interactive ? isSelected : undefined}
        onClick={interactive ? () => applyModeTo(z.id) : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  applyModeTo(z.id);
                }
              }
            : undefined
        }
        className={interactive ? "cursor-pointer transition-opacity" : "transition-opacity"}
      >
        {z.type === "rect" && (
          <rect
            x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx ?? 0}
            fill={z.id === "escenario" ? "none" : fillOf(z.id)}
            stroke={z.id === "escenario" ? "#111827" : strokeOf(z.id)}
            strokeWidth={z.id === "escenario" ? 6 : 4}
          />
        )}

        {z.id !== "escenario" && isBlocked && (
          <rect
            x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx ?? 0}
            fill={`url(#${patternId})`} opacity={0.45}
          />
        )}

        {z.id !== "escenario" && isSelected && (
          <rect
            x={z.x + 6} y={z.y + 6} width={z.w - 12} height={z.h - 12} rx={z.rx ?? 0}
            fill="none" stroke={amber} strokeWidth={6}
          />
        )}

        <text
          x={z.x + z.w / 2}
          y={z.y + z.h / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="pointer-events-none select-none"
          fill="#111827"
          style={{ fontWeight: 700, fontSize: 16 }}
        >
          {z.label}
        </text>
      </g>
    );
  }

  const viewBox = "0 0 1000 1000";
  const outer = useMemo(() => ({ cx: 500, cy: 520, rx: 460, ry: 420 }), []);
  const inner = useMemo(() => ({ cx: 500, cy: 520, rx: 430, ry: 390 }), []);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-zinc-300 p-1">
          {[
            ["select", "Seleccionar"],
            ["block",  "Bloquear"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={
                "px-3 py-1.5 text-sm rounded-md " +
                (mode === k ? "bg-indigo-600 text-white" : "hover:bg-zinc-100")
              }
              aria-pressed={mode === k}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAll("available")}
          className="rounded-md border px-2 py-1 text-sm hover:bg-zinc-100/10"
        >
          Habilitar todas
        </button>
        <button
          type="button"
          onClick={() => setAll("blocked")}
          className="rounded-md border px-2 py-1 text-sm hover:bg-zinc-100/10"
        >
          Bloquear todas
        </button>
      </div>

      <div className="rounded-xl border p-3 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.03),transparent_60%)]">
        <svg viewBox={viewBox} className="w-full h-auto">
          <defs>
            <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="4" height="8" fill="#ffffff" />
            </pattern>
          </defs>

          <ellipse {...outer} fill="#e5e7eb" className="dark:fill-zinc-700" />
          <ellipse {...inner} fill="#111827" opacity={0.08} />

          {ZONES_BASE.map(z => <Zone key={z.id} z={z} />)}
        </svg>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Legend swatchClass="bg-blue-500"   label="Disponible" />
          <Legend swatchClass="bg-amber-500"  label="Seleccionado (solo 1)" />
          <Legend swatchClass="bg-zinc-400"   label="Bloqueado" />
        </div>
      </div>

      <input type="hidden" name={nameEnabled}  value={JSON.stringify(enabledIds)} />
      <input type="hidden" name={nameSelected} value={JSON.stringify(selectedIds)} />
      <input type="hidden" name={nameState}    value={JSON.stringify(state)} />
    </div>
  );
}

function Legend({ swatchClass, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block size-4 rounded ${swatchClass}`} aria-hidden />
      <span className="text-zinc-300">{label}</span>
    </span>
  );
}
