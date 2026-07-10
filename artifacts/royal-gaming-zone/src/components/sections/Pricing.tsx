import { motion } from "framer-motion";
import { User, Users } from "lucide-react";

const rows = [
  { label: "1 Player", icon: "single", price30: "₹49", price60: "₹79" },
  { label: "2 Players", icon: "multi", price30: "₹79", price60: "₹139" },
  { label: "3 Players", icon: "multi", price30: "₹109", price60: "₹199" },
  { label: "4 Players", icon: "multi", price30: "₹149", price60: "₹249" },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-12 bg-background relative border-t border-primary/10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase tracking-wider text-glow"
          >
            <span className="text-primary">Pricing</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Premium gear. Unbeatable rates.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto glass-panel border border-primary/20 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-primary/10 border-b border-primary/20">
            <div className="px-6 py-4 text-xs font-display font-bold text-gray-400 uppercase tracking-widest">Players</div>
            <div className="px-6 py-4 text-center text-xs font-display font-bold text-gray-400 uppercase tracking-widest">30 Min</div>
            <div className="px-6 py-4 text-center text-xs font-display font-bold text-primary uppercase tracking-widest">1 Hour</div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 items-center border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
            >
              <div className="px-6 py-5 flex items-center gap-3">
                {row.icon === "single" ? (
                  <User className="w-4 h-4 text-gray-500 shrink-0" />
                ) : (
                  <Users className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                <span className="text-gray-200 font-medium">{row.label}</span>
              </div>
              <div className="px-6 py-5 text-center">
                <span className="text-xl font-display font-bold text-white">{row.price30}</span>
              </div>
              <div className="px-6 py-5 text-center">
                <span className="text-xl font-display font-bold text-primary text-glow">{row.price60}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
