import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wakil - Talk money Eh 💸",
  description: "hello there",
};

export default function Layout({
    children, 
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <div>
        {children}
        </div>
    );
  }
  