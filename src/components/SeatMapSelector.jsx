// SeatMapSelector.jsx
import { useEffect, useMemo, useState } from "react";

function indexToLetters(i) {
  let n = i + 1, s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function lettersToIndex(letters) {
  // "A"->0, "B"->1, "AA"->26, ...
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    const c = letters.charCodeAt(i) - 64; // 'A' = 65
    n = n * 26 + c;
  }
  return n - 1;
}

/**
 * Selector de asientos MULTI-SELECCIÓN (comportamiento como SeatMapEditor).
 *
 * Props soportadas:
 * 1) seatConfig: { rows:number, cols:number, blocked:any[] }
 * 2) o iniciales sueltas:
 *    - initialRows
 *    - initialCols
 *    - initialBlocked
 *
 * + initialSelected?: Array<[r,c]>
 * + onChange?: (selected:Array<[r,c]>) => void
 * + frontLabel?: string
 * + label?: string
 * + className?: string
 */
export default function SeatMapSelector({
  className = "",
  seatConfig,
  initialRows,
  initialCols,
  initialBlocked,
  initialSelected = [],
  onChange,
  frontLabel = "Frente",
  label = "Mapa de asientos",
}) {
  // -------- Resolver config desde seatConfig o props sueltas --------
  const rows = Number(seatConfig?.rows ?? initialRows ?? 0);
  const cols = Number(seatConfig?.cols ?? initialCols ?? 0);
  const blockedRaw = seatConfig?.blocked ?? initialBlocked ?? [];

  // -------- Normaliza bloqueados a keys "r-c" (0-index) --------
  const blockedSet = useMemo(() => {
    const set = new Set();

    (blockedRaw || []).forEach((b) => {
      // Formato 1: [r,c]
      if (Array.isArray(b) && b.length >= 2) {
        const r = Number(b[0]);
        const c = Number(b[1]);
        if (Number.isFinite(r) && Number.isFinite(c)) {
          set.add(`${r}-${c}`);
        }
        return;
      }

      // Formato 2: objeto {fila, columna} / {row, col}
      if (b && typeof b === "object") {
        const r = Number(b.fila ?? b.row);
        const c = Number(b.columna ?? b.col);
        if (Number.isFinite(r) && Number.isFinite(c)) {
          set.add(`${r}-${c}`);
        }
        return;
      }

      // Formato 3: string "A1", "B12"
      if (typeof b === "string") {
        const m = b.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
        if (m) {
          const r = lettersToIndex(m[1]);
          const c = Number(m[2]) - 1; // a 0-index
          if (Number.isFinite(r) && Number.isFinite(c)) {
            set.add(`${r}-${c}`);
          }
        }
      }
    });

    return set;
  }, [blockedRaw]);

  // -------- Selección múltiple --------
  const [selectedSet, setSelectedSet] = useState(() => {
    const set = new Set();
    (initialSelected || []).forEach(([r, c]) => set.add(`${r}-${c}`));
    return set;
  });

  // ✅ Firma estable para evitar loop por nuevas referencias
  const initialSelectedKey = useMemo(() => {
    return (initialSelected || [])
      .map(([r, c]) => `${r}-${c}`)
      .sort()
      .join("|");
  }, [initialSelected]);

  // ✅ Sincroniza initialSelected SOLO si cambia el contenido
  useEffect(() => {
    const next = new Set();
    (initialSelected || []).forEach(([r, c]) => next.add(`${r}-${c}`));

    setSelectedSet((prev) => {
      if (prev.size !== next.size) return next;
      for (const k of prev) if (!next.has(k)) return next;
      return prev;
    });
  }, [initialSelectedKey]);

  // -------- Pintado por arrastre (toggle igual que SeatMapEditor) --------
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    const up = () => setIsPainting(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  function emitChange(nextSet) {
    if (!onChange) return;
    const arr = Array.from(nextSet).map((key) => {
      const [r, c] = key.split("-").map(Number);
      return [r, c];
    });
    onChange(arr);
  }

  function toggleSeat(r, c) {
    const key = `${r}-${c}`;
    if (blockedSet.has(key)) return;

    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      emitChange(next);
      return next;
    });
  }

  function seatClass(state) {
    const base =
      "size-8 sm:size-9 rounded-md grid place-items-center text-[11px] font-semibold " +
      "outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600";

    if (state === "blocked") {
      return base + " bg-zinc-400 text-white cursor-not-allowed";
    }
    if (state === "selected") {
      return base + " bg-amber-500 hover:bg-amber-600 text-white";
    }
    return base + " bg-blue-500 hover:bg-blue-600 text-white";
  }

  const legend = useMemo(
    () => [
      ["Disponible", "bg-blue-500"],
      ["Seleccionado", "bg-amber-500"],
      ["Bloqueado", "bg-zinc-400"],
    ],
    []
  );

  if (!rows || !cols) {
    return (
      <div className="text-sm text-zinc-400">
        No hay configuración de asientos para este local.
      </div>
    );
  }

  const rowCount = rows;
  const colCount = cols;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {label && (
        <div className="text-sm font-semibold text-text">
          {label}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3">
        {legend.map(([name, bg]) => (
          <span key={name} className="inline-flex items-center gap-2 text-sm">
            <span className={`size-4 rounded ${bg}`} aria-hidden />
            {name}
          </span>
        ))}
      </div>

      {/* Mapa (estilo SeatMapEditor) */}
      <div className="inline-block rounded-xl border p-3 touch-none">
        <div
          className="grid grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto] gap-x-3"
          style={{ "--cols": `repeat(${colCount}, minmax(2rem,auto))` }}
        >
          {/* Frente */}
          <div className="col-start-2 row-start-1 mb-2">
            <div className="mb-1 flex items-center justify-center">
              <span className="select-none text-[11px] font-medium text-zinc-500">
                {frontLabel}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>

          {/* Etiquetas de filas */}
          <div className="mt-1 grid gap-1 col-start-1 row-start-2">
            {Array.from({ length: rowCount }).map((_, r) => (
              <div
                key={`label-${r}`}
                className="h-8 w-5 grid place-items-center text-xs text-zinc-600 sm:h-9"
                aria-hidden
              >
                {indexToLetters(r)}
              </div>
            ))}
          </div>

          {/* Asientos */}
          <div
            className="grid col-start-2 row-start-2 justify-items-center gap-1"
            style={{ gridTemplateColumns: "var(--cols)" }}
            role="grid"
            aria-label="Mapa de asientos"
          >
            {Array.from({ length: rowCount }).map((_, r) =>
              Array.from({ length: colCount }).map((_, c) => {
                const key = `${r}-${c}`;
                let state = "available";
                if (blockedSet.has(key)) state = "blocked";
                else if (selectedSet.has(key)) state = "selected";

                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    aria-label={`Asiento ${indexToLetters(r)}${c + 1}`}
                    className={seatClass(state)}
                    disabled={state === "blocked"}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setIsPainting(true);
                      toggleSeat(r, c);
                    }}
                    onPointerEnter={() => {
                      if (isPainting) toggleSeat(r, c);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSeat(r, c);
                      }
                    }}
                  >
                    {c + 1}
                  </button>
                );
              })
            )}
          </div>

          {/* Índices de columnas */}
          <div
            className="col-start-2 row-start-3 mt-2 grid justify-items-center gap-1"
            style={{ gridTemplateColumns: "var(--cols)" }}
            aria-hidden
          >
            {Array.from({ length: colCount }).map((_, c) => (
              <div key={`col-${c}`} className="text-center text-[11px] text-zinc-600">
                {c + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
