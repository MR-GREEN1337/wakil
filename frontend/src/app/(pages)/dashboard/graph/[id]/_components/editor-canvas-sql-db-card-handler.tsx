import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useEditor } from "@/providers/agent-provider";
import { useNodeId } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {};

const SQLDatabaseCardHandler = (props: Props) => {
  // Define the form schema using Zod
  const formSchema = z.object({
    dbType: z.string().min(1, "Database type is required"),
    host: z.string().min(1, "Host is required"),
    user: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    dbName: z.string().min(1, "Database name is required"),
    port: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d+$/.test(val),
        "Port must be a valid number"
      ),
  });

  const { dispatch, state } = useEditor();
  const nodeId = useNodeId();
  const metadata = state.editor.elements.find((node) => node.id === nodeId)
    ?.data.metadata;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dbType: metadata?.dbType || "",
      host: metadata?.host || "",
      user: metadata?.user || "",
      password: metadata?.password || "",
      dbName: metadata?.dbName || "",
      port: metadata?.port || "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedNodes = state.editor.elements.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            metadata: values,
          },
        };
      }
      return node;
    });

    dispatch({
      type: "LOAD_DATA",
      payload: {
        ...state.editor,
        elements: updatedNodes,
      },
    });

    console.log("Dispatch called with payload:", {
      type: "LOAD_DATA",
      payload: {
        ...state.editor,
        elements: updatedNodes,
      },
    });
    console.log("State after dispatch:", state.editor);
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>SQL Database Configuration</AccordionTrigger>
        <AccordionContent>
          <ScrollArea
            style={{
              maxHeight: "400px", // Set this to your desired max height
              overflowY: "auto",  // Enable vertical scrolling
              overflowX: "hidden" // Prevent horizontal overflow
            }}
            className="thin-scrollbar" // Add a class for the custom scrollbar
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <>
                  {/* Database Type Field */}
                  <FormField
                    control={form.control}
                    name="dbType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Database Type
                        </FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full bg-transparent text-white">
                            <SelectValue placeholder="Select a database type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 text-white">
                            <SelectGroup>
                              <SelectLabel>Database Types</SelectLabel>
                              <SelectItem value="mysql">MySQL</SelectItem>
                              <SelectItem value="postgres">PostgreSQL</SelectItem>
                              <SelectItem value="sqlite">SQLite</SelectItem>
                              <SelectItem value="mssql">MSSQL</SelectItem>
                              <SelectItem value="oracle">Oracle</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of database (e.g., MySQL, PostgreSQL).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Host Field */}
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field, formState }) => (
                      <FormItem>
                        <FormLabel className="text-white">Host</FormLabel>
                        <FormControl className="bg-transparent">
                          <Input
                            placeholder="localhost or remote host"
                            {...field}
                            className="text-white"
                          />
                        </FormControl>
                        {formState.errors.host && (
                          <FormMessage>
                            {formState.errors.host.message}
                          </FormMessage>
                        )}
                        <FormDescription>
                          Hostname or IP address of the cloud database.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Username Field */}
                  <FormField
                    control={form.control}
                    name="user"
                    render={({ field, formState }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl className="bg-transparent">
                          <Input
                            placeholder="username"
                            {...field}
                            className="text-white"
                          />
                        </FormControl>
                        {formState.errors.user && (
                          <FormMessage>
                            {formState.errors.user.message}
                          </FormMessage>
                        )}
                        <FormDescription>
                          Username for the database.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Password Field with Visibility Toggle */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, formState }) => (
                      <FormItem className="relative">
                        <FormLabel className="text-white">Password</FormLabel>
                        <FormControl className="bg-transparent">
                          <>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="password"
                              {...field}
                              className="text-white bg-transparent pr-10"
                            />
                            <span
                              className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </span>
                          </>
                        </FormControl>
                        {formState.errors.password && (
                          <FormMessage>
                            {formState.errors.password.message}
                          </FormMessage>
                        )}
                        <FormDescription>
                          Password for the database user.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Database Name Field */}
                  <FormField
                    control={form.control}
                    name="dbName"
                    render={({ field, formState }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Database Name
                        </FormLabel>
                        <FormControl className="bg-transparent">
                          <Input
                            placeholder="database_name"
                            {...field}
                            className="text-white"
                          />
                        </FormControl>
                        {formState.errors.dbName && (
                          <FormMessage>
                            {formState.errors.dbName.message}
                          </FormMessage>
                        )}
                        <FormDescription>
                          Name of the specific database to connect to.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Port Field */}
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field, formState }) => (
                      <FormItem>
                        <FormLabel className="text-white">Port</FormLabel>
                        <FormControl className="bg-transparent">
                          <Input
                            placeholder="3306"
                            {...field}
                            className="text-white"
                          />
                        </FormControl>
                        {formState.errors.port && (
                          <FormMessage>
                            {formState.errors.port.message}
                          </FormMessage>
                        )}
                        <FormDescription>
                          Port number for the database connection (default varies by DB type).
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="outline"
                    className="bg-transparent text-white border-white hover:bg-white hover:text-black"
                  >
                    Save
                  </Button>
                </>
              </form>
            </Form>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SQLDatabaseCardHandler;
