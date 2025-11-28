import { useState, useEffect } from "react";

const images = [
  "/concertLogin.webp",
  "/stadiumLogin.jpg",
  "/concierto2.avif",
  "/teatro.jpg"
];

export const LoginCarousel = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900">
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* IMAGEN DE FONDO */}
          <img
            src={img}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* CAPA OSCURA (Overlay) */}
          {/* Esto asegura que el texto blanco siempre se lea bien, sin importar la foto */}
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply" />
        </div>
      ))}

      {/* TEXTO FLOTANTE */}
      <div className="absolute bottom-0 left-0 right-0 p-12 text-center z-20">
        <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg tracking-tight">
          Vive la experiencia
        </h2>
        <p className="text-lg text-zinc-200 drop-shadow-md max-w-lg mx-auto">
          Los mejores eventos, conciertos y espectáculos en un solo lugar.
        </p>
        
        {/* INDICADORES (Puntitos) */}
        <div className="flex justify-center gap-3 mt-8">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentImage 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-white/50 hover:bg-white"
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};