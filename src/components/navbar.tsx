"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
// import { Button } from "@/components/ui/button"
import { ConnectButton } from "@rainbow-me/rainbowkit";
export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-neutral-950/80">
      <div className="container px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-white">
          <Rocket className="h-6 w-6 text-white" />
          <span className="text-xl sm:text-2xl font-bold">Leap</span>
        </Link>
        <div className="flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
