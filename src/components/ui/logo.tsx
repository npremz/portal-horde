"use client";

import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 100, height = 32, className }: LogoProps) {
  return (
    <>
      {/* Light mode logo (dark text) */}
      <Image
        src="/images/logo.svg"
        alt="Horde"
        width={width}
        height={height}
        priority
        className={`dark:hidden ${className ?? ""}`}
      />
      {/* Dark mode logo (light text) */}
      <Image
        src="/images/logo-dark.svg"
        alt="Horde"
        width={width}
        height={height}
        priority
        className={`hidden dark:block ${className ?? ""}`}
      />
    </>
  );
}
