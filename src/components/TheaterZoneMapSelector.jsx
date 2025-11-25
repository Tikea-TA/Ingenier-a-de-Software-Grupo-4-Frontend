// src/components/TheaterZoneMapSelector.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * Selector simple de zonas para teatro.
 * - Solo 1 zona seleccionada a la vez.
 * - Las zonas "blocked" vienen del initialState (por ejemplo, desde mock)
 *   y se muestran en gris, pero no se pueden seleccionar.
 * - "escenario" es decorativo (no interactivo por defecto).
 * - onChange({ selected, blocked, map }) notifica al padre.
 * - Hidden inputs para <form>:
 *    - zones_enabled  : JSON array de IDs habilitadas (no bloqueadas)
 *    - zones_selected : JSON array de IDs seleccionadas (0 o 1 elemento)
 *    - zones_state    : JSON map { id: "available"|"selected"|"blocked" }
 */
export default function TheaterZoneMapSelector({
  className = "",
  initialState, // opcional: { id: "available"|"selected"|"blocked" } | { id: boolean }
  onChange,
  nameEnabled = "zones_enabled",
  nameSelected = "zones_selected",
  nameState = "zones_state",
  readOnlyEscenario = true,
}) {
  // Definición de zonas
  const ZONES = useMemo(
    () => ({
      escenario: { id: "escenario", label: "ESCENARIO", color: "#111827" },
      tribuna_oeste: {
        id: "tribuna_oeste",
        label: "Tribuna Oeste",
        color: "#2563eb",
      },
      tribuna_este: {
        id: "tribuna_este",
        label: "Tribuna Este",
        color: "#2563eb",
      },
      planta_baja: {
        id: "planta_baja",
        label: "Planta Baja",
        color: "#22c55e",
      },
    }),
    []
  );

  // Normaliza initialState
  function normalize(val, def = "available") {
    if (val === true) return "available";
    if (val === false) return "blocked";
    if (val === "available" || val === "selected" || val === "blocked") {
      return val;
    }
    return def;
  }

  function buildInitialState(src) {
    const s = src || {};
    return {
      tribuna_oeste: normalize(s.tribuna_oeste, "available"),
      tribuna_este: normalize(s.tribuna_este, "available"),
      planta_baja: normalize(s.planta_baja, "available"),
      escenario: normalize(s.escenario, "available"), // decorativo
    };
  }

  // Estado por zona
  const [state, setState] = useState(() => buildInitialState(initialState));

  // Si cambia el initialState (por ejemplo, al cambiar de local pero mantener el componente),
  // sincronizamos el estado interno.
  useEffect(() => {
    const next = buildInitialState(initialState);
    setState((prev) => {
      const keys = Object.keys(next);
      let changed = false;
      for (const k of keys) {
        if (prev[k] !== next[k]) {
          changed = true;
          break;
        }
      }
      return changed ? next : prev;
    });
  }, [initialState]);

  // Derivados
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

  // Notifica al padre
  useEffect(() => {
    onChange?.({
      selected: selectedIds,
      blocked: blockedIds,
      map: { ...state },
    });
  }, [selectedIds, blockedIds, state, onChange]);

  // Click en zona: solo modo "select", selección exclusiva
  function handleSelect(id) {
    if (id === "escenario" && readOnlyEscenario) return;
    setState((prev) => {
      const curr = prev[id];

      // No se puede seleccionar una zona bloqueada
      if (curr === "blocked") return prev;

      const next = { ...prev };

      if (curr === "selected") {
        // des-seleccionar -> available
        next[id] = "available";
        return next;
      }

      // available -> selected, limpiando otras selecciones
      Object.keys(next).forEach((k) => {
        if (k === "escenario") return;
        if (k === id) return;
        if (next[k] === "selected") next[k] = "available";
      });
      next[id] = "selected";
      return next;
    });
  }

  // Estilos
  function fillFor(id) {
    const st = state[id];
    if (st === "blocked") return "#9ca3af"; // gris
    return ZONES[id].color; // base
  }

  function strokeFor(id) {
    const st = state[id];
    if (id === "escenario") return "#0f172a";
    return st === "blocked" ? "#6b7280" : "#0f172a";
  }

  const amber = "#f59e0b"; // halo para selected

  return (
    <div className={`w-full ${className}`}>
      {/* Lienzo sin toolbar */}
      <div className="rounded-xl border p-3">
        <svg
          viewBox="0 0 800 440"
          className="block h-auto w-full"
          role="group"
          aria-label="Mapa de zonas del teatro"
        >
          <defs>
            {/* Patrón para bloqueados */}
            <pattern
              id="diag-disabled"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="4" height="8" fill="#ffffff" />
            </pattern>
          </defs>

          {/* ESCENARIO (no interactivo por defecto) */}
          <g
            aria-label={ZONES.escenario.label}
            tabIndex={readOnlyEscenario ? -1 : 0}
            role={readOnlyEscenario ? "img" : "button"}
            onClick={
              !readOnlyEscenario ? () => handleSelect("escenario") : undefined
            }
            onKeyDown={
              !readOnlyEscenario
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect("escenario");
                    }
                  }
                : undefined
            }
            cursor={readOnlyEscenario ? "default" : "pointer"}
          >
            <ellipse
              cx="400"
              cy="120"
              rx="230"
              ry="95"
              fill="none"
              stroke={strokeFor("escenario")}
              strokeWidth="6"
            />
            <text
              x="400"
              y="125"
              textAnchor="middle"
              fontSize="28"
              fontWeight="600"
              fill={strokeFor("escenario")}
            >
              {ZONES.escenario.label}
            </text>
          </g>

          {/* Tribuna Oeste */}
          <ZoneOval
            id="tribuna_oeste"
            state={state["tribuna_oeste"]}
            labelLines={["Tribuna", "Oeste"]}
            cx={125}
            cy={170}
            rx={85}
            ry={120}
            fill={fillFor("tribuna_oeste")}
            stroke={strokeFor("tribuna_oeste")}
            amber={amber}
            onActivate={() => handleSelect("tribuna_oeste")}
          />

          {/* Tribuna Este */}
          <ZoneOval
            id="tribuna_este"
            state={state["tribuna_este"]}
            labelLines={["Tribuna", "Este"]}
            cx={675}
            cy={170}
            rx={85}
            ry={120}
            fill={fillFor("tribuna_este")}
            stroke={strokeFor("tribuna_este")}
            amber={amber}
            onActivate={() => handleSelect("tribuna_este")}
          />

          {/* Planta Baja */}
          <ZoneRect
            id="planta_baja"
            state={state["planta_baja"]}
            label="Planta Baja"
            x={140}
            y={260}
            w={520}
            h={150}
            rx={6}
            fill={fillFor("planta_baja")}
            stroke={strokeFor("planta_baja")}
            amber={amber}
            onActivate={() => handleSelect("planta_baja")}
          />
        </svg>

        {/* Leyenda */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Legend swatchClass="bg-blue-500" label="Disponible" />
          <Legend swatchClass="bg-amber-500" label="Seleccionado (solo 1)" />
          <Legend swatchClass="bg-zinc-400" label="Bloqueado" />
        </div>
      </div>

      {/* Hidden inputs para formularios */}
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
      <input type="hidden" name={nameState} value={JSON.stringify(state)} />
    </div>
  );
}

