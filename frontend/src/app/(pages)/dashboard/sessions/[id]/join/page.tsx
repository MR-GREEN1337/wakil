"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SessionData } from "../page";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";

const page = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [userJoined, setUserJoined] = useState(false);
  const userEmail = localStorage.getItem("email");
  const token = Cookies.get("token");
  useEffect(() => {
    fetch(`${BACKEND_API_BASE_URL}/sessions/${params.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (data.max_session_users === data.players_joined) {
          setTimeout(() => {
            router.push(`/dashboard/`);
          }, 2000);
        }

        setSessionData(data);
        setLoading(false);

        // Check if the user has already joined the session
        const userInSession = data.users.some(
          (user: { user: string | null }) => user.user === userEmail
        );
        if (userInSession) {
          setUserJoined(true);
        }
      })
      .catch((err) => {
        console.log("Something went wrong", err);
      });
  }, []);

  useEffect(() => {
    if (userJoined) {
      const timer = setTimeout(() => {
        router.push(`/dashboard/sessions/${params.id}`);
      }, 2000);

      return () => clearTimeout(timer); // Cleanup the timer on unmount
    }
  }, [userJoined]);

  function handleJoinGame() {
    const data = {
      user: localStorage.getItem("email"),
      flag: "spectator",
    };

    fetch(`${BACKEND_API_BASE_URL}/sessions/${params.id}/join/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        const timer = setTimeout(() => {
          router.push(`/dashboard/sessions/${params.id}`);
        }, 2000);

        () => clearTimeout(timer);
        router.push(`/dashboard/sessions/${data.id}`);
      })
      .catch((err) => {
        console.log("Something went wrong", err);
      });
  }

  const adminUser = sessionData?.users.find(
    (user) => user.flag === "admin"
  )?.user;

  if (isLoading) {
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

  // Check if room is full
  const roomFull =
    sessionData && sessionData.players_joined === sessionData.max_session_users;
  if (roomFull) {
    return <div>Room is full.</div>;
  }

  return (
    <main>
      <header className="font-bold text-2xl mt-2 ml-6 mb-2">
        Join Session
      </header>
      <hr />
      <div className="mt-20 ml-20 ml-3 items-center">
        {userJoined ? (
          <div>
            <p className="text-lg font-psemibold mt-2 mb-5">
              You've already joined the session. Redirecting...
            </p>
          </div>
        ) : (
          <>
            <h6 className="mt-1 text-lg leading-9">
              <span className="text-green-300 dark:text-purple-400 font-bold">
                {adminUser}
              </span>
              <span className="ml-2">
                invited you to the session: {sessionData?.title}
              </span>
            </h6>
            <h3 className="text-xl font-bold mb-6">
              Users joined: {sessionData?.players_joined}
            </h3>
            <p className="text-md mt-2 mb-5">
              Please click &quot;Join Session&quot; to talk with AI
            </p>
            <Input
              className="w-[400px] mb-3"
              id="link_to_share"
              value={localStorage.getItem("email") || ""}
              readOnly
            />
            <Button
              onClick={handleJoinGame}
              className="bg-yellow-800 hover:bg-yellow-400"
            >
              Join Session
            </Button>
          </>
        )}
      </div>
    </main>
  );
};

export default page;
