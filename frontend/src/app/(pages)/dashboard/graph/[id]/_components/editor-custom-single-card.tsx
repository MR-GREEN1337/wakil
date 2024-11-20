import { EditorCanvasCardType } from "@/lib/types";
import { useEditor } from "@/providers/agent-provider";
import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import clsx from "clsx";
import { Position, useNodeId, useReactFlow } from "@xyflow/react";
import CustomHandle from "./custom-handle";
import EditorCanvasIconHelper from "./editor-card-icon-helper";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@radix-ui/react-icons";
import { BadgeX, Trash2 } from "lucide-react";
import EditoCanvasCustomCard from "./editor-canvas-custom-card";

const EditorCanvasCardSingle = ({ data }: { data: EditorCanvasCardType }) => {
  const { dispatch, state } = useEditor();
  const reactFlowInstance = useReactFlow();
  const nodeId = useNodeId();

  const handleDeleteNode = (nodeId: string) => {
    reactFlowInstance.deleteElements({ nodes: [{ id: nodeId }] });
    console.log(state);
  };

  const logo = useMemo(() => {
    return <EditorCanvasIconHelper type={data.type} />;
  }, [data]);

  return (
    <>
      {data.type !== "Trigger" &&
        data.type !== "Google Drive" &&
        data.type !== "URL Scraper" &&
        data.type !== "File Upload" &&
        data.type !== "SQL DB" && (
          <CustomHandle
            type="target"
            position={Position.Left}
            style={{ zIndex: 100 }}
          />
        )}
      <Card
        onClick={(e) => {
          e.stopPropagation();
          const val = state.editor.elements.find((n) => n.id === nodeId);
          if (val)
            dispatch({
              type: "SELECTED_ELEMENT",
              payload: {
                element: val,
              },
            });
        }}
        className="relative max-w-[400px] max-h-[600px] bg-slate-950 border-mut "
      >
        <div className="flex justify-between items-center p-2 border-b border-muted-foreground/20">
          <div className="flex items-center gap-2 ml-8">
            {" "}
            {/* Add ml-8 to push the logo to the right */}
            <div
              className={clsx("absolute left-3 top-4 h-2 w-2 rounded-full", {
                "bg-green-500": Math.random() < 0.6,
                "bg-orange-500": Math.random() >= 0.6 && Math.random() < 0.8,
                "bg-red-500": Math.random() >= 0.8,
              })}
            ></div>
            {logo}
            {/*<CardTitle className="text-md">{data.title}</CardTitle>*/}
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{data.type}</Badge>
            <Button
              onClick={() => handleDeleteNode(nodeId || "")}
              className="text-white rounded-full bg-transparent hover:text-red-700 hover:bg-transparent transition duration-300 ease-in-out"
            >
              <BadgeX />
            </Button>
          </div>
        </div>
        <CardDescription className="p-4">
          <p className="text-xs text-muted-foreground/50">
            <b className="text-muted-foreground/80">ID: </b>
            {nodeId}
          </p>
          <p className="text-white font-psemibold">{data.description}</p>
        </CardDescription>
        <CardContent className="text-white">
          <EditoCanvasCustomCard data={data} />
        </CardContent>
      </Card>
      <CustomHandle type="source" position={Position.Right} id="a" />
    </>
  );
};

export default EditorCanvasCardSingle;
