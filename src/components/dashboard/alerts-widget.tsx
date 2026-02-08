import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AlertVariant = "destructive" | "warning" | "info";

const alerts: { title: string; subtitle1: string; subtitle2: string; time: string; variant: AlertVariant }[] = [
    { title: "Licencia C2", subtitle1: "Conductor: Juan Pérez", subtitle2: "CC: 1.098.***.***", time: "2 Días", variant: "destructive" },
    { title: "SOAT Vencido", subtitle1: "Vehículo: KJL-987", subtitle2: "Tipo: Camión NPR", time: "Hoy", variant: "destructive" },
    { title: "Tecno mecánica", subtitle1: "Vehículo: HQW-123", subtitle2: "Tipo: Van N300", time: "5 Días", variant: "warning" },
    { title: "Capacitación Manejo Defensivo", subtitle1: "Grupo A - 12 Conductores", subtitle2: "Próxima semana", time: "Semana", variant: "info" },
];

const badgeVariants: Record<AlertVariant, string> = {
  destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/0",
  warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200/0",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/0",
};

export function AlertsWidget() {
  return (
    <Card className="flex flex-col shadow-sm dark:bg-card">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-orange-500" />
                Próximos Vencimientos
            </CardTitle>
            <Badge variant="destructive">3 Críticos</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2 pr-4 space-y-2 max-h-[250px]">
        {alerts.map((alert, index) => (
            <div key={index} className="p-3 hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeVariants[alert.variant] || ''}`}>{alert.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.subtitle1}</p>
                <p className="text-xs text-muted-foreground">{alert.subtitle2}</p>
            </div>
        ))}
      </CardContent>
      <CardFooter className="p-3 border-t">
        <Button variant="link" className="text-primary w-full">Ver todas las alertas</Button>
      </CardFooter>
    </Card>
  )
}
