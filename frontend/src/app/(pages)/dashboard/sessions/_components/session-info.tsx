import React, { useState, useEffect, useMemo } from "react";
import { SessionData } from "../[id]/page";
import { AnimatedTooltip, User } from "@/components/ui/animated-tooltip";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import Cookies from "js-cookie";

interface SessionInfoProps {
  data: SessionData;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ data }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const token = Cookies.get("token");

  const fetchUserDetails = async (userId: string) => {
    const response = await fetch(
      `${BACKEND_API_BASE_URL}/sessions/user-details/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );
    const datum = await response.json();

    //console.log(datum);

    const matchingUser = data.users.find(
      (user: any) => user.username === datum.user
    );
    console.log("user",matchingUser)
    const result: User = {
      id: datum.id,
      name: datum.name,
      image: datum.image,
      designation: matchingUser ? matchingUser.flag : "spectator",
    };
    return result;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const responses = await Promise.all(
          data.users.map((user) => fetchUserDetails(user.user))
        );
        console.log(responses);
        setUsers(responses);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [data]);

  const date = data.created_at ? new Date(data.created_at) : new Date();
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

  return (
    <div className="mt-5">
      {loading ? (
      <div className="mt-9 ml-9 flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
      ) : (
        <AnimatedTooltip data={users} />
      )}
      <div className=" w-full text-center">
        <p className="text-xl font-bold block">Session {data.title}</p>
        <p className="block font-bold">Started at {formattedDate}</p>
      </div>
    </div>
  );
};

export default SessionInfo;
