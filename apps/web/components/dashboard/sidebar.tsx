"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { IconProps } from "@radix-ui/react-icons/dist/types";

export interface SidebarItem {
  title: string;
  href: string;
  icon:
    | LucideIcon
    | React.ForwardRefExoticComponent<
        IconProps & React.RefAttributes<SVGSVGElement>
      >;
  badge?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  title?: string;
}

export function DashboardSidebar({ items, title }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-background">
      <div className="flex flex-col flex-1 min-h-0 pt-5 pb-4 overflow-y-auto">
        {title && (
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          </div>
        )}
        <nav className="flex-1 px-3 space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {item.title}
                {item.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