/* --------- Subcomponentes --------- */

function ZoneOval({
  id,
  state,
  labelLines,
  cx,
  cy,
  rx,
  ry,
  fill,
  stroke,
  amber,
  onActivate,
}) {
  const isBlocked = state === "blocked";
  const isSelected = state === "selected";
  return (
    <g
      aria-label={labelLines.join(" ")}
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      cursor="pointer"
    >
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={stroke}
        strokeWidth="4"
      />
      {isBlocked && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="url(#diag-disabled)"
          opacity={0.45}
        />
      )}
      {isSelected && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx - 6}
          ry={ry - 6}
          fill="none"
          stroke={amber}
          strokeWidth="6"
        />
      )}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        fontSize="20"
        fontWeight="600"
        fill="#ffffff"
      >
        {labelLines[0]}
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fontSize="20"
        fontWeight="600"
        fill="#ffffff"
      >
        {labelLines[1]}
      </text>
    </g>
  );
}

function ZoneRect({
  id,
  state,
  label,
  x,
  y,
  w,
  h,
  rx,
  fill,
  stroke,
  amber,
  onActivate,
}) {
  const isBlocked = state === "blocked";
  const isSelected = state === "selected";
  return (
    <g
      aria-label={label}
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      cursor="pointer"
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth="4"
      />
      {isBlocked && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={rx}
          fill="url(#diag-disabled)"
          opacity={0.45}
        />
      )}
      {isSelected && (
        <rect
          x={x + 6}
          y={y + 6}
          width={w - 12}
          height={h - 12}
          rx={rx}
          fill="none"
          stroke={amber}
          strokeWidth="6"
        />
      )}
      <text
        x={x + w / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="600"
        fill="#ffffff"
      >
        {label}
      </text>
    </g>
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
