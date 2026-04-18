import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

export function WhatsAppSupport() {
  const phoneNumber = '917378903056';
  const message = 'Hi EduTrack Support, I need help with...';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="group relative">
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-[#1e2840] text-white text-sm py-2 px-4 rounded-xl shadow-2xl border border-[#6b778d]/20 whitespace-nowrap">
            Need help? Chat with us!
          </div>
          <div className="w-3 h-3 bg-[#1e2840] border-r border-b border-[#6b778d]/20 rotate-45 absolute -bottom-1.5 right-6"></div>
        </div>

        {/* Pulse Effect */}
        <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20 pointer-events-none"></div>

        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-16 h-16 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 group no-underline"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
        </a>
      </div>
    </div>
  );
}
