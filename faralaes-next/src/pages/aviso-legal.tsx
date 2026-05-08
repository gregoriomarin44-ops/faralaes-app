import LegalText from "../components/LegalText";

export default function AvisoLegal() {
  return (
    <LegalText
      title="Aviso legal"
      intro="Información legal básica de Faralaes como plataforma online de compraventa de moda flamenca. Este texto debe revisarse y completarse con los datos definitivos del titular del servicio."
      sections={[
        {
          title: "Titularidad",
          body: "Faralaes es el nombre comercial de la plataforma. El titular, domicilio, NIF/CIF y datos de contacto deberán completarse antes de la puesta en producción.",
        },
        {
          title: "Objeto",
          body: "La web facilita la publicación y consulta de anuncios relacionados con trajes, complementos y prendas flamencas entre personas usuarias.",
        },
        {
          title: "Responsabilidad",
          body: "Faralaes actúa como plataforma tecnológica y no participa directamente en las compraventas entre usuarios, salvo en las funcionalidades propias del servicio.",
        },
        {
          title: "Propiedad intelectual",
          body: "Los contenidos, marca, diseño y elementos de Faralaes quedan protegidos por la normativa aplicable. Las imágenes subidas por usuarios deben contar con autorización suficiente.",
        },
      ]}
    />
  );
}
