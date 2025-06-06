"use client";

import Link from "next/link";
import Image from "next/image";
import { Rocket } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-black/80 dark:border-neutral-800">
      <div className="container px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link
          href="https://liquidleap.ai"
          target="_blank"
          className="flex items-center space-x-2"
        >
          <Image
            src="/logo-dark.svg"
            alt="Leap Logo"
            width={32}
            height={32}
            className="h-8 w-8 block dark:hidden"
          />
          <Image
            src="/logo-light.svg"
            alt="Leap Logo"
            width={32}
            height={32}
            className="h-8 w-8 hidden dark:block"
          />
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            LiquidLeap
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
