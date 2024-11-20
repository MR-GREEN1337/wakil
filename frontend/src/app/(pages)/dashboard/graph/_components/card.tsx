"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { TrashIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie"
import { LoaderCircleIcon } from "lucide-react";

type Props = {
  graph: {
    id: number;
    title: string;
    description: string;
    updated_at: string;
  };
};

const GraphCard = ({ graph }: Props) => {
  const router = useRouter();
  const [formattedDate, setFormattedDate] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Format the date using Intl.DateTimeFormat
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    setFormattedDate(formattedDate);
  };

  // Call the formatDate function when the component mounts
  useEffect(() => {
    formatDate(graph.updated_at);
  }, [graph.updated_at]);

  const handleDeleteGraph = async () => {
    setDeleteLoading(true);
    const token = Cookies.get("token")
    const response = await fetch(
      `${BACKEND_API_BASE_URL}/sessions/graph/${graph.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      }
    );
    if (response.ok) {
      const resp = await response.json();
      console.log(resp);
      toast({
        title: "Graph successfully deleted",
      });
      setDeleteLoading(false);
      location.reload();
    } else {
      setDeleteLoading(false);
      const errorData = await response.json();
      toast({
        title: "Error deleting session",
        description: errorData.message || "Unknown error occurred",
      });
    }
  };

  return (
    <Card
      className={`flex w-full h-[130px] bg-transparent text-white mb-2 md:w-[460px]`}
    >
      <CardHeader>
        <CardTitle className="font-bold text-white">{graph.title}</CardTitle>
        <CardDescription>{graph.description}</CardDescription>
        <CardDescription>last modified {formattedDate}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <a href={`/dashboard/graph/${graph.id}`}>
          <Button className="bg-green-900 hover:bg-yellow-400 hover:text-black">Modify</Button>
        </a>
        <Dialog>
          <DialogTrigger>
            <Button className="ml-2 bg-green-900 hover:bg-red-700">
              <TrashIcon />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-dark">
                Are you absolutely sure you want to delete {graph.title}?
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={handleDeleteGraph}
                className="bg-red-500 hover:bg-red-800"
                type="submit"
              >
                {deleteLoading ? (
                  <LoaderCircleIcon className="animate-spin"/>
                ) : (
                  <>
                Delete
                </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default GraphCard