import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col md:flex-row", className)}>
      {children}
    </div>
  );
}

interface DashboardContentProps {
  children: ReactNode;
  className?: string;
}

export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <main className={cn("flex-1 md:ml-64", className)}>
      <div className="container mx-auto p-6 md:p-8">
        {children}
      </div>
    </main>
  );
}

