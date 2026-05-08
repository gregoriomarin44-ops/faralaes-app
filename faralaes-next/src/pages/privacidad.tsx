import LegalText from "../components/LegalText";

export default function Privacidad() {
  return (
    <LegalText
      title="Política de privacidad"
      intro="Esta política resume cómo Faralaes trata datos personales. Debe completarse con los datos definitivos del responsable antes de producción."
      sections={[
        {
          title: "Responsable",
          body: "El responsable del tratamiento será el titular de Faralaes, cuyos datos identificativos y canal de contacto deberán figurar en el aviso legal.",
        },
        {
          title: "Datos tratados",
          body: "Tratamos datos de cuenta, perfil, contacto, anuncios publicados, mensajes y preferencias necesarias para prestar el servicio.",
        },
        {
          title: "Finalidades",
          body: "Gestionar cuentas, publicar anuncios, facilitar el contacto entre usuarios, atender consultas, prevenir fraude y cumplir obligaciones legales.",
        },
        {
          title: "Derechos",
          body: "Puedes solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad mediante el canal de contacto habilitado.",
        },
        {
          title: "Conservación",
          body: "Los datos se conservarán mientras exista cuenta activa, relación con la plataforma o responsabilidades legales que atender.",
        },
      ]}
    />
  );
}
