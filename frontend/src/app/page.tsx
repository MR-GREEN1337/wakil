"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/Spotlight";
import { InfiniteMovingCardsComp } from "@/components/ui/infinite-moving-cards";
import { LampContainer, LampDemo } from "@/components/ui/lamp";
import NavbarComp from "@/components/ui/navbar-menu";
import Pricing from "@/components/ui/pricing-cards";
import { Sparkles } from "@/components/ui/sparkles";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Compare } from "@/components/ui/compare";
import { Button } from "@/components/ui/button";

export default function Home() {
  const pricingRef = useRef(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <NavbarComp pricingRef={pricingRef} />
      <div className="flex flex-col overflow-hidden">
        <div className="justify-center mt-20 pt-20">
          <Spotlight
            className="-top-0"
            fill="white"
          />
          <h1 className="relative text-2xl md:text-4xl font-semibold text-white dark:text-white text-center radiant-text">
            Unleash the power of <br />
            <span className="relative text-3xl md:text-6xl font-bold mt-1 leading-none">
              AI Agents
            </span>
          </h1>
          <h2 className="text-base md:text-xl font-psemibold text-slate-300 dark:text-white mt-4 text-center radiant-text">
            <span className="block">
              A platform for collaborative multi-user sessions with an AI Agent
            </span>
            <span className="block">
              Construct your own agent and run it, then summon it and talk to it
              at will
            </span>
          </h2>
          
          {/* Futuristic Start Button */}
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <a href="/sign-in">
            <Button
              className="relative overflow-hidden bg-transparent border border-indigo-500 text-white px-8 py-3 rounded-full group hover:bg-indigo-600 transition-all duration-300"
            >
              <span className="relative z-10 font-semibold text-lg">Start Your Journey</span>
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Sparkles/>
              </span>
            </Button>
            </a>
          </motion.div>
        </div>
        <hr className="mt-20 text-slate-700" />
      </div>
      <div className="relative">
        <InfiniteMovingCardsComp />
        <ContainerScroll titleComponent={undefined}>
          <video
            autoPlay
            loop
            muted
            className="w-full h-full"
            style={{
              objectFit: "cover",
            }}
            src="/video.mp4"
          ></video>
        </ContainerScroll>
      </div>
      <div className="border rounded-3xl dark:bg-neutral-900 bg-transparent border-transparent">
        <h3 className="italic text-3xl font-semibold text-center mt-2">
          We've built an intelligent OS that'll
        </h3>
        <h3 className="italic text-3xl font-semibold text-center mt-2 mb-5">
          Push your business to new frontiers
        </h3>
        <Compare
          firstImage="before.jpg"
          secondImage="after.png"
          className="w-full h-full md:w-[200px] md:h-[250px] lg:w-[500px] lg:h-[500px]"
          slideMode="hover"
        />
      </div>
      <LampDemo />
      <div ref={pricingRef}>
        <h3 className="mt-3 text-white radiant-text italic font-bold justify-center font-bold text-4xl text-center">Pricing</h3>
        <Pricing />
      </div>
      <footer className="text-gray-500 text-sm mt-4 text-center">
        <Sparkles />
        <div className="flex justify-center space-x-2 mt-2">
          <HoverCard>
            <HoverCardTrigger asChild>
              <h3 className="hover:text-gray-700">
                Learn about our Privacy Policy
              </h3>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 bg-transparent text-white">
              <div className="flex justify-between space-x-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Privacy Policy</h4>
                  <p className="text-sm">
                    Learn how we collect, use, and protect your personal
                    information.
                  </p>
                  <div className="flex items-center pt-2">
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-white"
                    >
                      Read our Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        &copy; 2024 Wakil. Built by a 20-year-old boy in his dorm
      </footer>
    </main>
  );
}