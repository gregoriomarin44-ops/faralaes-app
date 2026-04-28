import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="bg-background border-t border-border">
    <div className="container py-12 md:py-16 grid md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <div className="font-serif text-3xl italic font-semibold mb-3">
          Faral<span className="text-primary">aes</span>
        </div>
        <p className="text-muted-foreground text-sm max-w-xs">
          El primer marketplace especializado en moda flamenca de segunda mano y nueva. Hecho en Andalucía con mucho arte.
        </p>
      </div>
      <div>
        <h4 className="font-serif text-lg mb-3">Legal</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/aviso-legal" className="hover:text-primary">Aviso legal</Link></li>
          <li><Link to="/privacidad" className="hover:text-primary">Política de privacidad</Link></li>
          <li><Link to="/terminos" className="hover:text-primary">Términos de uso</Link></li>
          <li><Link to="/cookies" className="hover:text-primary">Cookies</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-serif text-lg mb-3">Contacto</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="mailto:gregoriomarin44@gmail.com" className="inline-flex items-center gap-2 hover:text-primary"><Mail className="w-4 h-4" />gregoriomarin44@gmail.com</a></li>
          <li><a href="https://wa.me/34633195730" className="inline-flex items-center gap-2 hover:text-primary"><MessageCircle className="w-4 h-4" />+34 633 19 57 30</a></li>
          <li><a href="#" className="inline-flex items-center gap-2 hover:text-primary"><Instagram className="w-4 h-4" />@faralaes</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-5 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 justify-between">
        <span>© {new Date().getFullYear()} Faralaes. Todos los derechos reservados.</span>
        <span>Hecho con arte en Sevilla 🌹</span>
      </div>
    </div>
  </footer>
);
