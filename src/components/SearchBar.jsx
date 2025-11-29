import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { obtenerEventosDisponibles } from "../api/ticketService";

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await obtenerEventosDisponibles();
        if (mounted) setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("No se pudieron cargar eventos para búsqueda", e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Debounce local filtering
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query || query.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      const q = query.trim().toLowerCase();
      const filtered = events
        .filter((ev) => {
          const title = ev.nombreEvento || ev.nombre || ev.eventName || ev.nombreEvento || "";
          return title.toLowerCase().includes(q);
        })
        .slice(0, 6);
      setResults(filtered);
      setOpen(filtered.length > 0);
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, events]);

  const handleSelect = (ev) => {
    const id = ev.idEvento || ev.id || ev.eventId;
    if (id) {
      // navegar a la página de evento
      navigate(`/eventos/${id}`);
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-xl relative">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full rounded-md bg-zinc-900/60 pl-10 pr-3 py-2 text-sm text-text placeholder:text-muted ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500"
          placeholder="Buscar eventos…"
        />

        {open && results.length > 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-md bg-zinc-900/95 border border-zinc-800 shadow-lg overflow-hidden">
            {results.map((ev) => {
              const title = ev.nombreEvento || ev.nombre || ev.eventName || "Evento";
              const fecha = ev.fecha || ev.fechaHora || ev.eventDate || null;
              const subtitle = fecha ? new Date(fecha).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" }) : "";
              return (
                <button
                  key={ev.idEvento || ev.id || ev.eventId || title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(ev)}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{title}</div>
                    {subtitle && <div className="text-xs text-subtle">{subtitle}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
