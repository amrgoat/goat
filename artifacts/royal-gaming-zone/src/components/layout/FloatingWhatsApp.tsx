const PHONE = "8302300828";
const MESSAGE =
  "Hello! I visited the Royal Gaming Zone website and I'd love to learn more about what you offer. Could you share some details?";
const WHATSAPP_URL = `https://wa.me/91${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className={className}>
      <path d="M16.003 2C8.28 2 2 8.28 2 16.003c0 2.47.648 4.786 1.78 6.8L2 30l7.397-1.737A13.94 13.94 0 0 0 16.003 30C23.72 30 30 23.72 30 16.003 30 8.28 23.72 2 16.003 2zm0 25.454a11.39 11.39 0 0 1-5.813-1.593l-.416-.247-4.393 1.032 1.057-4.273-.272-.44A11.39 11.39 0 0 1 4.6 16.003c0-6.29 5.114-11.404 11.403-11.404 6.29 0 11.403 5.114 11.403 11.404 0 6.29-5.113 11.451-11.403 11.451zm6.25-8.545c-.343-.172-2.03-1.001-2.345-1.116-.315-.114-.545-.172-.774.172-.228.344-.887 1.116-1.087 1.346-.2.229-.4.258-.744.086-.343-.172-1.45-.535-2.762-1.704-1.021-.912-1.71-2.037-1.91-2.381-.2-.344-.021-.53.15-.701.155-.154.344-.4.515-.601.172-.2.229-.343.344-.572.115-.228.057-.43-.029-.601-.086-.172-.774-1.863-1.06-2.55-.28-.672-.563-.58-.774-.59l-.658-.012c-.229 0-.6.086-.916.43-.315.344-1.202 1.174-1.202 2.864 0 1.69 1.23 3.322 1.402 3.55.172.229 2.42 3.694 5.864 5.18.82.354 1.46.565 1.958.723.823.26 1.572.224 2.163.136.66-.099 2.03-.83 2.317-1.634.286-.801.286-1.488.2-1.633-.086-.143-.315-.229-.658-.4z"/>
    </svg>
  );
}

export default function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-3"
      data-testid="button-floating-whatsapp"
    >
      <span className="hidden sm:block whitespace-nowrap rounded-full bg-background/95 border border-[#25D366]/30 px-4 py-2 text-sm font-semibold text-white opacity-0 translate-x-2 shadow-lg transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        Chat with us
      </span>
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-transform duration-300 group-hover:scale-110">
        <WhatsAppIcon className="relative w-7 h-7 text-white" />
      </span>
    </a>
  );
}
