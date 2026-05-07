import type { GetServerSideProps } from "next";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { hashVerificationToken } from "../lib/emailVerification";
import { prisma } from "../lib/prisma";

type VerificarEmailProps = {
  status: "success" | "invalid" | "expired";
};

export const getServerSideProps: GetServerSideProps<
  VerificarEmailProps
> = async ({ query }) => {
  const token = typeof query.token === "string" ? query.token : "";

  if (!token) {
    return { props: { status: "invalid" } };
  }

  const tokenHash = hashVerificationToken(token);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  });

  if (!verificationToken) {
    return { props: { status: "invalid" } };
  }

  if (verificationToken.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { props: { status: "expired" } };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: verificationToken.userId },
    }),
  ]);

  return { props: { status: "success" } };
};

export default function VerificarEmail({ status }: VerificarEmailProps) {
  const content = {
    success: {
      title: "Cuenta verificada",
      body: "Tu email se ha verificado correctamente. Ya puedes entrar en Faralaes.",
      action: "Entrar",
      href: "/login",
    },
    invalid: {
      title: "Enlace no valido",
      body: "El enlace de verificacion no existe o ya se ha utilizado.",
      action: "Volver al login",
      href: "/login",
    },
    expired: {
      title: "Enlace caducado",
      body: "El enlace de verificacion ha caducado. Puedes pedir otro desde la pantalla de login.",
      action: "Pedir otro enlace",
      href: "/login",
    },
  }[status];

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Faralaes
          </p>
          <h1 className="mt-3 font-serif text-4xl text-gray-950">
            {content.title}
          </h1>
          <p className="mt-4 text-gray-600">{content.body}</p>
          <Link
            href={content.href}
            className="mt-8 inline-flex w-full justify-center rounded bg-green-700 p-3 font-semibold text-white transition hover:bg-green-800"
          >
            {content.action}
          </Link>
        </section>
      </main>
    </>
  );
}
