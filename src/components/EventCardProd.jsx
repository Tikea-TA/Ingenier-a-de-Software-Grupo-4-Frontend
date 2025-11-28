import { useState, useEffect } from "react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { useNavigate } from "react-router-dom";
import { obtenerBanner } from "../api/eventoService";

export default function EventCardProd({ event }) {
  const navigate = useNavigate();
  const [bannerUrl, setBannerUrl] = useState(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const blob = await obtenerBanner(event.id);
        const url = URL.createObjectURL(blob);
        setBannerUrl(url);
      } catch (error) {
        console.error("Error fetching banner:", error);
        // Fallback to placeholder if banner fetch fails
        setBannerUrl(`https://picsum.photos/seed/${event.id}/800/450`);
      }
    };

    if (event.id) {
      fetchBanner();
    }

    // Cleanup function to revoke object URL
    return () => {
      if (bannerUrl && bannerUrl.startsWith('blob:')) {
        URL.revokeObjectURL(bannerUrl);
      }
    };
  }, [event.id]);

  const handleDetailsClick = () => {
    navigate(`/productor/eventos/detalle/${event.id}`);
  };

  // Format date to "DD MMM" format (e.g., "25 Nov")
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  };

  return (
    <div className="overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10">
      <img
        src={bannerUrl || `https://picsum.photos/seed/${event.id}/800/450`}
        alt={event.title}
        className="h-40 w-full object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-zinc-100 font-semibold">{event.title}</h3>
          {event.badge ? <Badge>{event.badge}</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-zinc-400">{formatDate(event.date)} • {event.venue}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-zinc-300">Desde <b>S/. {event.price}</b></span>
          <Button onClick={handleDetailsClick}>Detalles</Button>
        </div>
      </div>
    </div>
  );
}
