"use client";

import { useState } from "react"; // Import useState hook for managing state
import { SidebarButton } from "./sidebar-button";
import { SidebarItems } from "@/lib/types";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  LogOut,
  MoreHorizontal,
  RocketIcon,
  Settings,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { toast, useToast } from "../ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useRouter } from "next/navigation";
import { Lock } from 'lucide-react';

interface SidebarDesktopProps {
  sidebarItems: SidebarItems;
  userData: string | null; // Corrected to lowercase 'string'
}

export function SidebarDesktop(props: SidebarDesktopProps) {
  const pathname = usePathname();
  const router = useRouter();
  // State to control popover visibility
  const [popoverOpen, setPopoverOpen] = useState(false);
  const toast = useToast();

  const handleLogout = () => {
    toast.toast({
      title: "See Ya!",
    });
    Cookies.remove("token");
    Cookies.remove("userPaid");
    router.push("/sign-in");
    // Perform any additional logout logic if needed
  };
  return (
    <aside className="w-80 h-full max-w-xs fixed left-0 top-0 z-40 border-r">
      <div className="h-full px-3 py-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <a href="/">
                <h3 className="mx-3 text-lg font-semibold text-white">
                  Wakil{" "}
                  <span className="text-green-700 font-bold text-xs">beta</span>
                </h3>
              </a>
            </TooltipTrigger>
            <TooltipContent>Home Page</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="mt-5">
          <div className="flex flex-col gap-1 w-full">
            {props.sidebarItems.links.map((link, index) => (
              <Link key={index} href={link.href}>
                <SidebarButton
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  icon={link.icon}
                  className="w-full"
                >
                  {link.label}
                </SidebarButton>
              </Link>
            ))}
            {props.sidebarItems.extras}
          </div>
          <Alert className="w-full h-full mt-8 pt-8 bg-transparent text-white text-shimmer">
            <RocketIcon className="h-8 w-8 hover:animate-pulse" fill="white" />
            <AlertTitle className="font-bold ml-2">Heads up!</AlertTitle>
            <AlertDescription className="font-bold ml-2">
              More features are continuously being shipped!
            </AlertDescription>
          </Alert>
          <Alert className="w-full h-full mt-2 pt-2 bg-transparent text-white text-shimmer">
            <User className="hover:animate-pulse" fill="white" />
            <AlertTitle className="font-bold ml-2 mt-3">
              Wanna contact me?
            </AlertTitle>
            <AlertDescription className="font-bold ml-2 mt-4 underline">
              placeholder@wakil.com
            </AlertDescription>
          </Alert>
          <Alert className="w-full h-full mt-2 pt-2 bg-transparent text-white text-shimmer">
            <Lock className="hover:animate-pulse" fill="white" />
            <AlertTitle className="font-bold ml-2 mt-3">
              If the platform stops Working
            </AlertTitle>
            <AlertDescription>
            Sign out and in to refresh session
              Click on bar below to sign out
            </AlertDescription>
          </Alert>
          <div className="absolute left-0 bottom-3 w-full px-3">
            <Separator className="absolute -top-3 left-0 w-full" />
            <Popover open={popoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setPopoverOpen(!popoverOpen)} // Toggle popover visibility
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex gap-2 items-center">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={localStorage.getItem("image_uri") || ""}
                        />
                        <AvatarFallback>User</AvatarFallback>
                      </Avatar>
                      <span>{props.userData || "User"}</span>
                    </div>
                    <MoreHorizontal size={20} />
                  </div>
                </Button>
              </PopoverTrigger>
              {popoverOpen && (
                <PopoverContent className="mb-2 w-56 p-3 rounded-[1rem] bg-transparent text-white">
                  <div className="space-y-1">
                    <Link href="/dashboard/settings">
                      <SidebarButton
                        size="sm"
                        icon={Settings}
                        className="w-full"
                      >
                        Account Settings
                      </SidebarButton>
                    </Link>
                    <a onClick={handleLogout}>
                      <SidebarButton size="sm" icon={LogOut} className="w-full">
                        Log Out
                      </SidebarButton>
                    </a>
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </div>
        </div>
      </div>
    </aside>
  );
}
