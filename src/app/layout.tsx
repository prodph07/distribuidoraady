import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { AgeGate } from "@/components/AgeGate";
import { InstallPrompt } from "@/components/InstallPrompt";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Distribuidora do Ady",
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
          <InstallPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}
