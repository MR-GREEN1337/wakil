"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BACKEND_API_BASE_URL, BACKEND_WS_BASE_URL } from "@/lib/constants";
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import React, { useEffect, useState } from "react";
import { WaitingUsersToJoin } from "../_components/waiting-room";
import SessionInfo from "../_components/session-info";
import SessionGame from "../_components/session-game";
import Cookies from "js-cookie";

export interface SessionData {
  id: string;
  title: string;
  max_session_users: number;
  session_started: boolean;
  users: SessionUser[];
  agent?: Agent;
  players_joined: number;
  email: string;
  finished_at: string | null | Date;
  created_at: string | null | Date;
}

interface SessionUser {
  flag: string; // admin or regular user
  user: string; // user ID or username
}

interface Agent {
  id: string;
  outline: string;
  state: null | any;
}

const Session = ({ params }: { params: { id: string } }) => {
  const [data, setData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  //const outline = data?.agent?.outline;
  //console.log(data)
  useEffect(() => {
    // Fetch token from local storage or wherever it is stored
    const token = Cookies.get("token");
    if (!token) {
      console.error("Token is undefined");
      return;
    }
    
    // Create WebSocket URL with Bearer token as a query parameter
    const wsUrl = `${BACKEND_WS_BASE_URL}/sessions/ws/${params.id}/Chat`; //?token=${token}
    
    const ws = new WebSocket(wsUrl);
  
    ws.addEventListener("open", () => {
      fetch(`${BACKEND_API_BASE_URL}/sessions/${params.id}/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then((response) => {
          if (!response.ok) throw new Error();
          return response.json();
        })
        .then((data) => {
          //alert(data)
          setData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log("Something went wrong", err);
        });
    });
  
    // Add event listeners for WebSocket events if needed
    ws.addEventListener("message", (event) => {
      // Handle incoming messages
    });
  
    ws.addEventListener("close", () => {
      // Handle WebSocket close
    });
  
    ws.addEventListener("error", (error) => {
      // Handle WebSocket errors
    });
  
    // Cleanup on component unmount
    return () => {
      ws.close();
    };
  }, [params.id]);

  if (isLoading)
    return (
      <div className="mt-10 ml-10 flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );

  if (!data) return <div className="text-white">Error Loading Page Data</div>;

  if (data.max_session_users !== data.players_joined && !data.session_started)
    return <WaitingUsersToJoin id={params.id} data={data} />;

  return (
      <main className="h-screen overflow-y-auto">
        <header className="text-3xl font-bold mb-2 ml-2 mt-2">Session</header>
        <hr />
        <SessionInfo data={data} />
        <hr className="mt-1 mx-auto w-1/5 border-gray-300" />
        <SessionGame data={data} ws={ws} />
      </main>
  );
};

export default Session;
