"use client";

import React, { useState, useEffect } from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./menubar";
import { Button } from "./button";
import {
  ChevronRight,
  LoaderCircle,
  LoaderCircleIcon,
  Menu,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Label } from "./label";
import { Input } from "./input";
import { Alert, AlertDescription, AlertTitle } from "./alert";

type Props = {
  pricingRef: React.RefObject<HTMLDivElement>;
};

const NavbarComp = ({ pricingRef }: Props) => {
  const [loginLoading, setLoginLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const scrollToPricing = () => {
    if (pricingRef.current) {
      pricingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const router = useRouter();

  const [blogLoading, setBlogLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      setAuthenticated(true);
    }
  }, []);

  return (
    <header className="fixed w-full flex items-center justify-between z-[9999] backdrop-blur-md pb-3 pt-3">
      {/* Left side: Logo */}
      <div className="flex-1 pl-4 lg:pl-10 lg:ml-10 pt-7 shadow-md hover:drop-xl">
        <a href="/">
          <h3 className="radiant-text hover:scale-140 text-white font-bold text-3xl">
            Wakil
          </h3>
        </a>
      </div>

      {/* Sheet Trigger Button (visible only on small screens) */}
      <div className="md:hidden flex items-center pr-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-transparent border-transparent focus:outline-none focus:ring-2 focus:ring-white">
              <Menu className="text-white" size={32} />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-slate-950 backdrop-blur-lg transition-transform transform flex justify-center mt-20 rounded-lg p-6 shadow-lg">
            <div className="hidden md:block pr-10 pt-10 mr-10">
              <a href={authenticated ? "/dashboard" : "/sign-in"}>
                <Button
                  variant="outline"
                  className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transform transition duration-500 hover:scale-110"
                  onClick={() => {
                    setLoginLoading(true);
                  }}
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] hover:animate-[spin_1s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    {authenticated ? (
                      <h3 className="font-bold radiant-text">Dashboard</h3>
                    ) : (
                      <h3 className="font-bold radiant-text">Login</h3>
                    )}
                    {loginLoading ? (
                      <LoaderCircle className="radiant-text animate-spin text-sm" />
                    ) : (
                      <ChevronRight />
                    )}
                  </span>
                </Button>
              </a>
            </div>
            <div className="flex flex-col items-center space-y-6">
            <a href={authenticated ? "/dashboard" : "/sign-in"}>
                <Button
                  variant="outline"
                  className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transform transition duration-500 hover:scale-110"
                  onClick={() => {
                    setLoginLoading(true);
                  }}
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] hover:animate-[spin_1s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    {authenticated ? (
                      <h3 className="font-bold radiant-text">Dashboard</h3>
                    ) : (
                      <h3 className="font-bold radiant-text">Login</h3>
                    )}
                    {loginLoading ? (
                      <LoaderCircle className="radiant-text animate-spin text-sm" />
                    ) : (
                      <ChevronRight />
                    )}
                  </span>
                </Button>
              </a>
              <Button
                variant={"outline"}
                onClick={scrollToPricing}
                className="border-transparent radiant-text text-3xl font-bold transition-transform transform duration-500 ease-in-out hover:scale-110 focus:scale-105 bg-transparent focus:outline-none focus:ring-2 focus:ring-white"
              >
                Pricing
              </Button>
              <Button
                variant={"outline"}
                className="border-transparent radiant-text text-3xl font-bold transition-transform transform duration-500 ease-in-out hover:scale-110 focus:scale-105 bg-transparent focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => {
                  router.push("/blog");
                  setBlogLoading(true);
                }}
              >
                {blogLoading ? (
                  <LoaderCircleIcon className="animate-spin text-sm" />
                ) : (
                  <>Blog</>
                )}
              </Button>
              <Alert className="mt-5 w-full h-[100px] mt-2 pt-2 bg-transparent text-white text-shimmer">
                <User className="hover:animate-pulse" fill="white" />
                <AlertTitle className="font-bold ml-2 mt-3">
                  Wanna contact me?
                </AlertTitle>
                <AlertDescription className="font-bold ml-2 mt-4 underline">
                  placeholder@wakil.com
                </AlertDescription>
              </Alert>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Center: Menubar (visible on medium and larger screens) */}
      <div className="hidden md:flex justify-center w-full pt-10">
        <Menubar className="bg-transparent font-bold flex justify-center flex-wrap md:flex-nowrap mx-auto h-10 border-transparent">
          <div className="hover:rounded-md">
            <MenubarMenu>
              <MenubarTrigger className="shimmer-effect transition-transform transform duration-500 ease-in-out hover:scale-110 text-xl font-bold radiant-text">
                Home
              </MenubarTrigger>
              <MenubarContent className="absolute bg-transparent text-white rounded-md shadow-md z-40">
                <MenubarItem>Features</MenubarItem>
                <MenubarItem>About Us</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </div>
          <div className="hover:rounded-md">
            <MenubarMenu>
              <MenubarTrigger
                onClick={() => {
                  router.push("/blog");
                  setBlogLoading(true);
                }}
                className="radiant-text transition-transform transform duration-500 ease-in-out hover:scale-110 text-xl font-bold"
              >
                {blogLoading ? (
                  <LoaderCircleIcon className="animate-spin text-sm" />
                ) : (
                  <>Blog</>
                )}
              </MenubarTrigger>
            </MenubarMenu>
          </div>
          <div className="hover:rounded-md">
            <MenubarMenu>
              <MenubarTrigger
                onClick={scrollToPricing}
                className="radiant-text transition-transform transform duration-500 ease-in-out hover:scale-110 text-xl font-bold"
              >
                Pricing
              </MenubarTrigger>
            </MenubarMenu>
          </div>
          <div className="hover:rounded-md">
            <MenubarMenu>
              <MenubarTrigger className="radiant-text transition-transform transform duration-500 ease-in-out hover:scale-110 text-xl font-bold">
                Contact
              </MenubarTrigger>
            </MenubarMenu>
          </div>
        </Menubar>
      </div>

      {/* Right side: Login Button */}
      <div className="hidden md:block pr-10 pt-10 mr-10">
        <a href={authenticated ? "/dashboard" : "/sign-in"}>
          <Button
            variant="outline"
            className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transform transition duration-500 hover:scale-110"
            onClick={() => {
              setLoginLoading(true);
            }}
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] hover:animate-[spin_1s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
              {authenticated ? (
                <h3 className="font-bold radiant-text">Dashboard</h3>
              ) : (
                <h3 className="font-bold radiant-text">Login</h3>
              )}
              {loginLoading ? (
                <LoaderCircle className="radiant-text animate-spin text-sm" />
              ) : (
                <ChevronRight />
              )}
            </span>
          </Button>
        </a>
      </div>
    </header>
  );
};

export default NavbarComp;
