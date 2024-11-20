import ReCaptchaProvider from "@/components/captcha";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wakil - Authenticate to your gateway to freedom!",
  description: "hello there",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <header className="fixed w-full flex items-center justify-between">
        {/* Left side: Logo */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="absolute  left-2 pl-10 pt-5 shadow-xl hover:drop-xl">
                <a href="/">
                  <h3 className="text-white font-bold text-3xl">Wakil</h3>
                </a>
              </div>
            </TooltipTrigger>
            <TooltipContent>Back to Home Page</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>
      <ReCaptchaProvider>
      {children}
      </ReCaptchaProvider>
    </main>
  );
}
