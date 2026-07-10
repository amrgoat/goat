import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { User, Users, X } from "lucide-react";

const ps4Pricing = [
  { label: "1 Player", price: "₹49 / 30min", price2: "₹79 / 1hr" },
  { label: "2 Players", price: "₹79 / 30min", price2: "₹139 / 1hr" },
  { label: "3 Players", price: "₹109 / 30min", price2: "₹199 / 1hr" },
  { label: "4 Players", price: "₹149 / 30min", price2: "₹249 / 1hr" },
];

export default function GamingZones() {
  const [ps4ModalOpen, setPs4ModalOpen] = useState(false);

  const zones = [
    {
      id: "ps4",
      title: "PS4 ZONE",
      description: "Classic console gaming with a massive library of hits.",
      status: "Available Now",
      statusColor: "text-green-400 bg-green-400/10 border-green-400/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]",
      image: "/images/ps4-zone.png",
      hasPricing: true,
    },
    {
      id: "ps5",
      title: "PS5 ZONE",
      description: "Next-gen graphics, lightning-fast loads, and haptic feedback.",
      status: "Coming Soon",
      statusColor: "text-primary bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(0,255,255,0.2)]",
      image: "/images/ps5-zone.png",
      hasPricing: false,
    },
    {
      id: "racing",
      title: "RACING SIMULATOR",
      description: "Full cockpit experience with force feedback steering.",
      status: "Coming Soon",
      statusColor: "text-primary bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(0,255,255,0.2)]",
      image: "/images/racing-zone.png",
      hasPricing: false,
    },
  ];

  return (
    <section id="zones" className="py-12 bg-background relative border-t border-primary/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase tracking-wider text-glow"
          >
            Gaming <span className="text-primary">Zones</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Choose your battleground. Every setup is optimized for peak performance and maximum immersion.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {zones.map((zone, index) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="group relative rounded-xl overflow-hidden glass-panel border-primary/20 box-glow-hover transition-all duration-500 flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-background/20 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                <img
                  src={zone.image}
                  alt={zone.title}
                  className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 z-20">
                  <Badge variant="outline" className={`px-3 py-1 uppercase tracking-widest text-xs font-bold backdrop-blur-md ${zone.statusColor}`}>
                    {zone.status}
                  </Badge>
                </div>
              </div>

              <div className="p-6 relative z-20 flex-grow bg-gradient-to-t from-card to-card/50">
                <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-wide group-hover:text-primary transition-colors">
                  {zone.title}
                </h3>
                <p className="text-gray-400 mb-4">
                  {zone.description}
                </p>

                {zone.hasPricing && (
                  <button
                    onClick={() => setPs4ModalOpen(true)}
                    className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-widest hover:text-white transition-colors"
                    data-testid="button-ps4-pricing-toggle"
                  >
                    <span>View Pricing</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* PS4 Pricing Modal */}
      <AnimatePresence>
        {ps4ModalOpen && (
          <motion.div
            key="pricing-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPs4ModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          >
            <motion.div
              key="pricing-card"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel border border-primary/30 rounded-2xl overflow-hidden w-full max-w-sm box-glow"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-primary/10">
                <h3 className="font-display font-bold text-white text-lg uppercase tracking-widest">
                  PS4 Zone — <span className="text-primary">Pricing</span>
                </h3>
                <button
                  onClick={() => setPs4ModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
                <div className="px-5 py-3 text-xs font-display font-bold text-gray-400 uppercase tracking-widest">Players</div>
                <div className="px-5 py-3 text-center text-xs font-display font-bold text-gray-400 uppercase tracking-widest">30 Min</div>
                <div className="px-5 py-3 text-center text-xs font-display font-bold text-primary uppercase tracking-widest">1 Hour</div>
              </div>

              {/* Rows */}
              {ps4Pricing.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-3 items-center border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                >
                  <div className="px-5 py-4 flex items-center gap-2">
                    {i === 0 ? <User className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                    <span className="text-gray-200 text-sm font-medium">{row.label}</span>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <span className="text-lg font-display font-bold text-white">{row.price.split(" ")[0]}</span>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <span className="text-lg font-display font-bold text-primary text-glow">{row.price2.split(" ")[0]}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
