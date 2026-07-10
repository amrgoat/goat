import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const categories = [
  { name: "Burgers", icon: "🍔", count: "5 varieties", anchor: "burgers" },
  { name: "Fries", icon: "🍟", count: "3 varieties", anchor: "fries" },
  { name: "Maggi", icon: "🍜", count: "4 varieties", anchor: "maggi" },
  { name: "Pasta", icon: "🍝", count: "3 varieties", anchor: "pasta" },
  { name: "Sandwiches", icon: "🥪", count: "3 varieties", anchor: "sandwiches" },
  { name: "Shakes & Drinks", icon: "🥤", count: "10+ varieties", anchor: "shakes" },
];

export default function FeaturedFood() {
  return (
    <section className="pt-8 pb-24 bg-card relative overflow-hidden border-t border-primary/10">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <div className="relative rounded-2xl overflow-hidden glass-panel border-primary/20 aspect-[4/3] sm:aspect-video box-glow">
              <img
                src="/images/food-hero.png"
                alt="Delicious gaming cafe food"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-primary text-xs font-bold tracking-widest uppercase mb-3 backdrop-blur-md">
                  Cafe &amp; Snacks
                </div>
                <h3 className="text-3xl font-display font-bold text-white tracking-wider text-glow">
                  FUEL YOUR <span className="text-primary">GAME</span>
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase tracking-wider text-glow">
              Our <span className="text-primary">Menu</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Hot snacks and cold drinks served right at your setup so you never miss a beat.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={`/menu#${cat.anchor}`}
                    className="flex flex-col items-center justify-center p-4 glass-panel border border-white/5 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer block"
                    data-testid={`card-menu-category-${i}`}
                  >
                    <span className="text-2xl mb-2">{cat.icon}</span>
                    <span className="text-gray-200 font-display font-bold text-sm uppercase tracking-wider group-hover:text-primary transition-colors text-center">{cat.name}</span>
                    <span className="text-gray-500 text-xs mt-0.5">{cat.count}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <Button size="lg" className="h-14 px-8 bg-transparent text-primary border border-primary hover:bg-primary hover:text-black tracking-widest font-bold uppercase transition-all box-glow-hover" asChild>
              <Link href="/menu">View Full Menu</Link>
            </Button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
