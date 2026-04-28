import { Footer } from "@/components/Footer";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  sections: LegalSection[];
};

const editableOwner =
  "Responsable editable: Faralaes / Nombre del titular o sociedad, NIF/CIF pendiente, domicilio pendiente, email de contacto: gregoriomarin44@gmail.com.";

const LegalPage = ({ eyebrow, title, updatedAt, sections }: LegalPageProps) => (
  <main className="min-h-screen bg-background">
    <section className="container max-w-4xl py-12 md:py-20">
      <div className="mb-10">
        <span className="text-primary text-sm font-medium uppercase tracking-widest">{eyebrow}</span>
        <h1 className="font-serif text-3xl md:text-5xl mt-3">{title}</h1>
        <p className="text-sm text-muted-foreground mt-3">Última actualización: {updatedAt}</p>
      </div>

      <div className="space-y-8 text-foreground/85 leading-7">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-serif text-2xl text-foreground mb-3">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
    <Footer />
  </main>
);

export const AvisoLegal = () => (
  <LegalPage
    eyebrow="Legal"
    title="Aviso legal"
    updatedAt="25 de abril de 2026"
    sections={[
      {
        title: "Responsable del sitio",
        paragraphs: [
          editableOwner,
          "Este aviso legal regula el acceso y uso de Faralaes, una plataforma online orientada a la publicación y consulta de anuncios de compraventa de moda flamenca entre particulares.",
        ],
      },
      {
        title: "Finalidad de Faralaes",
        paragraphs: [
          "Faralaes facilita que usuarios particulares publiquen anuncios, contacten entre sí y acuerden, bajo su responsabilidad, las condiciones de una posible compraventa.",
          "Faralaes no es propietaria de los artículos anunciados, no verifica de forma previa todos los anuncios y no intermedia pagos, envíos, entregas ni garantías entre usuarios.",
        ],
      },
      {
        title: "Responsabilidad",
        paragraphs: [
          "Cada usuario es responsable de la veracidad, legalidad y exactitud del contenido que publica, así como de las comunicaciones y acuerdos que alcance con otros usuarios.",
          "Faralaes podrá retirar anuncios, bloquear cuentas o revisar contenidos cuando detecte usos contrarios a la ley, a estas condiciones o a la seguridad de la comunidad.",
        ],
      },
      {
        title: "Propiedad intelectual",
        paragraphs: [
          "Los textos, marca, diseño y elementos propios de Faralaes pertenecen a sus titulares. Los usuarios conservan los derechos sobre las imágenes y contenidos que suben, autorizando su uso dentro de la plataforma para mostrar sus anuncios.",
        ],
      },
    ]}
  />
);

export const Privacidad = () => (
  <LegalPage
    eyebrow="Privacidad"
    title="Política de privacidad"
    updatedAt="25 de abril de 2026"
    sections={[
      {
        title: "Responsable del tratamiento",
        paragraphs: [
          editableOwner,
          "Esta política se aplica a los datos personales tratados en Faralaes conforme al Reglamento General de Protección de Datos (RGPD) y la normativa española aplicable.",
        ],
      },
      {
        title: "Datos que tratamos",
        paragraphs: [
          "Podemos tratar datos de cuenta como email, identificador de usuario, nombre público, ubicación, bio, teléfono o WhatsApp si el usuario lo facilita, anuncios publicados, favoritos, mensajes internos, reportes y datos técnicos necesarios para prestar el servicio.",
          "Los usuarios no deben publicar datos personales sensibles ni información de terceros sin autorización.",
        ],
      },
      {
        title: "Finalidades",
        paragraphs: [
          "Usamos los datos para crear y gestionar cuentas, permitir la publicación de anuncios, mostrar perfiles públicos, facilitar mensajes entre usuarios, gestionar favoritos, moderar reportes, prevenir abusos y mantener la seguridad de la plataforma.",
          "También podemos usar datos técnicos y cookies necesarias para el funcionamiento, autenticación y mejora básica del servicio.",
        ],
      },
      {
        title: "Base legal y conservación",
        paragraphs: [
          "La base legal principal es la ejecución de la relación con el usuario, el consentimiento cuando proceda y el interés legítimo en mantener una plataforma segura.",
          "Los datos se conservarán mientras la cuenta esté activa o sean necesarios para atender responsabilidades legales, resolver incidencias o prevenir abusos.",
        ],
      },
      {
        title: "Derechos",
        paragraphs: [
          "El usuario puede solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo al email de contacto indicado. También puede presentar reclamación ante la Agencia Española de Protección de Datos si considera que sus derechos no han sido atendidos.",
        ],
      },
    ]}
  />
);

