"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReactNode } from "react";

/**
 * Goes to the next href keeping all search params (referralId, tdclid, etc.)
 */
export default function ReferralIdLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();

  
  const params = new URLSearchParams(searchParams.toString());

  return <Link href={`${href}?${params.toString()}`}>{children}</Link>;
}
