import LegalText from "../components/LegalText";

export default function Condiciones() {
  return (
    <LegalText
      title="Condiciones de uso"
      intro="Estas condiciones regulan el acceso y uso de Faralaes. Son una base funcional pendiente de revisión jurídica antes del lanzamiento definitivo."
      sections={[
        {
          title: "Uso de la plataforma",
          body: "La persona usuaria se compromete a facilitar información veraz, mantener sus credenciales seguras y usar Faralaes conforme a la ley y la buena fe.",
        },
        {
          title: "Publicación de anuncios",
          body: "Los anuncios deben corresponder a productos reales, con información suficiente sobre estado, precio, ubicación, imágenes y forma de contacto.",
        },
        {
          title: "Compraventas",
          body: "Las operaciones se acuerdan entre comprador y vendedor. Faralaes no garantiza pagos, envíos ni estado final de los productos salvo que se habiliten servicios específicos.",
        },
        {
          title: "Retirada de contenidos",
          body: "Faralaes podrá retirar anuncios o suspender cuentas cuando detecte fraude, contenido ilícito, infracción de derechos o incumplimiento de estas condiciones.",
        },
      ]}
    />
  );
}
