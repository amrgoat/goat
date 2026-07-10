import { motion } from "framer-motion";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";

export default function Menu() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const menuCategories = [
    {
      title: "Burgers",
      anchor: "burgers",
      items: [
        { name: "Veg Burger", price: "₹50" },
        { name: "Special Burger", price: "₹60" },
        { name: "Paneer Burger", price: "₹70" },
        { name: "Cheese Burger", price: "₹70" },
        { name: "Cheese Paneer Burger", price: "₹80", popular: true },
      ]
    },
    {
      title: "Fries",
      anchor: "fries",
      items: [
        { name: "French Fries", price: "₹60" },
        { name: "Masala Fries", price: "₹70" },
        { name: "Peri-Peri Fries", price: "₹70", popular: true },
      ]
    },
    {
      title: "Sweet Corn",
      anchor: "sweetcorn",
      items: [
        { name: "Plain Sweet Corn", price: "₹50" },
        { name: "Veg Sweet Corn", price: "₹60" },
        { name: "Cream Sweet Corn", price: "₹70" },
      ]
    },
    {
      title: "Maggi",
      anchor: "maggi",
      items: [
        { name: "Plain Maggi", price: "₹60" },
        { name: "Veg Maggi", price: "₹80" },
        { name: "Cheese Maggi", price: "₹90" },
        { name: "Cheese Paneer Maggi", price: "₹99", popular: true },
      ]
    },
    {
      title: "Pasta",
      anchor: "pasta",
      items: [
        { name: "Red Sauce Pasta", price: "₹120" },
        { name: "White Sauce Pasta", price: "₹120", popular: true },
        { name: "Tandoori Pasta", price: "₹120" },
      ]
    },
    {
      title: "Sandwiches",
      anchor: "sandwiches",
      items: [
        { name: "Veggie Sandwich", price: "₹60" },
        { name: "Tandoori Sandwich", price: "₹70" },
        { name: "Cheese Corn Sandwich", price: "₹80" },
      ]
    },
    {
      title: "Coffee",
      anchor: "coffee",
      items: [
        { name: "Hot Coffee", price: "₹40" },
        { name: "Vanilla Coffee", price: "₹50" },
        { name: "Butterscotch Coffee", price: "₹60" },
        { name: "Hazelnut Coffee", price: "₹60" },
      ]
    },
    {
      title: "Mocktails & Drinks",
      anchor: "drinks",
      items: [
        { name: "Soft Drink", price: "₹30" },
        { name: "Lemon Soda", price: "₹50" },
        { name: "Mint Mojito", price: "₹60", popular: true },
        { name: "Blue Berry", price: "₹60" },
      ]
    },
  ];

  const shakes = [
    { name: "Cold Coffee", price1: "₹70", price2: "₹80" },
    { name: "Butterscotch", price1: "₹80", price2: "₹90" },
    { name: "Vanilla", price1: "₹80", price2: "₹90" },
    { name: "Strawberry", price1: "₹80", price2: "₹90" },
    { name: "Chocolate", price1: "₹80", price2: "₹90" },
    { name: "Oreo", price1: "₹80", price2: "₹90", popular: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow pt-20">
        {/* Menu Header */}
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/menu-header.png')" }}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>
          
          <div className="relative z-10 text-center px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-display font-bold text-white mb-4 uppercase tracking-widest text-glow"
            >
              CAFE <span className="text-primary">MENU</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-300 max-w-xl mx-auto mb-5"
            >
              Order directly to your setup. Never pause your game.
            </motion.p>
            <motion.a
              href="tel:+918302300828"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/40 text-primary font-display font-bold tracking-widest text-base hover:bg-primary hover:text-black transition-all box-glow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Call to Order: +91 8302300828
            </motion.a>
          </div>
        </section>

        {/* Menu Content */}
        <section className="py-16 container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            
            {menuCategories.map((category, idx) => (
              <motion.div 
                key={category.title}
                id={(category as any).anchor}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 2) * 0.1 }}
                className="glass-panel p-8 rounded-xl border border-white/5 hover:border-primary/20 transition-colors scroll-mt-24"
              >
                <h2 className="text-3xl font-display font-bold text-white mb-6 uppercase tracking-wider text-glow flex items-center gap-3">
                  <span className="w-8 h-1 bg-primary rounded-full"></span>
                  {category.title}
                </h2>
                
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex flex-col border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-lg text-gray-200 font-medium">
                          {item.name}
                        </h4>
                        <span className="text-xl font-display font-bold text-primary">{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Shakes Section - Special Layout */}
            <motion.div 
              id="shakes"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 glass-panel p-8 rounded-xl border border-primary/30 bg-primary/5 box-glow scroll-mt-24"
            >
              <h2 className="text-3xl font-display font-bold text-white uppercase tracking-wider text-glow flex items-center gap-3 mb-6">
                <span className="w-8 h-1 bg-primary rounded-full"></span>
                Shakes
              </h2>

              {/* Column headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 mb-3">
                <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase text-gray-500 pb-2 border-b border-white/10">
                  <span>Flavour</span>
                  <div className="flex gap-6">
                    <span>w/o Ice Cream</span>
                    <span className="text-primary w-16 text-right">With Ice Cream</span>
                  </div>
                </div>
                <div className="hidden md:flex justify-between items-center text-xs font-bold tracking-widest uppercase text-gray-500 pb-2 border-b border-white/10">
                  <span>Flavour</span>
                  <div className="flex gap-6">
                    <span>w/o Ice Cream</span>
                    <span className="text-primary w-16 text-right">With Ice Cream</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                {shakes.map((item) => (
                  <div key={item.name} className="flex justify-between items-center border-b border-white/5 py-3">
                    <h4 className="text-base text-gray-200 font-medium">
                      {item.name}
                      {item.popular && <span className="ml-2 text-[10px] font-bold text-primary border border-primary/40 rounded px-1.5 py-0.5 uppercase tracking-widest">Popular</span>}
                    </h4>
                    <div className="flex gap-6 items-center shrink-0">
                      <span className="text-base font-display text-gray-400 w-10 text-right">{item.price1}</span>
                      <span className="text-lg font-display font-bold text-primary w-16 text-right">{item.price2}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
