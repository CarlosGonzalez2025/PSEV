"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartData = [
  { month: "Ene", executed: 65, goal: 80 },
  { month: "Feb", executed: 75, goal: 80 },
  { month: "Mar", executed: 45, goal: 80 },
  { month: "Abr", executed: 90, goal: 80 },
  { month: "May", executed: 85, goal: 80 },
  { month: "Jun", executed: 92, goal: 80 },
];

export function ComplianceChart() {
  return (
    <Card className="shadow-sm dark:bg-card">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Cumplimiento Plan de Formación</CardTitle>
                <CardDescription>Ejecución mensual vs programada</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    Ejecutado
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                    Meta
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip 
                cursor={{ fill: 'hsl(var(--secondary))' }}
                content={<ChartTooltipContent indicator="dot" />} 
              />
              <Bar dataKey="goal" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Meta"/>
              <Bar dataKey="executed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Ejecutado"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
