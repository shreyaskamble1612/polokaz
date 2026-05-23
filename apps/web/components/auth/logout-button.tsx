"use client";

import { authClient } from "@polokaz/auth/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Spinner } from "@/components/ui/spinner";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  onLogout?: () => void | Promise<void>;
};

export function LogoutButton({
  className,
  label = "Log out",
  onLogout,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      disabled={isLoading}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsLoading(true);

        try {
          await authClient.signOut();
          await onLogout?.();
        } finally {
          setIsLoading(false);
          router.replace("/");
          router.refresh();
        }
      }}
    >
      {isLoading ? <Spinner /> : <LogOut />}
      {label}
    </button>
  );
}