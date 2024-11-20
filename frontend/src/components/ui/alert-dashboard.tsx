import React from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export const AlertNoAgents = () => {
  return (
    <Alert className="text-white text-md italic bg-transparent max-w-md max-h-md">
      <div className="flex items-center">
        <Info className="mr-2 h-4 w-4" />
        <p>
          You have no agents yet.{" "}
          <a href="/dashboard/graph">
            <Button variant="outline" className="bg-transparent border-transparent font-bold italic">
              Create an agent
            </Button>
          </a>
        </p>
      </div>
    </Alert>
  );
};

export const AlertNoSessions = () => {
  return (
    <Alert className="text-white text-md italic bg-transparent max-w-md max-h-md">
      <div className="flex items-center">
        <Info className="mr-2 h-4 w-4" />
        <p>
          You have no sessions yet.{" "}
          <a href="/dashboard/sessions">
            <Button variant="outline" className="bg-transparent border-transparent font-bold italic">
              Create a session
            </Button>
          </a>
        </p>
      </div>
    </Alert>
  );
};