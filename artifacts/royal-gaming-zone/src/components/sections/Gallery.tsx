import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

/* ─── Layout config ────────────────────────────────────────────
   Photos render in a centered, responsive grid so the collage
   always looks balanced regardless of how many images exist.
──────────────────────────────────────────────────────────────── */
const PHOTOS = [
  { src: "/images/racing-zone.png", from: { x: -80, y: -60, rotate: -12 } },
  { src: "/images/ps5-zone.png",    from: { x:  80, y: -60, rotate:  12 } },
  { src: "/images/ps4-zone.png",    from: { x: -80, y:  60, rotate: -10 } },
  { src: "/images/gallery-1.png",   from: { x:  80, y:  60, rotate:  10 } },
  { src: "/images/gallery-2.png",   from: { x:   0, y:  80, rotate:   6 } },
  { src: "/images/gallery-3.png",   from: { x:   0, y: -80, rotate:  -6 } },
];

export default function Gallery() {
  const [zoomed, setZoomed] = useState<string | null>(null);

  return (
    <section
      id="gallery"
      className="py-12 bg-background relative border-t border-primary/10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_60%,rgba(0,200,255,0.05),transparent)] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-3 uppercase tracking-wider text-glow">
            The <span className="text-primary">Arena</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Take a look inside India's premier gaming destination.
          </p>
        </div>

        {/* ── Collage ── */}
        <div className="mx-auto flex flex-wrap justify-center items-center gap-4 max-w-4xl">
          {PHOTOS.map((photo, i) => (
            <motion.button
              key={photo.src}
              onClick={() => setZoomed(photo.src)}
              initial={{ opacity: 0, x: photo.from.x, y: photo.from.y, rotate: photo.from.rotate }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.08, duration: 0.55, type: "spring", stiffness: 130, damping: 20 }}
              whileHover={{ scale: 1.04, zIndex: 20 }}
              whileTap={{ scale: 0.97 }}
              className="focus:outline-none cursor-pointer w-full sm:w-[calc(33.333%-1rem)] min-w-[220px] max-w-sm"
              aria-label="View photo"
            >
              <div className="w-full overflow-hidden rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.7)] border-2 border-white/10 hover:border-primary/50 transition-colors duration-200">
                <img
                  src={photo.src}
                  alt="Gaming zone"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: "4/3" }}
                  draggable={false}
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-md p-6"
          >
            <motion.div
              key="img"
              initial={{ scale: 0.35, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit={{    scale: 0.35, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full"
            >
              <img
                src={zoomed}
                alt="Gallery photo"
                className="w-full h-auto max-h-[82vh] object-contain rounded-xl shadow-2xl"
                draggable={false}
              />
              <button
                onClick={() => setZoomed(null)}
                className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-black border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-colors shadow-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
