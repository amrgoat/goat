import { motion } from "framer-motion";
import { Link } from "wouter";
import { Gamepad2, UtensilsCrossed, CalendarPlus, Phone } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-20 overflow-x-hidden">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg.png')", backgroundPosition: "center 20%" }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.1)_0%,transparent_70%)]"></div>
      </div>

      {/* Particle Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at center, #00ffff 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center flex-grow flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto w-full"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium tracking-widest text-sm uppercase box-glow"
          >
            Padampur's First Gaming Zone
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 uppercase tracking-tighter text-glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Level Up <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-300 to-primary">Your Game</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Step into the ultimate gaming experience. State-of-the-art hardware, immersive atmosphere, and a community of gamers who take their play seriously.
          </motion.p>

          {/* Quick-action tiles: Games | Menu | Book Now */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-xl mx-auto pb-8"
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Games tile */}
              <a
                href="#games"
                className="glass-panel border border-white/10 hover:border-primary/50 rounded-xl p-4 flex flex-col items-center gap-2 group transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-white text-sm font-bold group-hover:text-primary transition-colors">Games</p>
                <p className="text-gray-500 text-xs">15+ titles</p>
              </a>

              {/* Menu tile */}
              <Link
                href="/menu"
                className="glass-panel border border-white/10 hover:border-primary/50 rounded-xl p-4 flex flex-col items-center gap-2 group transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                </div>
                <p className="text-white text-sm font-bold group-hover:text-primary transition-colors">Menu</p>
                <p className="text-gray-500 text-xs">Food &amp; drinks</p>
              </Link>

              {/* Book Now tile — go straight to booking if already logged in */}
              <Link
                href={localStorage.getItem("rgz_token") ? "/booking" : "/customer-portal"}
                className="glass-panel border border-primary/30 hover:border-primary/70 bg-primary/5 rounded-xl p-4 flex flex-col items-center gap-2 group transition-all box-glow-hover"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/25 border border-primary/50 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                  <CalendarPlus className="w-5 h-5 text-primary" />
                </div>
                <p className="text-primary text-sm font-bold">Book Now</p>
                <p className="text-gray-500 text-xs text-center leading-tight">Check insta for offers</p>
              </Link>
            </div>

            {/* Contact Us — below tiles */}
            <a
              href="#contact"
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm py-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="tracking-wider uppercase text-xs font-bold">Contact Us</span>
            </a>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
