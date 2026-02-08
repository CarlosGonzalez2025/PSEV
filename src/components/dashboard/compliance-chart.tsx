"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { month: "Ene", executed: 65, goal: 80 },
  { month: "Feb", executed: 75, goal: 80 },
  { month: "Mar", executed: 45, goal: 80 },
  { month: "Abr", executed: 90, goal: 80 },
  { month: "May", executed: 85, goal: 80 },
  { month: "Jun", executed: 92, goal: 80 },
];

const chartConfig = {
  executed: {
    label: "Ejecutado",
    color: "hsl(var(--primary))",
  },
  goal: {
    label: "Meta",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

export function ComplianceChart() {
  return (
    <Card className="shadow-sm dark:bg-card">
      <CardHeader>
        <CardTitle>Cumplimiento Plan de Formación</CardTitle>
        <CardDescription>Ejecución mensual vs programada</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--secondary))" }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="goal"
              fill="var(--color-goal)"
              radius={[4, 4, 0, 0]}
              name="Meta"
            />
            <Bar
              dataKey="executed"
              fill="var(--color-executed)"
              radius={[4, 4, 0, 0]}
              name="Ejecutado"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
