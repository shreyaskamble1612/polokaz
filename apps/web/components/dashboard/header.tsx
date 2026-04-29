"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavUser } from "@/components/layout/home/nav-user";
import { BrandLogo } from "@/components/brand/brand-logo";

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  onMenuClick?: () => void;
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <BrandLogo href="/" size="md" />
        </div>

        <div className="flex-1" />

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <NavUser user={user} />
      </div>
    </header>
  );
}
