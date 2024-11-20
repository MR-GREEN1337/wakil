"use client";

import React, {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ReactFlow,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Controls,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
} from "@xyflow/react";
import { Box } from "@chakra-ui/react";
import "@xyflow/react/dist/style.css";
import NodePopover from "./editor-canvas-drag-catalogue-button";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BotMessageSquare,
  ChevronLeft,
  FastForward,
  Loader,
  LoaderCircle,
  Save,
} from "lucide-react";
import EditorCanvasCardSingle from "./editor-custom-single-card";
import {
  BACKEND_API_BASE_URL,
  ChatTooltipMessages,
  EditorCanvasDefaultCardTypes,
} from "@/lib/constants";
import { useEditor } from "@/providers/agent-provider";
import { EditorCanvasCardType, EditorNodeType } from "@/lib/types";
import { v4 } from "uuid";
import { onGetNodesEdges } from "../_actions/editor-calls";
import {
  TooltipTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import Cookies from "js-cookie";
import Draggable from "react-draggable";
import { Card, CardHeader } from "@/components/ui/card";
import ChatExpert from "./chat-expert";
import PublishConfirmationDialog from "@/components/ui/PublishConfirmationDialog";

type Props = {};

const initialNodes: EditorNodeType[] = [];

const initialEdges: { id: string; source: string; target: string }[] = [];

const EditorCanvas = (props: Props) => {
  const { dispatch, state } = useEditor();

  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [activeWindow, setActiveWindow] = useState("");
  const handleMouseDown = (windowName: SetStateAction<string>) => {
    setActiveWindow(windowName); // Set the active window
  };
  const zIndexFor = (windowName: string) => {
    return activeWindow === windowName ? "z-50" : "z-40"; // Determine z-index based on active window
  };

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [publishSaveLoading, SetPublishSaveLoading] = useState(false);
  const [saveLoading, SetSaveLoading] = useState(false);
  const [isWorkFlowLoading, setIsWorkFlowLoading] = useState<boolean>(false);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();
  const [graphTitle, SetGraphTitle] = useState<String>("");
  const pathname = usePathname();
  const toast = useToast();
  function getRandomMessage() {
    const randomIndex = Math.floor(Math.random() * ChatTooltipMessages.length);
    return ChatTooltipMessages[randomIndex];
  }

  const [randomMessage, setRandomMessage] = useState(getRandomMessage());

  const handleMouseEnter = () => {
    setRandomMessage(getRandomMessage());
  };

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      //@ts-ignore
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      //@ts-ignore
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  //console.log("hwa", nodes)

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      const type: EditorCanvasCardType["type"] = event.dataTransfer.getData(
        "application/reactflow"
      );

      if (typeof type === "undefined" || !type) {
        return;
      }

      const triggerAlreadyExists = state.editor.elements.find(
        (node) => node.type === "Trigger"
      );

      if (type === "Trigger" && triggerAlreadyExists) {
        toast.toast({
          title: "Only one trigger can be added to automations at the moment",
        });
        return;
      }

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: v4(),
        type,
        position,
        data: {
          title: type,
          description:
            EditorCanvasDefaultCardTypes[
              type as keyof typeof EditorCanvasDefaultCardTypes
            ].description,
          completed: false,
          current: false,
          metadata: {},
          type: type,
        },
      };

      //@ts-ignore
      setNodes((nds) => nds.concat(newNode));
      console.log("nodes", nodes);
      console.log("state.editor.elements", state.editor.elements);
    },
    [dispatch, reactFlowInstance, state, edges]
  );

  useEffect(() => {
    dispatch({ type: "LOAD_DATA", payload: { edges, elements: nodes } });
  }, [nodes, edges]);

  const handleClickCanvas = () => {
    dispatch({
      type: "SELECTED_ELEMENT",
      payload: {
        element: {
          data: {
            completed: false,
            current: false,
            description: "",
            metadata: {},
            title: "",
            type: "Trigger",
          },
          id: "",
          position: { x: 0, y: 0 },
          type: "Trigger",
        },
      },
    });
  };

  const nodeTypes = useMemo(
    () => ({
      Action: EditorCanvasCardSingle,
      Trigger: EditorCanvasCardSingle,
      Email: EditorCanvasCardSingle,
      Condition: EditorCanvasCardSingle,
      AI: EditorCanvasCardSingle,
      Slack: EditorCanvasCardSingle,
      "Google Drive": EditorCanvasCardSingle,
      Notion: EditorCanvasCardSingle,
      Discord: EditorCanvasCardSingle,
      "Custom Webhook": EditorCanvasCardSingle,
      "Google Calendar": EditorCanvasCardSingle,
      Wait: EditorCanvasCardSingle,
      "GPT-4o": EditorCanvasCardSingle,
      "GPT-o1": EditorCanvasCardSingle,
      Pinecone: EditorCanvasCardSingle,
      Qdrant: EditorCanvasCardSingle,
      "File Upload": EditorCanvasCardSingle,
      "URL Scraper": EditorCanvasCardSingle,
      "Wikipedia Search": EditorCanvasCardSingle,
      Docker: EditorCanvasCardSingle,
      Webhook: EditorCanvasCardSingle,
      "SQL DB": EditorCanvasCardSingle,
    }),
    []
  );

  const onGetWorkFlow = async () => {
    setIsWorkFlowLoading(true);
    const response = await onGetNodesEdges(pathname.split("/").pop()!);
    if (response) {
      setEdges(response.graph.edges!);
      setNodes(response.graph.nodes!);
      SetGraphTitle(response.title);
      setIsWorkFlowLoading(false);
    }
    setIsWorkFlowLoading(false);
  };

  useEffect(() => {
    onGetWorkFlow();
  }, []);

  const router = useRouter();

  //console.log("gg", state.editor.elements)
  const handleBackClick = () => {
    setIsChevronLoading(true);
    router.push("/dashboard/graph/");
  };

  const handleAgentPublish = async () => {
    SetPublishSaveLoading(true);
    const body = {
      edges: state.editor.edges,
      nodes: state.editor.elements,
    };

    const token = Cookies.get("token");
    try {
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/publish_graph/${pathname
          .split("/")
          .pop()!}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      SetPublishSaveLoading(false);
      toast.toast({
        title: "Agent published successfully!"
      })
      setIsPublishDialogOpen(true); // Open the dialog
      return data;
    } catch (error: any) {
      SetPublishSaveLoading(false);
      toast.toast({
        title: "Error publishing workflow",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };
  const handleAgentSave = async () => {
    console.log("graph", state.editor);
    // WIP: Take Graph: Agent and send it to backend, while not result, show loading button
    SetSaveLoading(true);
    const body = {
      edges: state.editor.edges,
      nodes: state.editor.elements,
    };
    //console.log("l7wa", body);
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/save_graph/${pathname
          .split("/")
          .pop()!}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            // Add any other headers you need here
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      SetSaveLoading(false);
      toast.toast({
        title: "Workflow successfully saved",
      });
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error or return a default value
      return null;
    }
  };
  const handleChatPopUp = () => {
    // WIP: Pop Page to talk to chat expert using audio and text
    setChatWindowOpen(true);
  };
  const [isChevronLoading, setIsChevronLoading] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  return (
    <main>
      <header className="m-3 text-white flex items-center relative">
        <Button
          onClick={handleBackClick}
          variant={"outline"}
          className="absolute bg-slate-900 mr-3"
        >
          {isChevronLoading ? (
            <LoaderCircle className="animate-spin text-sm" />
          ) : (
            <ChevronLeft />
          )}
        </Button>
        <h3 className="font-bold ml-10 pl-8">
          <span className="asterisk-red">*</span> {graphTitle}
        </h3>{" "}
      </header>
      <hr className="text-gray-400 border-2" />
      {isWorkFlowLoading ? (
        <div className="absolute flex h-full w-full items-center justify-center">
          <svg
            aria-hidden="true"
            className="inline h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      ) : (
        <Box
          className="    h-[80vh] w-[100vw]           
    md:h-[90vh] md:w-[90vw]       
    lg:h-[95vh] lg:w-[100vw]       
    max-w-full max-h-screen       
    relative"
        >
          <ReactFlow
            className="w-[300px]"
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodes={nodes}
            onNodesChange={onNodesChange}
            edges={edges}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onClick={handleClickCanvas}
            nodeTypes={nodeTypes}
          >
            <Controls
              orientation="horizontal"
              position="bottom-center"
              className="text-black"
            />
            {chatWindowOpen && (
              <div
                className={`max-h-min max-w-min z-10 inset-0 absolute pointer-events-none ${zIndexFor(
                  "courses"
                )}`}
                onMouseDown={() => handleMouseDown("courses")}
              >
                <Draggable
                  cancel=".no-drag"
                  positionOffset={{ x: "1400px", y: "300px" }}
                >
                  <div
                    className="pointer-events-auto
              flex flex-col
              rounded-lg
              border-t-[3px] border-l-[3px] border-l-[#fcfcfc] border-t-[#fcfcfc]
              border-b-[3px] border-r-[3px] border-b-[#484848] border-r-[#484848]
              "
                  >
                    <div className=" select-none h-8 bg-[#000082] flex flex-row items-center pl-2 pr-1 justify-between">
                      <p className="text-white text-lg">
                        Chat -{" "}
                        <span className="text-gray-500 text-sm">Drag Me!</span>
                      </p>
                      <button
                        className=" no-drag
                  bg-[#c3c3c3] h-6 w-6
                  flex flex-col items-center justify-center p-1
                  border-t-[3px] border-l-[3px] border-l-[#fcfcfc] border-t-[#fcfcfc]
                  active:border-l-[#484848] active:border-t-[#484848]
                  border-b-[3px] border-r-[3px] border-b-[#484848] border-r-[#484848]
                  active:border-b-[#fcfcfc] active:border-r-[#fcfcfc]
                  text-center
                  "
                        onClick={() => setChatWindowOpen(false)}
                      >
                        ⨯
                      </button>
                    </div>
                    <div className="no-drag">
                      <ChatExpert graph_id={pathname.split("/").pop()!} />
                    </div>
                  </div>
                </Draggable>
              </div>
            )}
          </ReactFlow>
          <div style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}>
            <NodePopover />
          </div>
          <div
            style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}
            className="flex-flex-col mr-5 mt-7"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="mr-2 bg-slate-900"
                    variant={"outline"}
                    onClick={handleChatPopUp}
                    onMouseEnter={handleMouseEnter}
                  >
                    <BotMessageSquare />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chat Assitant - {randomMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="bg-slate-900"
                    variant={"outline"}
                    onClick={handleAgentSave}
                    disabled={state.editor.elements.length < 2}
                  >
                    {saveLoading ? (
                      <Loader className="animate-spin" />
                    ) : (
                      <Save />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save Workflow</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="ml-2 bg-slate-900"
                    variant={"outline"}
                    onClick={handleAgentPublish}
                    disabled={
                      state.editor.elements.length === 0 ||
                      state.editor.edges.length === 0 ||
                      state.editor.edges.length >
                        (state.editor.elements.length *
                          (state.editor.elements.length - 1)) /
                          2
                    }
                  >
                    {publishSaveLoading ? (
                      <Loader className="animate-spin" />
                    ) : (
                      <FastForward />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Publish</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Box>
      )}
      <PublishConfirmationDialog
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
      />
    </main>
  );
};

export default EditorCanvas;
