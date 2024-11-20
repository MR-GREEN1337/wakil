import { EditorCanvasCardType } from "@/lib/types";
import React from "react";
import VectorDBHandler from "./editor-canvas-vector-db-handler";
import LLMCardHandler from "./editor-canvas-llm-card-inputs";
import URLSearchCardHandler from "./editor-canvas-url-search-card-inputs";
import WikipediaSearchCardHandler from "./editor-canvas-Wikipedia-search";
import FileUploadCardHandler from "./editor-canvas-file-upload-handler";
import SQLDatabaseCardHandler from "./editor-canvas-sql-db-card-handler";

const EditoCanvasCustomCard = ({ data }: { data: EditorCanvasCardType }) => {
  switch (data.type) {
    case "GPT-4o":
      case "GPT-o1":
      return <LLMCardHandler/>
    case "Pinecone":
    case "Qdrant":
      return <VectorDBHandler />;
    case "File Upload":
      return <FileUploadCardHandler />
    case "URL Scraper":
      return <URLSearchCardHandler />;
    case "Wikipedia Search":
      return <WikipediaSearchCardHandler />;  
    case "Google Drive":
      return <h3>Google Drive</h3>;
    case "SQL DB":
      return <SQLDatabaseCardHandler />
    case "Notion":
      return <h3>Notion</h3>;
    case "Custom Webhook":
      return <h3>Custom Webhook</h3>;
    case "Google Calendar":
      return <h3>Google Calendar</h3>;
    case "Trigger":
      return <h3>Trigger</h3>;
    case "Action":
      return <h3>Action</h3>;
    case "Wait":
      return <h3>Wait</h3>;
    case "Condition":
      return <h3>Condition</h3>;
    case "AWS Bedrock":
      return <h3>AWS Bedrock</h3>;
    case "Email":
      return <h3>Email</h3>;
    default:
      return <h3>Unknown Type</h3>;
  }
};

export default EditoCanvasCustomCard;