export const Terminos = () => (
  <LegalPage
    eyebrow="Condiciones"
    title="Términos de uso"
    updatedAt="25 de abril de 2026"
    sections={[
      {
        title: "Uso de la plataforma",
        paragraphs: [
          "Faralaes es una plataforma de anuncios para moda flamenca. Al usarla, el usuario se compromete a publicar información veraz, mantener un trato respetuoso y utilizar la mensajería para consultas relacionadas con los anuncios.",
          "La compraventa, entrega, envío, pago o cualquier acuerdo económico se realiza directamente entre usuarios y fuera de Faralaes.",
        ],
      },
      {
        title: "Normas de publicación",
        paragraphs: [
          "No está permitido publicar contenido ilegal, falso, ofensivo, discriminatorio, fraudulento, que infrinja derechos de terceros o que no esté relacionado con la finalidad de la plataforma.",
          "Los anuncios deben describir el artículo con claridad, incluir precio real y no inducir a error sobre estado, talla, ubicación, titularidad o disponibilidad.",
        ],
      },
      {
        title: "Mensajes y conducta",
        paragraphs: [
          "No se permite el acoso, spam, suplantación de identidad, intentos de estafa, envío de enlaces maliciosos ni uso de la plataforma para fines ajenos a la compraventa permitida.",
          "Faralaes puede revisar reportes y adoptar medidas como ocultar anuncios, marcar reportes como revisados, limitar cuentas o retirar contenido.",
        ],
      },
      {
        title: "Sin intermediación en pagos",
        paragraphs: [
          "Faralaes no procesa pagos, no custodia dinero, no organiza envíos y no garantiza la calidad, autenticidad, disponibilidad o entrega de los artículos. Los usuarios deben actuar con prudencia y conservar evidencias de sus acuerdos.",
        ],
      },
    ]}
  />
);

export const Cookies = () => (
  <LegalPage
    eyebrow="Cookies"
    title="Política de cookies"
    updatedAt="25 de abril de 2026"
    sections={[
      {
        title: "Qué son las cookies",
        paragraphs: [
          "Las cookies y tecnologías similares permiten que una web recuerde información sobre la navegación o el dispositivo. En Faralaes se usan de forma básica para que la aplicación funcione correctamente.",
        ],
      },
      {
        title: "Cookies necesarias",
        paragraphs: [
          "Faralaes puede utilizar almacenamiento local y cookies técnicas asociadas a Supabase para mantener la sesión, autenticar al usuario, recordar preferencias necesarias y proteger el acceso a funciones privadas.",
          "Estas cookies son necesarias para prestar el servicio y no requieren consentimiento previo según la normativa aplicable cuando se limitan a finalidades técnicas.",
        ],
      },
      {
        title: "Cookies analíticas o publicitarias",
        paragraphs: [
          "En esta fase MVP no se prevé el uso de cookies publicitarias ni analíticas no necesarias. Si se incorporan en el futuro, se informará al usuario y se solicitará consentimiento cuando corresponda.",
        ],
      },
      {
        title: "Gestión",
        paragraphs: [
          "El usuario puede borrar o bloquear cookies desde la configuración de su navegador. Algunas funciones, como el inicio de sesión, pueden dejar de funcionar correctamente si se desactivan las cookies o el almacenamiento local necesarios.",
        ],
      },
    ]}
  />
);
