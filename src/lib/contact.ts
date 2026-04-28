// Datos de contacto centralizados de Faralaes
export const CONTACT = {
  email: "gregoriomarin44@gmail.com",
  // Formato internacional sin "+" ni espacios para wa.me
  whatsappRaw: "34633195730",
  // Formato visible para mostrar en la web
  whatsappDisplay: "+34 633 19 57 30",
};

export const waLink = (text: string) =>
  `https://wa.me/${CONTACT.whatsappRaw}?text=${encodeURIComponent(text)}`;

// Construye un enlace mailto con asunto y cuerpo pre-rellenados
export const mailtoLink = (subject: string, body: string) =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
