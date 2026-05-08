import LegalText from "../components/LegalText";

export default function Cookies() {
  return (
    <LegalText
      title="Política de cookies"
      intro="Faralaes prepara una gestión de cookies por capas, con consentimiento separado para cookies analíticas."
      sections={[
        {
          title: "Cookies técnicas",
          body: "Son necesarias para navegación, seguridad, sesión y funcionamiento básico de la plataforma. No requieren consentimiento previo.",
        },
        {
          title: "Cookies analíticas",
          body: "Solo se cargarán si la persona usuaria pulsa Aceptar en el banner. Si se rechazan, no deben cargarse scripts de medición.",
        },
        {
          title: "Gestión",
          body: "La preferencia se guarda localmente en el navegador y puede modificarse borrando los datos del sitio o mediante un panel de configuración futuro.",
        },
      ]}
    />
  );
}
