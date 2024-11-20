import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Command, CommandInput } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { accordionData } from "@/lib/constants";
import { onDragStart } from "@/lib/editor-utils";
import { EditorCanvasTypes } from "@/lib/types";
import { PlusIcon, MinusIcon } from "@radix-ui/react-icons";
import React, { useState } from "react";
import EditorCanvasIconHelper from "./editor-card-icon-helper";

type Props = {};

const NodePopover = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rotate, setRotate] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
    setRotate(true);
    setTimeout(() => {
      setRotate(false);
    }, 1000); // rotate for 1 second
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-14 w-14 bg-slate-950 rounded-full ml-5 mt-5 shadow-md relative overflow-hidden"
          onClick={handleClick}
          variant={"outline"}
        >
          <PlusIcon className={`h-16 w-16 ${rotate ? "animate-spin 0.7s" : ""}`} />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50 animate-shimmering"></div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-transparent border-none">
        <ScrollArea className="h-96 w-72 rounded-sm">
          <Command className="rounded-lg border-none shadow-md Model bg-slate-800 text-white">
            <h3 className="ml-5 mb-6 font-bold text-lg pt-5">Add nodes</h3>
            <Accordion
              type="single"
              collapsible
              className="text-lg pl-7 pb-7 pr-7 "
            >
              {accordionData.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-psemibold text-gray-400">
                    <>
                      {item.title}
                      <EditorCanvasIconHelper type={item.subItems[0] as EditorCanvasTypes} />
                    </>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-2">
                    {item.subItems.map((subItem, subIndex) => (
                      <div
                        key={subIndex}
                        className="w-full flex justify-center mb-2"
                        draggable
                        onDragStart={(event) =>
                          onDragStart(event, subItem as EditorCanvasTypes)
                        }
                      >
                        <div className="bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block w-full">
                          <span className="absolute inset-0 overflow-hidden rounded-full">
                            <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                          </span>
                          <div className="flex relative space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10 w-full">
                            <span className="text-center">{subItem}</span>
                          </div>
                          <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Command>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NodePopover;
