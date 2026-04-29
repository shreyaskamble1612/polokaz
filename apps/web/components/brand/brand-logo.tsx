import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<BrandLogoSize, string> = {
  sm: "h-8 w-auto",
  md: "h-10 w-auto",
  lg: "h-12 w-auto",
  xl: "h-16 w-auto",
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  imageClassName?: string;
  href?: string;
  priority?: boolean;
}

export function BrandLogo({
  size = "md",
  className,
  imageClassName,
  href,
  priority = false,
}: BrandLogoProps) {
  const logo = (
    <Image
      src="/brand/polokaz-logo.svg"
      alt="Polokaz"
      width={620}
      height={128}
      priority={priority}
      className={cn(sizeClasses[size], imageClassName)}
    />
  );

  if (!href) {
    return <div className={className}>{logo}</div>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {logo}
    </Link>
  );
}
