import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { SessionData } from "../[id]/page";
import UserCard from "./user-card";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import Cookies from "js-cookie";

export function WaitingUsersToJoin({
  id,
  data,
}: {
  id: string;
  data: SessionData;
}) {
  // WIP: Delete working with email, but rather with encrypted user id;
  const email = localStorage.getItem("email");
  const user = data?.users.find((user) => user["user"] === email);
  const isAdmin = user?.flag === "admin";

  const frontend_base_url =
    window.location.protocol + "//" + window.location.host;
  const link_to_share = `${frontend_base_url}/dashboard/sessions/${id}/join/`;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(link_to_share)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset the icon after 2 seconds
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const users_left = data.max_session_users - data.players_joined;

  const handleStartSession = async () => {
    const datum = {
      ...data,
      session_started: true,
    };
    console.log(datum);
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${BACKEND_API_BASE_URL}/sessions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datum),
      });

      if (!response.ok) {
        throw new Error(`Error starting session: ${response.status}`);
      }

      location.reload();
    } catch (error: any) {
      console.error(error);
      alert(`Error starting session: ${error.message}`);
    }
  };

  return (
    <main>
      <header className="ml-2 font-bold text-2xl mb-2 mt-2 ml-2">
        Waiting for other players to join...
      </header>
      <hr />
      <div className="ml-20 ml-20 mb-20 min-h-full mx-4 mt-10">
        <div className="mt-20 mt-4">
          <div className="flex items-center space-x-2 mb-5">
            <Label htmlFor="link_to_share" className="sr-only">
              Link
            </Label>
            <Input
              className="w-[400px]"
              id="link_to_share"
              value={link_to_share}
              readOnly
            />
            <Button type="button" size="sm" onClick={handleCopy}>
              <span className="sr-only">Copy</span>
              {copied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mb-5">
            <h2 className="text-lg font-bold mb-5">Users joined:</h2>
            <ul className="flex flex-col justify-center">
              {data.users.map((user): any => (
                <li key={user.user} className="mb-4">
                  <UserCard user={user} />
                </li>
              ))}
            </ul>
            <h2 className="text-xl font-semibold">
              Users left to kickstart the session:{" "}
              <span className="text-green">{users_left} Users</span>
            </h2>
          </div>
        </div>
        {isAdmin && (
          <>
          <h3 className="italic font-semibold">Don't wanna wait?  Join then!</h3>
          <Button
            className="mt-7 ml-10 bg-transparent w-[100px] h-[50px]"
            onClick={handleStartSession}
            variant="outline"
          >
            <p className="text-md font-bold">kickstart</p>
          </Button>
          </>
        )}
      </div>
    </main>
  );
}
