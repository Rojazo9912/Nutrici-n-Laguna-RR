import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Nutrición Laguna RR | Suplementos Deportivos y Bienestar",
  description: "Plataforma e-commerce especializada en proteínas, creatina, pre-entrenamientos y suplementos verificados bajo normatividad COFEPRIS.",
  keywords: ["suplementos", "proteina whey", "creatina monohidratada", "nutricion deportiva", "COFEPRIS", "Nutrición Laguna RR"],
  openGraph: {
    title: "Nutrición Laguna RR - Suplementos Deportivos y Bienestar",
    description: "Venta de suplementos con garantía de calidad, lotes y cumplimiento sanitario.",
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
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
