"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@polokaz/auth/client";
import { Link2, LogOut, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 rounded-full">
          <AvatarImage src={user.avatar ?? ""} alt={user.name} />
          <AvatarFallback className="rounded-full cursor-default hover:bg-foreground/10 duration-75 transition-colors">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-9 rounded-full">
              <AvatarImage src={user.avatar ?? ""} alt={user.name} />
              <AvatarFallback className="rounded-full">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium tracking-tighter">
                {user.name}
              </span>
              <span className="text-muted-foreground truncate text-xs tracking-tighter">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/plans">
              <Sparkles />
              Upgrade account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/referral">
              <Link2 />
              Referral links
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLoading(true);
            await authClient.signOut();
            setIsLoading(false);

            router.push("/sign-in");
          }}
        >
          {isLoading ? <Spinner /> : <LogOut />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { NavUser };
