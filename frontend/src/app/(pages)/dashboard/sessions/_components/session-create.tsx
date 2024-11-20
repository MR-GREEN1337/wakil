"use client";

import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarButton } from "../../../../../components/sidebar/sidebar-button";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "../../../../../components/ui/form";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { useState } from "react";
import Cookies from "js-cookie"
import { useRouter } from "next/navigation";
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

const FormSchema = z.object({
  title: z.string().min(1, "Session title is required"),
  max_session_users: z
    .string()
    .transform((v) => Number(v) || 0)
    .refine((v) => v >= 1, { message: "Min value is 1" })
    .refine((v) => v <= 10, { message: "Max value is 10" }),
  agent: z.string().min(1, "Agent is required"),
  outline: z.string().min(1, "Session Outline is required"),
});

function SessionCreate() {
  return (
    <SessionModal>
      <SidebarButton
        className="w-full justify-center transition ease-in-out delay-150 hover:scale-107 hover:-translate-y-1 duration-300 text-slate-950 bg-yellow-400 hover:bg-yellow-600 font-bold"
        variant="outline"
      >
        Create Session
      </SidebarButton>
    </SessionModal>
  );
}

function DialogCloseButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        //push to session
        router.push(link);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-white">Share link</DialogTitle>
        <DialogDescription>
          Anyone who has this link will be able to join.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center space-x-2">
        <div className="grid flex-1 gap-2">
          <Label htmlFor="link" className="sr-only">
            Link
          </Label>
          <Input id="link" value={link} readOnly />
        </div>
        <Button type="button" size="sm" onClick={handleCopy} variant={"outline"} className="bg-transparent">
          <span className="sr-only">Copy</span>
          {copied ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
      <DialogFooter className="sm:justify-start">
        <DialogClose asChild>
          <Button
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={()=>{router.push(link);}}
          >
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
}

export function SessionModal({ children }: any) {
  const [open, setOpen] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [step, setStep] = React.useState("create");

  const handleSessionCreate = async (data: any) => {
    //alert("ji")
    const sessionData = {
      ...data,
      user: { user: localStorage.getItem("email"), flag: "admin" },
    };
    console.log(sessionData);
    const token = Cookies.get("token")
    const response = await fetch(`${BACKEND_API_BASE_URL}/sessions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(sessionData),
    });

    if (response.ok) {
      toast({
        title: "Session successfully created",
      });
      const result = await response.json();
      const frontend_base_url =
        window.location.protocol + "//" + window.location.host;
      const link_to_share = `${frontend_base_url}/dashboard/sessions/${result.id}/join/`;
      setLink(link_to_share);
      setStep("share");
      localStorage.setItem("start", "false");
      
    } else {
      const errorData = await response.json();
      toast({
        title: "Error creating session",
        description: errorData.message || "Unknown error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900">
        {step === "create" && (
          <div>
            <DialogHeader>
              <DialogTitle>Create Session</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new session.
              </DialogDescription>
            </DialogHeader>
            <SessionForm onSubmit={handleSessionCreate} />
          </div>
        )}
        {step === "share" && <DialogCloseButton link={link} />}
      </DialogContent>
    </Dialog>
  );
}

function SessionForm({ onSubmit }: any) {
  const [graphs, setGraphNames] = React.useState([] as string[]);
  const [outlines, setOutlines] = React.useState([] as string[]);

  React.useEffect(() => {
    async function fetchGraphNames() {
      const token = Cookies.get("token");
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/graphNames`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const graphs = await response.json();
        setGraphNames(graphs);
      } else {
        const errorData = await response.json();
      }
    }
    fetchGraphNames();
  }, []);

  const handleAgentChange = async (agentName: string) => {
    const token = Cookies.get("token")
    const response = await fetch(
      `${BACKEND_API_BASE_URL}/sessions/graph/`, {
        method: 'POST',
        headers:{
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({agent:agentName})
      }
    );
    if (response.ok) {
      const agentData = await response.json();
      setOutlines(agentData.outlines);
    } else {
      const errorData = await response.json();
    }
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "boring meeting with our friend agent",
      max_session_users: 1,
      agent: "",
      outline: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid items-start gap-4"
      >
        <div className="grid gap-2 mt-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white" htmlFor="title">
                  Session Title
                </FormLabel>
                <Input type="text" id="title" {...field} />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="max_session_users"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white" htmlFor="maxSessionUsers">
                  Max Session Users
                </FormLabel>
                <Input
                  type="number"
                  id="maxSessionUsers"
                  min="1"
                  max="10"
                  {...field}
                />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="agent"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Agent</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    onValueChange={(value) => {
                      handleAgentChange(value);
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        className="text-slate"
                        placeholder="select an agent."
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {graphs.map((agent, index) => (
                        <SelectItem key={index} value={agent}>
                          {agent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <FormField
              control={form.control}
              name="outline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Session Outline</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue
                          className="text-slate"
                          placeholder="select session outline"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {outlines.map((outline, index) => (
                          <SelectItem key={index} value={outline}>
                            {outline}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="text-md">
                    set session content.
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button variant="outline" type="submit" className="bg-transparent">
          Create Session
        </Button>
      </form>
    </Form>
  );
}

export default SessionCreate;