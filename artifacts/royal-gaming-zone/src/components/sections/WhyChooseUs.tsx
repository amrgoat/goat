import { motion } from "framer-motion";
import { Monitor, Wifi, Wind, Armchair, Coffee, Volume2 } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "High-Quality Monitors",
      description: "144Hz+ refresh rates for buttery smooth, zero-latency gameplay."
    },
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "Low Ping Internet",
      description: "Dedicated leased line ensuring you never lag out during clutch moments."
    },
    {
      icon: <Wind className="w-8 h-8" />,
      title: "Air Conditioned",
      description: "Stay cool under pressure with our climate-controlled environment."
    },
    {
      icon: <Armchair className="w-8 h-8" />,
      title: "Comfortable Chairs",
      description: "Ergonomic premium seating designed for marathon gaming sessions."
    },
    {
      icon: <Coffee className="w-8 h-8" />,
      title: "Snacks & Drinks",
      description: "Extensive in-house cafe menu served directly to your setup."
    },
    {
      icon: <Volume2 className="w-8 h-8" />,
      title: "Premium Sound",
      description: "High-fidelity headsets for spatial audio and clear comms."
    }
  ];

  return (
    <section className="py-12 bg-card relative overflow-hidden border-t border-primary/10">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase tracking-wider text-glow"
          >
            Why Choose <span className="text-primary">Us</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            We don't compromise on hardware, comfort, or connectivity.
          </motion.p>
        </div>

        {/* 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel border border-white/5 hover:border-primary/30 p-5 md:p-8 rounded-xl group transition-all duration-300"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4 md:mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-300 box-glow">
                {feature.icon}
              </div>
              <h3 className="text-base md:text-xl font-display font-bold text-white mb-2 md:mb-3 tracking-wider">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
