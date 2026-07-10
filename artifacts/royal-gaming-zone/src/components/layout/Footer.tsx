import { Gamepad2, Instagram, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

const PHONE = "8302300828";
const WHATSAPP_URL = `https://wa.me/91${PHONE}`;
const INSTAGRAM_URL = "https://instagram.com/royalgamingzone2026";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className={className}>
      <path d="M16.003 2C8.28 2 2 8.28 2 16.003c0 2.47.648 4.786 1.78 6.8L2 30l7.397-1.737A13.94 13.94 0 0 0 16.003 30C23.72 30 30 23.72 30 16.003 30 8.28 23.72 2 16.003 2zm0 25.454a11.39 11.39 0 0 1-5.813-1.593l-.416-.247-4.393 1.032 1.057-4.273-.272-.44A11.39 11.39 0 0 1 4.6 16.003c0-6.29 5.114-11.404 11.403-11.404 6.29 0 11.403 5.114 11.403 11.404 0 6.29-5.113 11.451-11.403 11.451zm6.25-8.545c-.343-.172-2.03-1.001-2.345-1.116-.315-.114-.545-.172-.774.172-.228.344-.887 1.116-1.087 1.346-.2.229-.4.258-.744.086-.343-.172-1.45-.535-2.762-1.704-1.021-.912-1.71-2.037-1.91-2.381-.2-.344-.021-.53.15-.701.155-.154.344-.4.515-.601.172-.2.229-.343.344-.572.115-.228.057-.43-.029-.601-.086-.172-.774-1.863-1.06-2.55-.28-.672-.563-.58-.774-.59l-.658-.012c-.229 0-.6.086-.916.43-.315.344-1.202 1.174-1.202 2.864 0 1.69 1.23 3.322 1.402 3.55.172.229 2.42 3.694 5.864 5.18.82.354 1.46.565 1.958.723.823.26 1.572.224 2.163.136.66-.099 2.03-.83 2.317-1.634.286-.801.286-1.488.2-1.633-.086-.143-.315-.229-.658-.4z"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-background border-t border-primary/20 pt-16 pb-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[100px] bg-primary/5 blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-6 inline-flex">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <div className="font-display font-bold text-2xl tracking-widest text-white text-glow">
                ROYAL GAMING ZONE
              </div>
            </Link>
            <p className="text-gray-400 max-w-md mb-6">
              Padampur's first esports and gaming cafe. Level up your game with cutting-edge hardware, immersive atmosphere, and delicious snacks.
            </p>
            <div className="flex items-center gap-4">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-300 hover:text-[#E1306C] hover:border-[#E1306C]/50 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-300 hover:text-[#25D366] hover:border-[#25D366]/50 transition-all">
                <WhatsAppIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-display font-bold text-white mb-6 tracking-wider">QUICK LINKS</h4>
            <ul className="space-y-3">
              <li><a href="/#zones" className="text-gray-400 hover:text-primary transition-colors">Gaming Zones</a></li>
              <li><a href="/#pricing" className="text-gray-400 hover:text-primary transition-colors">Pricing</a></li>
              <li><Link href="/menu" className="text-gray-400 hover:text-primary transition-colors">Food Menu</Link></li>
              <li><Link href="/customer-portal" className="text-gray-400 hover:text-primary transition-colors">Customer Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-display font-bold text-white mb-6 tracking-wider">CONTACT</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-gray-400">New Dana Mandi, Near Warehouse,<br />On Radhe Radhe Textile, Padampur</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href={`tel:+91${PHONE}`} className="text-gray-400 hover:text-primary transition-colors">+91 {PHONE}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Royal Gaming Zone. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
