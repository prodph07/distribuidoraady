import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { AgeGate } from "@/components/AgeGate";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Distribuidora Premium",
  description: "Sua bebida gelada, rápida e fácil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} antialiased bg-background text-foreground`}>
        <Providers>
          <AgeGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
