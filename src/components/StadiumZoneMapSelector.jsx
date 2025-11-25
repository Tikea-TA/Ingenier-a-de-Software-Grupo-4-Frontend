// StadiumZoneMap.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * Config base de zonas (coordenadas y labels).
 * Mantiene tribunas y segmenta la antigua zona A / B en A–F (horizontal).
 */
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

  // Segmentación HORIZONTAL de lo que antes era ZONA A (alto 260 => ~86.67 cada una)
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
    y: 220 + 86.67,
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
    y: 220 + 2 * 86.67,
    w: 460,
    h: 86.67,
    rx: 18,
  },

  // Segmentación HORIZONTAL de lo que antes era ZONA B (alto 200 => ~66.67 cada una)
  {
    id: "zona_d",
    label: "ZONA D",
    color: "#22c55e",
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
    y: 500 + 66.67,
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
    y: 500 + 2 * 66.67,
    w: 540,
    h: 66.66,
    rx: 50,
  },

  // Tribunas laterales y norte
  {
    id: "oriente",
    label: "TRIBUNA ORIENTE",
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
    label: "TRIBUNA OCCIDENTE",
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
  /**
   * initialState puede ser:
   * - { zonaId: "available" | "selected" | "blocked" }
   * - { zonaId: boolean } (true = available, false = blocked)
   * - { zonaId: { estado, habilitada, ... } }  // estructura del mock
   */
  initialState,
  onChange, // ( { selected, blocked, map } ) => void
  nameEnabled = "zones_enabled",
  nameSelected = "zones_selected",
  nameState = "zones_state",
}) {
  // Normaliza estados desde distintos formatos (incluyendo mock)
  function normalize(val, def = "available") {
    // booleanos
    if (val === true) return "available";
    if (val === false) return "blocked";

    // string plano
    if (typeof val === "string") {
      if (val === "available" || val === "selected" || val === "blocked") {
        return val;
      }
    }

    // objeto de mock (por ejemplo: { estado, habilitada, ... })
    if (val && typeof val === "object") {
      const raw = val.estado ?? (val.habilitada === false ? "blocked" : undefined);
      if (raw === "available" || raw === "selected" || raw === "blocked") {
        return raw;
      }
      if (val.habilitada === false) return "blocked";
    }

    return def;
  }

  // Estado por zona (selección EXCLUSIVA incluso al cargar mock)
  const [state, setState] = useState(() => {
    const s = {};
    let alreadySelected = false;

    for (const z of ZONES_BASE) {
      const raw = initialState?.[z.id];
      let norm = normalize(raw, "available");

      if (norm === "selected") {
        if (alreadySelected) {
          norm = "available";
        } else {
          alreadySelected = true;
        }
      }

      s[z.id] = norm;
    }
    return s;
  });

  // Derivados (excluye 'escenario')
  const selectedIds = useMemo(
    () =>
      Object.entries(state)
        .filter(([k, v]) => v === "selected" && k !== "escenario")
        .map(([k]) => k),
    [state]
  );

  const blockedIds = useMemo(
    () =>
      Object.entries(state)
        .filter(([k, v]) => v === "blocked" && k !== "escenario")
        .map(([k]) => k),
    [state]
  );

  const enabledIds = useMemo(
    () =>
      Object.entries(state)
        .filter(([k, v]) => v !== "blocked" && k !== "escenario")
        .map(([k]) => k),
    [state]
  );

  // Notificar cambios al padre
  useEffect(() => {
    onChange?.({
      selected: selectedIds,
      blocked: blockedIds,
      map: { ...state },
    });
  }, [selectedIds, blockedIds, state, onChange]);

  // ID único para el patrón de bloqueados
  const patternId = useMemo(
    () => `disabledPattern-${Math.random().toString(36).slice(2)}`,
    []
  );

  // Click: solo selección EXCLUSIVA, no hay modo de bloquear/desbloquear desde UI
  function applyClick(id) {
    if (id === "escenario") return;

    setState((s) => {
      const curr = s[id];

      // Si está bloqueada, no hace nada
      if (curr === "blocked") return s;

      // Si ya está seleccionada, la dejo available
      if (curr === "selected") {
        return { ...s, [id]: "available" };
      }

      // available -> selected EXCLUSIVO
      const ns = { ...s };
      for (const k of Object.keys(ns)) {
        if (k === "escenario") continue;
        if (k !== id && ns[k] === "selected") ns[k] = "available";
      }
      ns[id] = "selected";
      return ns;
    });
  }

  // Helpers visuales
  function fillOf(zid) {
    const st = state[zid];
    if (st === "blocked") return "#9ca3af";
    const z = ZONES_BASE.find((zz) => zz.id === zid);
    return z?.color ?? "#9ca3af";
  }

  function strokeOf(zid) {
    const st = state[zid];
    return st === "blocked" ? "#e5e7eb" : "#ffffff";
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
        onClick={interactive ? () => applyClick(z.id) : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  applyClick(z.id);
                }
              }
            : undefined
        }
        className={
          interactive
            ? "cursor-pointer transition-opacity"
            : "transition-opacity"
        }
      >
        {/* Base */}
        {z.type === "rect" && (
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            rx={z.rx ?? 0}
            fill={z.id === "escenario" ? "none" : fillOf(z.id)}
            stroke={z.id === "escenario" ? "#111827" : strokeOf(z.id)}
            strokeWidth={z.id === "escenario" ? 6 : 4}
          />
        )}

        {/* Tramado cuando está bloqueado (no aplica a escenario) */}
        {z.id !== "escenario" && isBlocked && (
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            rx={z.rx ?? 0}
            fill={`url(#${patternId})`}
            opacity={0.45}
          />
        )}

        {/* Halo para seleccionado */}
        {z.id !== "escenario" && isSelected && (
          <rect
            x={z.x + 6}
            y={z.y + 6}
            width={z.w - 12}
            height={z.h - 12}
            rx={z.rx ?? 0}
            fill="none"
            stroke={amber}
            strokeWidth={6}
          />
        )}

        {/* Etiqueta */}
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
  const outer = useMemo(
    () => ({ cx: 500, cy: 520, rx: 460, ry: 420 }),
    []
  );
  const inner = useMemo(
    () => ({ cx: 500, cy: 520, rx: 430, ry: 390 }),
    []
  );

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* SVG */}
      <div className="rounded-xl border p-3 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.03),transparent_60%)]">
        <svg viewBox={viewBox} className="w-full h-auto">
          <defs>
            {/* Patrón diagonal para “bloqueado” */}
            <pattern
              id={patternId}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="4" height="8" fill="#ffffff" />
            </pattern>
          </defs>

          {/* Oval decorativo */}
          <ellipse
            {...outer}
            fill="#e5e7eb"
            className="dark:fill-zinc-700"
          />
          <ellipse {...inner} fill="#111827" opacity={0.08} />

          {/* Zonas */}
          {ZONES_BASE.map((z) => (
            <Zone key={z.id} z={z} />
          ))}
        </svg>

        {/* Leyenda */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Legend swatchClass="bg-blue-500" label="Disponible" />
          <Legend swatchClass="bg-amber-500" label="Seleccionado" />
          <Legend swatchClass="bg-zinc-400" label="Bloqueado" />
        </div>
      </div>

      {/* Hidden inputs por si lo usas en formularios */}
      <input
        type="hidden"
        name={nameEnabled}
        value={JSON.stringify(enabledIds)}
      />
      <input
        type="hidden"
        name={nameSelected}
        value={JSON.stringify(selectedIds)}
      />
      <input
        type="hidden"
        name={nameState}
        value={JSON.stringify(state)}
      />
    </div>
  );
}

function Legend({ swatchClass, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-block size-4 rounded ${swatchClass}`}
        aria-hidden
      />
      <span className="text-zinc-300">{label}</span>
    </span>
  );
}
