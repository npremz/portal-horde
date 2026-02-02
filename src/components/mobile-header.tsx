"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileHeader() {
  const { toggleSidebar, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/images/logo.svg"
            alt="Horde"
            width={80}
            height={26}
            priority
            className="dark:hidden"
          />
          <Image
            src="/images/logo-dark.svg"
            alt="Horde"
            width={80}
            height={26}
            priority
            className="hidden dark:block"
          />
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
