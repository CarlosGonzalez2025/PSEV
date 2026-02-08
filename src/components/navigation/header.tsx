import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-5 bg-card/80 dark:bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-headline">Dashboard Principal</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de indicadores y cumplimiento Res. 40595</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button variant="ghost" size="icon" aria-label="Notificaciones">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </Button>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>
    </header>
  );
}
