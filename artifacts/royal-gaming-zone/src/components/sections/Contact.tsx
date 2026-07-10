import { motion } from "framer-motion";
import { Phone, Instagram, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const PHONE = "8302300828";
const WHATSAPP_URL = `https://wa.me/91${PHONE}`;
const INSTAGRAM_URL = "https://instagram.com/royalgamingzone2026";
const MAPS_URL = "https://maps.app.goo.gl/n6GfnhUbPxGGsm1g7";
const MAPS_EMBED = "https://maps.google.com/maps?q=New+Dana+Mandi+Near+Warehouse+Radhe+Radhe+Textile+Padampur+Rajasthan&output=embed&z=17";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
    >
      <path d="M16.003 2C8.28 2 2 8.28 2 16.003c0 2.47.648 4.786 1.78 6.8L2 30l7.397-1.737A13.94 13.94 0 0 0 16.003 30C23.72 30 30 23.72 30 16.003 30 8.28 23.72 2 16.003 2zm0 25.454a11.39 11.39 0 0 1-5.813-1.593l-.416-.247-4.393 1.032 1.057-4.273-.272-.44A11.39 11.39 0 0 1 4.6 16.003c0-6.29 5.114-11.404 11.403-11.404 6.29 0 11.403 5.114 11.403 11.404 0 6.29-5.113 11.451-11.403 11.451zm6.25-8.545c-.343-.172-2.03-1.001-2.345-1.116-.315-.114-.545-.172-.774.172-.228.344-.887 1.116-1.087 1.346-.2.229-.4.258-.744.086-.343-.172-1.45-.535-2.762-1.704-1.021-.912-1.71-2.037-1.91-2.381-.2-.344-.021-.53.15-.701.155-.154.344-.4.515-.601.172-.2.229-.343.344-.572.115-.228.057-.43-.029-.601-.086-.172-.774-1.863-1.06-2.55-.28-.672-.563-.58-.774-.59l-.658-.012c-.229 0-.6.086-.916.43-.315.344-1.202 1.174-1.202 2.864 0 1.69 1.23 3.322 1.402 3.55.172.229 2.42 3.694 5.864 5.18.82.354 1.46.565 1.958.723.823.26 1.572.224 2.163.136.66-.099 2.03-.83 2.317-1.634.286-.801.286-1.488.2-1.633-.086-.143-.315-.229-.658-.4z"/>
    </svg>
  );
}

export default function Contact() {
  return (
    <section id="contact" className="py-12 bg-background relative border-t border-primary/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase tracking-wider text-glow"
          >
            Drop <span className="text-primary">In</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Ready to play? Find us, call us, or slide into our DMs.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="glass-panel border border-white/5 rounded-xl p-8 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-2 tracking-wider">Location</h3>
                  <p className="text-gray-400 leading-relaxed">
                    New Dana Mandi, Near Warehouse<br />
                    On Radhe Radhe Textile, Padampur
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel border border-white/5 rounded-xl p-8 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-2 tracking-wider">Opening Hours</h3>
                  <p className="text-gray-400">Mon – Sun: 10:00 AM – 08:00 PM</p>
                </div>
              </div>
            </div>

            <div className="glass-panel border border-primary/30 rounded-xl p-6 flex items-center justify-between box-glow bg-primary/5">
              <div className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-primary animate-pulse" />
                <div>
                  <div className="text-sm text-gray-400 font-medium">Call for booking</div>
                  <a
                    href={`tel:+91${PHONE}`}
                    className="text-2xl font-display font-bold text-white tracking-widest hover:text-primary transition-colors"
                    data-testid="link-phone"
                  >
                    +91 {PHONE}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <Button
                className="flex-1 h-14 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-black font-bold tracking-wider text-base gap-3"
                asChild
                data-testid="button-whatsapp"
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-5 h-5 shrink-0" />
                  WhatsApp
                </a>
              </Button>
              <Button
                className="flex-1 h-14 bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/30 hover:bg-[#E1306C] hover:text-white font-bold tracking-wider text-base gap-3"
                asChild
                data-testid="button-instagram"
              >
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-5 h-5 shrink-0" />
                  Instagram
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden glass-panel border border-white/10 h-[420px] lg:h-auto relative flex flex-col"
          >
            <iframe
              src={MAPS_EMBED}
              className="w-full flex-1 min-h-[320px]"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Royal Gaming Zone Location"
            />
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-card/80">
              <div>
                <p className="text-white font-display font-bold text-sm tracking-wide">Royal Gaming Zone</p>
                <p className="text-gray-500 text-xs">New Dana Mandi, Padampur</p>
              </div>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 border border-primary/40 rounded-full text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors"
                data-testid="link-maps"
              >
                Open in Maps
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
