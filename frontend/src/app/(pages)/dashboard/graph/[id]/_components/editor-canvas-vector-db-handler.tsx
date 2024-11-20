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
import { produce } from 'immer';

type Props = {};

const VectorDBHandler = (props: Props) => {
  const formSchema = z.object({
    temperature: z
      .string().transform((v) => Number(v)||0)
  });

  const { dispatch, state } = useEditor();
  const nodeId = useNodeId();
  const metadata = state.editor.elements.find((node) => node.id === nodeId)?.data.metadata;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:{temperature:metadata?.temperature || ''}
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
      <h3 className="">Data</h3>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Output</AccordionTrigger>
        <AccordionContent>
          <h3>
              Vectors of your given data <br />
              ready to de devoured by LLMs
          </h3>
        </AccordionContent>
        </AccordionItem>
    </Accordion>
  );
};

export default VectorDBHandler;
