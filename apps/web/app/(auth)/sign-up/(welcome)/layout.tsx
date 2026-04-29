"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center w-screen h-screen relative">
      <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-lg" />
      <picture className="absolute inset-0">
        <Image
          width={1512}
          height={1762}
          alt="background"
          src="/sign-up/background.jpg"
          className="object-cover object-[50%_20%] size-full"
        />
      </picture>
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <BrandLogo href="/" size="lg" priority />
      </div>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  );
}
