import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, ChevronRight, Info, ListTodo, Printer, ArrowRight } from "lucide-react";

export default function DiagnosticoPage() {
  const steps = [
    { name: "Misionalidad", description: "Actividad principal", status: "completed" },
    { name: "Flota y Conductores", description: "Tamaño operativo", status: "completed" },
    { name: "Verificación", description: "Resumen de datos", status: "completed" },
    { name: "Resultado", description: "Diagnóstico final", status: "active" },
  ];

  const actionSteps = [
    { id: "01", description: "Líder del diseño e implementación del PESV", status: "Pendiente" },
    { id: "02", description: "Comité de seguridad vial", status: "Pendiente" },
    { id: "03", description: "Política de seguridad vial de la organización", status: "En Proceso" },
    { id: "04", description: "Liderazgo, compromiso y corresponsabilidad del nivel directivo", status: "Pendiente" },
    { id: "05", description: "Diagnóstico", status: "Completado" },
  ]

  const getStepClass = (status: string) => {
    if (status === 'completed') return "border-primary bg-primary text-white";
    if (status === 'active') return "border-primary text-primary bg-white dark:bg-card shadow-[0_0_0_4px_rgba(19,91,236,0.2)]";
    return "border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500";
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pendiente":
        return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{status}</span>;
      case "En Proceso":
        return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-500 dark:border-amber-800">{status}</span>;
      case "Completado":
        return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-500 dark:border-green-800">{status}</span>;
      default:
        return null;
    }
  };


  return (
    <div className="flex-grow flex flex-col items-center justify-start pt-8 pb-12 px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3 tracking-tight">Asistente de Diagnóstico PESV</h1>
        <p className="text-lg text-muted-foreground">Complete el formulario para determinar su nivel de cumplimiento y generar su hoja de ruta automáticamente.</p>
      </div>

      <div className="w-full max-w-5xl bg-card rounded-2xl shadow-xl border overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        <aside className="w-full md:w-64 bg-secondary/30 dark:bg-card/40 border-b md:border-b-0 md:border-r p-6 md:p-8 flex flex-col">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">Progreso</h3>
          <div className="flex md:flex-col gap-0 md:gap-8 justify-between md:justify-start relative">
             {/* Progress Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border md:hidden -translate-y-1/2 -z-10"></div>
            <div className="absolute left-[15px] top-4 w-0.5 h-[calc(100%-2rem)] bg-border -z-10 hidden md:block"></div>

            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center md:items-start gap-3 group relative bg-secondary/0 z-10">
                <div className={`flex items-center justify-center size-8 rounded-full border-2 text-sm font-bold transition-all duration-300 ${getStepClass(step.status)}`}>
                  {step.status === 'completed' ? <Check className="text-base" /> : <span>{index + 1}</span>}
                </div>
                <div className="hidden md:block">
                  <p className={`text-sm font-bold ${step.status === 'active' || step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`}>{step.name}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto hidden md:block">
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-start gap-3">
                <Info className="text-primary text-xl mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este diagnóstico se basa en los criterios de la <span className="font-bold text-foreground">Resolución 40595 de 2022</span> del Ministerio de Transporte.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col p-6 md:p-10 relative overflow-hidden">
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="size-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></span>
                  Diagnóstico Completado
                </span>
                <h2 className="text-2xl font-bold text-foreground">Resultado de Clasificación</h2>
              </div>
              <div className="hidden sm:block">
                <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                  <Printer className="text-lg mr-1" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-secondary/20 to-card dark:from-card/30 dark:to-background/10 rounded-2xl p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 size-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Nivel de Diseño e Implementación PESV</p>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-4xl md:text-5xl font-black text-primary tracking-tight">AVANZADO</h3>
                    <Check className="text-4xl text-yellow-500 fill-current" />
                  </div>
                  <p className="mt-3 text-muted-foreground max-w-lg">
                    Su organización ha sido clasificada en el nivel <strong className="text-foreground">Avanzado</strong> debido a que cuenta con una flota superior a <strong>50 vehículos</strong> y/o administra más de <strong>50 conductores</strong>.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <Card className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Pasos requeridos</span>
                      <span className="text-lg font-bold text-foreground">24 / 24</span>
                    </div>
                  </Card>
                   <Card className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Fase actual</span>
                      <span className="text-sm font-bold text-primary">Planificación</span>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <ListTodo className="text-primary" />
                Pasos Habilitados (Res. 40595/22)
              </h4>
              <Card className="flex flex-col h-full max-h-[400px]">
                <CardHeader className="flex flex-row items-center px-4 py-3 bg-secondary/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="w-16">Paso</div>
                  <div className="flex-1">Descripción del Requisito</div>
                  <div className="w-24 text-center">Estado</div>
                  <div className="w-10"></div>
                </CardHeader>
                <CardContent className="overflow-y-auto p-0">
                  {actionSteps.map((step) => (
                     <div key={step.id} className="flex items-center px-4 py-3 border-b hover:bg-secondary/30 transition-colors cursor-pointer group">
                        <div className="w-16 font-mono text-sm font-bold text-muted-foreground group-hover:text-primary">{step.id}</div>
                        <div className="flex-1 pr-4">
                          <p className="text-sm font-medium text-foreground">{step.description}</p>
                        </div>
                        <div className="w-24 flex justify-center">{getStatusBadge(step.status)}</div>
                        <div className="w-10 flex justify-end text-muted-foreground/30 group-hover:text-primary">
                          <ChevronRight className="text-lg" />
                        </div>
                      </div>
                  ))}
                  <div className="flex items-center justify-center px-4 py-3 bg-secondary/20 text-xs text-muted-foreground italic">
                    + 19 pasos adicionales habilitados
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
              <Button variant="link" className="text-sm font-semibold text-muted-foreground">
                Volver a editar respuestas
              </Button>
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/30">
                Ir al Tablero de Gestión
                <ArrowRight className="text-lg ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
