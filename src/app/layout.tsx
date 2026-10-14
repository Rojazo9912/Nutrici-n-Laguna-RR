import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StoreProvider } from "@/components/StoreProvider";
import { StoreChrome } from "@/components/StoreChrome";

export const metadata: Metadata = {
  title: "Nutrición Laguna RR | Suplementos Deportivos y Bienestar",
  description: "Plataforma e-commerce especializada en proteínas, creatina, pre-entrenamientos y suplementos con revisión interna de catálogo.",
  keywords: ["suplementos", "proteina whey", "creatina monohidratada", "nutricion deportiva", "COFEPRIS", "Nutrición Laguna RR"],
  openGraph: {
    title: "Nutrición Laguna RR - Suplementos Deportivos y Bienestar",
    description: "Catálogo de suplementos deportivos y bienestar.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen flex flex-col bg-[#070709] text-zinc-100 selection:bg-red-600 selection:text-white antialiased">
        <StoreProvider>
        <StoreChrome><Navbar /></StoreChrome>
        <main className="flex-grow">{children}</main>
        <StoreChrome><Footer /></StoreChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
