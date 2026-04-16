import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.value > 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

