import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Truck, Car, Bike } from "lucide-react";

const maintenanceData = [
    { type: "Camiones Pesados", progress: 92, icon: Truck, color: "bg-green-500" },
    { type: "Vans de Reparto", progress: 78, icon: Car, color: "bg-yellow-500" },
    { type: "Motocicletas", progress: 65, icon: Bike, color: "bg-red-500" },
]

export function MaintenanceProgress() {
    return (
        <Card className="shadow-sm dark:bg-card">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Mantenimiento Preventivo</CardTitle>
                        <CardDescription>Ejecución por tipo de vehículo</CardDescription>
                    </div>
                    <Button variant="link" className="text-primary">Ver detalle</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    {maintenanceData.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="p-2 bg-secondary rounded-lg">
                                <item.icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-foreground">{item.type}</span>
                                    <span className="text-sm font-bold text-foreground">{item.progress}%</span>
                                </div>
                                <Progress value={item.progress} indicatorClassName={item.color} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
