"use client";

import React, { useEffect, useState } from "react";
import GraphCard from "./_components/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Cookies from "js-cookie";
import { LoaderPinwheel, MoveDown, MoveUp } from "lucide-react";

type GraphData = {
  id: number;
  title: string;
  description: string;
  updated_at: string;
};

const formSchema = z.object({
  name: z.string().min(1, {
    message: "name should be at least one character.",
  }),
  description: z.string().min(1, {
    message: "description should be at least one character.",
  }),
  outline: z.array(z.string()).min(1, {
    message: "select at least one.",
  }),
});

const GraphsPage = () => {
  const [open, setOpen] = useState(false);
  const [graphsData, setGraphsData] = useState<GraphData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null); // Initialize error as Error | null

  useEffect(() => {
    const token = Cookies.get("token");
    const fetchGraphsData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/sessions/get_graphs`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch graphs data");
        }
        const data = await response.json();
        setGraphsData(data);
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error))); // Set error state to the caught error object
      } finally {
        setLoading(false);
      }
    };
    fetchGraphsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-4 ml-7 mt-7 text-white">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>; // Display error message
  }

  return (
    <main>
      <header className="font-bold text-2xl mt-2 ml-3 mb-1">Agents</header>
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
        {graphsData.length > 0 ? (
          graphsData
            .slice()
            .reverse()
            .map((graph) => <GraphCard key={graph.id} graph={graph} />)
        ) : (
          <div className="font-bold text-gray-500">
            No Graph yet. Create one, what are you waiting for!
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="h-20 w-20 bg-transparent ml-5 mt-5"
          >
            <PlusIcon className="h-20 w-20" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-slate-900">
          <GraphForm />
        </DialogContent>
      </Dialog>
    </main>
  );
};

const GraphForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [butttonLoading, setButtonLoading] = useState(false);
  const [jobOutlines, setJobOutlines] = useState<string[]>([]);
  const [selectedOutlines, setSelectedOutlines] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null); // Initialize error as Error | null
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Email Summarizer",
      description: "Do my boring stuff",
      outline: [],
    },
  });

  const handleNextClick = async () => {
    const { name, description } = form.getValues();
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/graph/outlines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: name, description: description }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch job outlines");
      }
      const outlines = await response.json();
      setJobOutlines(outlines);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error))); // Set error state to the caught error object
    } finally {
      setLoading(false);
    }
  };

  const handleOutlineClick = (outline: string) => {
    const isSelected = selectedOutlines.includes(outline);
    if (isSelected) {
      setSelectedOutlines(selectedOutlines.filter((o) => o !== outline));
    } else {
      setSelectedOutlines([...selectedOutlines, outline]);
    }
  };

  const handleSubmit = async () => {
    setButtonLoading(true);
    const { name, description } = form.getValues();
    const body = {
      title: name,
      description,
      outlines: selectedOutlines,
    };
    console.log(body);
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/create_graph`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (response.ok) {
        const graph = await response.json();
        toast({
          title: "Agent successfully created",
        });
        router.push(`/dashboard/graph/${graph.id}`);
      } else {
        const errorData = await response.json();
        setError(new Error(errorData.message || "Unknown error occurred"));
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error))); // Set error state to the caught error object
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid items-start gap-4"
      >
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Create Graph Agent</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click next when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="title" className="text-white">
                      Agent Title
                    </FormLabel>
                    <Input type="text" id="title" {...field} />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="description" className="text-white">
                      Agent Description
                    </FormLabel>
                    <Input type="text" id="description" {...field} />
                  </FormItem>
                )}
              />
            </div>
            <Button
              variant="outline"
              className="mr-10 w-20 h-10 bg-transparent ml-5 mt-5"
              onClick={() => {
                setStep(2);
                handleNextClick();
              }}
            >
              Next
            </Button>
          </>
        )}
        {step === 2 &&
          (loading ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Set Agent Jobs</DialogTitle>
                <DialogDescription>
                  Select possible jobs for the agent when summoning it.
                </DialogDescription>
              </DialogHeader>
              {jobOutlines.length > 0 ? (
                <div className="grid gap-2">
                  {jobOutlines.map((outline) => (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4" // Add this class to make the checkbox bigger
                        checked={selectedOutlines.includes(outline)}
                        onChange={() => handleOutlineClick(outline)}
                      />
                      <label className="ml-2 text-white font-psemibold text-lg">
                        {outline}
                      </label>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="mr-10 w-20 h-10 bg-transparent ml-5 mt-5"
                    onClick={handleSubmit}
                  >
                    {butttonLoading ? (
                      <LoaderPinwheel className="animate-spin" />
                    ) : (
                      <>Create</>
                    )}
                  </Button>
                </div>
              ) : (
                <DialogDescription>
                  Something isn't working. Try again later.
                </DialogDescription>
              )}
            </>
          ))}
      </form>
    </Form>
  );
};

export default GraphsPage;
