import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, User, Users } from "lucide-react";

/* ─── Game catalogue ─────────────────────────────────────────── */
const solo = [
  { name: "God of War Ragnarök",      image: "/games/db582a935082e0d61fab9be5a041069c.jpg"                                   },
  { name: "GTA 5",                    image: "/games/71uizbdZ5dL.jpg"                                                       },
  { name: "The Last of Us",           image: "/games/df3778fa297282cf5825a135510ca420.jpg"                                   },
  { name: "Spider-Man: Miles Morales",image: "/games/d1e4b0f2559e0e37ef86862d6018698a.jpg"                                  },
  { name: "Red Dead Redemption 2",    image: "/games/18ea1548af776e3305c60114af477d2a.jpg"                                   },
  { name: "Cyberpunk 2077",           image: "/games/is-cyberpunk-cover-art-based-on-blade-runners-v0-p99esbve7sf81.jpg"    },
  { name: "Ghost of Tsushima",        image: "/games/8437c6050170789bd804370a30a527ae.jpg"                                   },
  { name: "Uncharted",                image: "/games/6807e3e42c5b7653ecdb51d62694915a.jpg"                                   },
  { name: "Days Gone",                image: "/games/76604214217ad3efc6508840031cf691.jpg"                                   },
  { name: "Hitman 3",                 image: "/games/86b8ce85bac8dea1cede64f8ae7e3dae_81edae72136714ff6328701b67b0a3b0.jpg" },
  { name: "Resident Evil Village",    image: "/games/96569a5d0e8c7b230cf11305d4c6798b.jpg"                                   },
];

const multiplayer = [
  { name: "Tekken 7",           image: "/games/14aa498e66f4f526109c8235a860b6e3.jpg"                                              },
  { name: "It Takes Two",       image: "/games/15a7ab3111fa4254ae0e63c4a93205f9.jpg"                                              },
  { name: "WWE 2K25",           image: "/games/58a1b96ca5f06339115a451830c9b492.jpg"                                              },
  { name: "Mortal Kombat 11",   image: "/games/its-like-night-and-day-with-the-quality-of-these-cover-arts-v0-00cfctonr83f1.jpg" },
];

const all = [...solo, ...multiplayer];

/* ─── Marquee constants ──────────────────────────────────────── */
const MARQUEE_ITEMS = [...all, ...all];
const CARD_W = 78;
const GAP    = 8;
const STEP   = CARD_W + GAP;
const HALF   = all.length * STEP;

type Game = typeof all[0];

/* ─── Plain CSS tile — no framer-motion overhead ─────────────── */
function GameTile({ game, onClick }: { game: Game; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col focus:outline-none"
      aria-label={game.name}
    >
      <div
        className="relative rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/60 transition-colors duration-150 w-full"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={game.image}
          alt={game.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />
      </div>
      <p className="mt-1 text-[9px] text-gray-400 group-hover:text-primary font-bold uppercase leading-tight tracking-wide line-clamp-2 text-center transition-colors duration-150 px-0.5">
        {game.name}
      </p>
    </button>
  );
}

/* ─── Category box — CSS fade-in only ───────────────────────── */
function CategoryBox({
  label, icon: Icon, games, onSelect,
}: {
  label: string;
  icon: React.ElementType;
  games: Game[];
  onSelect: (g: Game) => void;
}) {
  return (
    <div className="flex-1 min-w-0 glass-panel border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-white font-display font-bold uppercase tracking-widest text-sm">{label}</span>
        <span className="ml-auto text-gray-600 text-xs font-mono">{games.length}</span>
      </div>
      <div className="p-3 grid grid-cols-5 gap-2">
        {games.map((g) => (
          <GameTile key={g.name} game={g} onClick={() => onSelect(g)} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function GamesLibrary() {
  const [selected, setSelected] = useState<Game | null>(null);

  /* Marquee — RAF loop, GPU-only transform */
  const trackRef     = useRef<HTMLDivElement>(null);
  const posRef       = useRef(0);
  const rafRef       = useRef<number | null>(null);
  const pausedRef    = useRef(false);
  const touchLastX   = useRef(0);
  const unpauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    if (!pausedRef.current) {
      posRef.current += 0.45;
      if (posRef.current >= HALF) posRef.current -= HALF;
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (unpauseTimer.current) clearTimeout(unpauseTimer.current);
    };
  }, [tick]);

  function nudge(dir: 1 | -1) {
    posRef.current += dir * STEP * 4;
    if (posRef.current >= HALF) posRef.current -= HALF;
    if (posRef.current < 0)     posRef.current += HALF;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (unpauseTimer.current) { clearTimeout(unpauseTimer.current); unpauseTimer.current = null; }
    pausedRef.current = true;
    touchLastX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = touchLastX.current - e.touches[0].clientX;
    posRef.current = ((posRef.current + dx) % HALF + HALF) % HALF;
    touchLastX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (unpauseTimer.current) clearTimeout(unpauseTimer.current);
    unpauseTimer.current = setTimeout(() => {
      pausedRef.current = false;
      unpauseTimer.current = null;
    }, 1200);
  };

  return (
    <section id="games" className="py-12 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 uppercase tracking-wider text-glow">
          Games <span className="text-primary">Library</span>
        </h2>
        <p className="text-gray-400 text-lg mb-8">{all.length}+ titles available across all zones.</p>
      </div>

      {/* ── Marquee strip ── */}
      <div className="relative mb-10 group/strip">
        <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-card to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l from-card to-transparent" />

        <button
          onClick={() => nudge(-1)}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/10 text-white/60 hover:text-primary hover:border-primary/50 flex items-center justify-center transition-colors opacity-0 group-hover/strip:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => nudge(1)}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/10 text-white/60 hover:text-primary hover:border-primary/50 flex items-center justify-center transition-colors opacity-0 group-hover/strip:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          className="overflow-hidden cursor-grab"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={trackRef}
            className="flex"
            style={{ gap: `${GAP}px`, willChange: "transform", paddingLeft: "24px" }}
          >
            {MARQUEE_ITEMS.map((game, i) => (
              <div
                key={`${game.name}-${i}`}
                onClick={() => setSelected(game)}
                className="shrink-0 cursor-pointer group/card"
                style={{ width: `${CARD_W}px` }}
              >
                <div
                  className="rounded-xl overflow-hidden border border-white/10 group-hover/card:border-primary/60 relative transition-colors duration-200"
                  style={{ aspectRatio: "2/3" }}
                >
                  <img
                    src={game.image}
                    alt={game.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* name — always visible in strip */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white text-[7px] font-bold uppercase leading-tight tracking-wide line-clamp-2">
                      {game.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two category boxes ── */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col sm:flex-row gap-2">
          <CategoryBox label="Solo"        icon={User}  games={solo}        onSelect={setSelected} />
          <CategoryBox label="Multiplayer" icon={Users} games={multiplayer} onSelect={setSelected} />
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
          >
            <motion.div
              key="card"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{    scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[260px] glass-panel rounded-2xl overflow-hidden border border-primary/50 box-glow"
            >
              <img
                src={selected.image}
                alt={selected.name}
                className="w-full object-cover"
                style={{ aspectRatio: "2/3" }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                <p className="text-white font-display font-bold text-xl uppercase tracking-wide leading-snug text-glow">
                  {selected.name}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-colors"
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
