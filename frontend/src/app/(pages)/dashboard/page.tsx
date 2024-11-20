"use client";

import { HomeChart } from "@/components/charts/home-chart";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { AlertNoAgents, AlertNoSessions } from "@/components/ui/alert-dashboard";

const chartConfig = {
  views: {
    label: "Page Views",
  },
  sessions: {
    label: "Sessions",
    color: "hsl(var(--chart-1))",
  },
  agents: {
    label: "Agents",
    color: "hsl(var(--chart-2))",
  },
};

export interface ChartData {
  date: string;
  sessions: number;
  agents: number;
}

const Dashboard: React.FC = () => {
  const [chartData, setChartData] = useState<Array<ChartData> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    const token = Cookies.get("token");

    const fetchData = async () => {
      setLoading(true);
      try {
        const [chartResponse] = await Promise.all([
          fetch(`${BACKEND_API_BASE_URL}/sessions/chart-data`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [chartData] = await Promise.all([
          chartResponse.json(),
        ]);

        setChartData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, []);

  useEffect(() => {
    const checkoutSuccess = localStorage.getItem("checkoutSuccess");
    if (checkoutSuccess === "true") {
      toast.toast({
        title: "Welcome aboard!",
        description: "Please use our platform with no creativity boundaries",
      });
    } else {
      toast.toast({
        title: "Welcome champ!",
      });
    }
    localStorage.removeItem("checkoutSuccess");
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full justify-center mt-20">
        <svg
          aria-hidden="true"
          className="inline h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!chartData) {
    return (
      <div className="flex items-center space-x-4 ml-7 mt-7">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  console.log("he", chartData)
  // Nb of sessions in all dates
  const chart_sessions = chartData.reduce((acc, data) => acc + data.sessions, 0);
  const chart_agents = chartData.reduce((acc, data) => acc + data.agents, 0);
  return (
    <main>
      <header className="font-bold text-2xl mt-1 ml-6 mb-1">Home</header>
      <hr />
      <div className="flex mt-6 ml-6 justify-center space-x-4">
        <HomeChart data={chartData} config={chartConfig} />
      </div>

      <div className="mt-10 ml-6 space-y-4">
        {chart_agents === 0 && <AlertNoAgents />}
        {chart_sessions === 0 && <AlertNoSessions />}
      </div>
    </main>
  );
};

export default Dashboard;

// Render sidebar on all pages except those under /dashboard/graph/
export const ClientSidebar: React.FC = () => {
  const pathname = usePathname();
  const isGraphPage = pathname.startsWith("/dashboard/graph/");

  if (isGraphPage) return null;

  return (
    <div className="w-80">
      <Sidebar />
    </div>
  );
};
