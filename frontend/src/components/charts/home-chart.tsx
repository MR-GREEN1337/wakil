"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import React from "react";

type HomeChartProps = {
  data: Array<{ date: string; sessions: number; agents: number }>;
  config: ChartConfig;
};

export function HomeChart({ data, config }: HomeChartProps) {
  const [activeChart, setActiveChart] = React.useState<keyof typeof config>("sessions");

  const total = React.useMemo(
    () => ({
      sessions: data.reduce((acc, curr) => acc + curr.sessions, 0),
      agents: data.reduce((acc, curr) => acc + curr.agents, 0),
    }),
    [data]
  );

  return (
    <Card className="bg-transparent max-w-md">
      <CardHeader className="flex border-b p-0 sm:flex-row ">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardDescription className="font-semibold text-md text-white italic">
            Showing Activity stats
          </CardDescription>
        </div>
        <div className="flex">
          {["sessions", "agents"].map((key) => {
            const chartKey = key as keyof typeof config;
            return (
              <button
                key={chartKey}
                data-active={activeChart === chartKey}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chartKey)}
              >
                <span className="text-xs text-white">
                  {config[chartKey].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl text-white">
                  {total[chartKey as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[250px] w-[400px]"
        >
          <BarChart
            data={data}
            margin={{ left: 12, right: 12 }}
            className="hover:bg-transparent bg-transparent"
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] bg-slate-950 text-white "
                  nameKey={activeChart}
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} className="hover:bg-transparent bg-transparent"/>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
