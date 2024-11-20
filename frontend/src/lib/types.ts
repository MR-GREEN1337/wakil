import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface SidebarItems {
  links: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
  }>;
  extras?: ReactNode;
}

export type ConnectionTypes = "AI Model" | "File Upload" | "URL Scraper";

export type Connection = {
  title: ConnectionTypes;
  description: string;
  image: string;
};

export type EditorCanvasTypes =
  | "GPT-4o"
  | "GPT-o1"
  | "Pinecone"
  | "Qdrant"
  | "File Upload"
  | "URL Scraper"
  | "Google Drive"
  | "Wikipedia Search"
  | "SQL DB"
  | "Pinecone"
  | "Notion"
  | "Custom Webhook"
  | "Google Calendar"
  | "Trigger"
  | "Action"
  | "Wait"
  | "Condition"
  | "AWS Bedrock"
  | "Email"
  | "Docker"
  | "Webhook"

export type EditorCanvasCardType = {
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  metadata: any;
  type: EditorCanvasTypes;
};

export type EditorNodeType = {
  id: string;
  type: EditorCanvasCardType["type"];
  position: {
    x: number;
    y: number;
  };
  data: EditorCanvasCardType;
};

export type EditorNode = EditorNodeType;

export type EditorActions =
  | { type: 'REDO' }
  | { type: 'UNDO' }
  | { type: 'LOAD_DATA'; payload: { elements: EditorNode[]; edges: { id: string; source: string; target: string }[] } }
  | { type: 'SELECTED_ELEMENT'; payload: { element: EditorNodeType } }

export const nodeMapper: Record<string, string> = {
  Notion: "notionNode",
  Slack: "slackNode",
  Discord: "discordNode",
  "Google Drive": "googleNode",
};
