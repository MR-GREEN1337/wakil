import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Wakil - Unleash the power of AI Agents",
  description: "hello there",
};

export default function RootLayout({
  children, 
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-slate-950 absolute bottom-0 left-0 right-0 top-0 ${GeistSans.variable} ${GeistMono.variable} text-white`}>
        {children}
        <Toaster />
        <ShootingStars minDelay={2000} />
        <StarsBackground />
        </body>
    </html>
  );
}
