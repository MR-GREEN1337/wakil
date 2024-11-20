import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { TrashIcon } from "@radix-ui/react-icons";
import React from "react";

export type sessionCardData = {
  session: {
    id: String
    title: String;
    users: String[];
    agent: String;
    players_joined: Number;
    finished_at: String;
    updated_at: String;
    max_session_agents: Number;
    max_session_users: Number;
    game_started: boolean;
    created_at: String
  }
  };

import Cookies from 'js-cookie';

const SessionCard = (card: sessionCardData) => {
  const handleDeleteSession = async () => {
    const token = Cookies.get("token")
    const response = await fetch(
      `${BACKEND_API_BASE_URL}/sessions/${card.session.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      }
    );
    if (response.ok) {
        const resp = await response.json()
        console.log(resp)
      toast({
        title: "Session successfully deleted",
      });
      location.reload();
    } else {
      const errorData = await response.json();
      toast({
        title: "Error deleting session",
        description: errorData.message || "Unknown error occurred",
      });
    }
  };

  return (
    <Card
      className={`flex justify-between w-full h-[120px] bg-amber-300 shadow-lg rounded-lg mb-3 md:w-[450px]`}
      style={{
        boxShadow:
          "0px 0px 5px rgba(255, 215, 0, 0.5), 0px 0px 20px rgba(255, 215, 0, 0.3)",
        backgroundSize: "200px 200px",
      }}
    >
      <CardHeader>
        <CardTitle>{card.session.title}</CardTitle>
        <CardDescription>last modified {card.session.finished_at}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <a href={`/dashboard/sessions/${card.session.id}`}>
          <Button className="bg-transparent hover:bg-yellow-400">Join</Button>
        </a>
        <Dialog>
          <DialogTrigger asChild>
            <Button className=" ml-2 bg-transparent hover:bg-red-700">
              <TrashIcon />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-dark">
                Are you absolutely sure you want to delete {card.session.title}?
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={handleDeleteSession}
                className="bg-red-500 hover:bg-red-800"
                type="submit"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default SessionCard;
