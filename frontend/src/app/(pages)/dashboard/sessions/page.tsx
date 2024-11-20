"use client";

import React, { useEffect, useState } from "react";
import GraphCard, { sessionCardData } from "./_components/card";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon, PlusIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionModal } from "@/app/(pages)/dashboard/sessions/_components/session-create";
import SessionCard from "./_components/card";
import Cookies from "js-cookie";
import { MoveDown, MoveUp } from "lucide-react";

const SessionsPage = () => {
  const [open, setOpen] = React.useState(false);
  const [SessionsData, setSessionsData] = useState([] as sessionCardData[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGraphsData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("token");
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/sessions/list_sessions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setSessionsData(data);
        console.log(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGraphsData();
  }, []);

  if (loading) {
    return (
      <div className="mt-9 ml-9 flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main>
      <header className="font-bold text-2xl mt-1 ml-1 mb-1">Sessions</header>
      <hr />
      <p className="font-bold text-sm mt-2 ml-3 mb-1 flex items-center">
        Latest{" "}
        <span className="mx-1">
          <MoveUp />
        </span>
        Oldest{" "}
        <span className="mx-1">
          <MoveDown />
        </span>
      </p>
      <div className="mt-10 ml-3">
        {SessionsData.length > 0 ? (
          SessionsData.slice()
            .reverse()
            .map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
        ) : (
          <div className="font-bold text-gray-500">
            No Session yet. Create one, what are you waiting for!
          </div>
        )}
      </div>
      <SessionModal>
        <Button
          variant="outline"
          className="h-20 w-20 bg-transparent ml-5 mt-5"
        >
          <PlusIcon className="h-20 w-20" />
        </Button>
      </SessionModal>
    </main>
  );
};

export default SessionsPage;
