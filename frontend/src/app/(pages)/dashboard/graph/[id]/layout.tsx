import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wakil - Compose Your Agent 👨🏻‍💻",
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
  