import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  progress?: number;
  progressText?: string;
  trendIcon?: LucideIcon;
  iconBgColor: string;
  iconColor: string;
};

const badgeVariants = {
  success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200/0 dark:border-green-700/0",
  warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/0 dark:border-yellow-700/0",
  secondary: "bg-muted text-muted-foreground border-border/50",
  default: "bg-primary text-primary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "text-foreground",
};

export function KpiCard({
  title,
  value,
  subValue,
  icon: Icon,
  badge,
  badgeVariant = "secondary",
  progress,
  progressText,
  trendIcon: TrendIcon,
  iconBgColor,
  iconColor,
}: KpiCardProps) {
  return (
    <Card className="flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow dark:bg-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
          {badge && (
            <Badge variant="outline" className={cn("text-xs font-medium", badgeVariant && badgeVariants[badgeVariant])}>
              {TrendIcon && <TrendIcon className="w-3 h-3 mr-1"/>}
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="mt-1">
          <span className="text-2xl lg:text-3xl font-bold text-foreground font-headline">{value}</span>
          {subValue && <span className="text-lg text-muted-foreground font-normal">{subValue}</span>}
        </div>
        {progress !== undefined && (
          <>
            <Progress value={progress} className="mt-3 h-1.5" />
          </>
        )}
        {progressText && (
           <p className="text-xs text-muted-foreground mt-2">{progressText}</p>
        )}
      </CardContent>
    </Card>
  );
}
