import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AlertVariant = "destructive" | "warning" | "info";

const alerts: { title: string; subtitle1: string; subtitle2?: string; time: string; variant: AlertVariant }[] = [
    { title: "Licencia C2", subtitle1: "Conductor: Juan Pérez", subtitle2: "CC: 1.098.***.***", time: "2 Días", variant: "destructive" },
    { title: "SOAT Vencido", subtitle1: "Vehículo: KJL-987", subtitle2: "Tipo: Camión NPR", time: "Hoy", variant: "destructive" },
    { title: "Tecno mecánica", subtitle1: "Vehículo: HQW-123", subtitle2: "Tipo: Van N300", time: "5 Días", variant: "warning" },
    { title: "Capacitación Manejo Defensivo", subtitle1: "Grupo A - 12 Conductores", time: "Próxima semana", variant: "info" },
];

const badgeVariants: Record<AlertVariant, string> = {
  destructive: "text-red-600 bg-red-50 dark:bg-red-900/20",
  warning: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  info: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
};

export function AlertsWidget() {
  return (
    <Card className="flex flex-col shadow-sm dark:bg-card">
      <CardHeader className="p-5 border-b flex-row justify-between items-center bg-secondary/30">
        <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="w-5 h-5 text-orange-500" />
            Próximos Vencimientos
        </CardTitle>
        <Badge variant="outline" className="text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/0">3 Críticos</Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[280px]">
        {alerts.map((alert, index) => (
            <div key={index} className="p-3 hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeVariants[alert.variant] || ''}`}>{alert.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.subtitle1}</p>
                {alert.subtitle2 && <p className="text-xs text-muted-foreground">{alert.subtitle2}</p>}
            </div>
        ))}
      </CardContent>
      <CardFooter className="p-3 border-t">
        <Button variant="link" className="text-primary w-full text-sm">Ver todas las alertas</Button>
      </CardFooter>
    </Card>
  )
}
