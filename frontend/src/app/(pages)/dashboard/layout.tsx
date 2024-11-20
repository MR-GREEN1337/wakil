import { Sidebar } from "@/components/sidebar/sidebar";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { Metadata } from "next";
import { usePathname } from "next/navigation";
import { ClientSidebar } from "./page";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/providers/session-create-provider";

export const metadata: Metadata = {
  title: "Wakil - Your Space",
  description: "hello there",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-slate-990 overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:block">
        <ClientSidebar />
      </div>
      {/* Hamburger Menu for Small Screens */}
      <div className="md:hidden absolute top-4 right-4">
        <ClientSidebar /> {/* Render the same sidebar here */}
      </div>
      <div className="flex-1">
        {children}
        <Toaster />
      </div>
      {/* 
      <ShootingStars />
      <StarsBackground />
      */}
    </div>
  );
}
