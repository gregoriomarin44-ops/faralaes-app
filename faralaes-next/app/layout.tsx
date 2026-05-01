import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Faralaes",
  description: "Compraventa de moda flamenca",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
