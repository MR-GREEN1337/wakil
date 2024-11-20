import React from "react";
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
import { produce } from "immer";

type Props = {};

const LLMCardHandler = (props: Props) => {
  const formSchema = z.object({
    temperature: z
      .string()
      .transform((v) => parseFloat(v) || 0)
      .refine((v) => v >= 0, { message: "Min value is 0" })
      .refine((v) => v <= 1, { message: "Max value is 1" }),
    prompt: z.string().min(1, "wa zbi"),
  });

  const { dispatch, state } = useEditor();
  const nodeId = useNodeId();
  const metadata = state.editor.elements.find((node) => node.id === nodeId)
    ?.data.metadata;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature: metadata?.temperature || 0,
      prompt: metadata?.prompt || "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Create a shallow copy of the array
    const updatedNodes = state.editor.elements.map((node) => {
      if (node.id === nodeId) {
        // Return a new node with updated metadata
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
      type: 'LOAD_DATA',
      payload: {
        ...state.editor,
        elements: updatedNodes,
      },
    });
  
    console.log('Dispatch called with payload:', {
      type: 'LOAD_DATA',
      payload: {
        ...state.editor,
        elements: updatedNodes,
      },
    });
    console.log('State after dispatch:', state.editor);
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Inputs</AccordionTrigger>
        <AccordionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field, formState }) => (
                  <FormItem>
                    <FormLabel className="text-white">Temperature</FormLabel>
                    <FormControl className="bg-transparent">
                      <Input
                        placeholder="0"
                        {...field}
                        className="text-white"
                      />
                    </FormControl>
                    {formState.errors.temperature && (
                      <FormMessage />
                    )}
                    <FormDescription>
                      Higher the temperature, more creative the LLM.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prompt"
                render={({ field, formState }) => (
                  <FormItem>
                    <FormLabel className="text-white">Prompt</FormLabel>
                    <FormControl className="bg-transparent">
                      <Input
                        placeholder="Answer my emails with care"
                        {...field}
                        className="text-white"
                      />
                    </FormControl>
                    {formState.errors.prompt && (
                      <FormMessage />
                    )}
                    <FormDescription>
                      This will aid in giving context to the model
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/*              <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Temperature</FormLabel>
                      <FormControl className="bg-transparent">
                        <Input
                          placeholder="0"
                          {...field}
                          className="text-white"
                        />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                    </FormItem>
                  )}
                />*/}
              <Button
                type="submit"
                variant={"outline"}
                className="bg-transaprent"
              >
                Save
              </Button>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default LLMCardHandler;