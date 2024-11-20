import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ghost, Send } from "lucide-react";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import Cookies from "js-cookie";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the shape of a single message
interface Message {
  text: string;
  sender: "user" | "expert";
}

type Props = {
  graph_id: String;
};

// State for the ChatExpert component
interface State {
  messages: Message[];
  newMessage: string;
  isTyping: boolean;
}

const ChatExpert = (props: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Fetch initial messages when the component mounts
  useEffect(() => {
    const fetchInitialMessages = async () => {
      const token = Cookies.get("token");
      try {
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/sessions/chat-expert/initial-messages/${props.graph_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        const initialMessages = data.messages.map((message: any) => ({
          text: message,
          sender: "expert",
        }));
        setMessages(initialMessages);
      } catch (error) {
        console.error("Failed to fetch initial messages:", error);
      }
    };
    fetchInitialMessages();
  }, []);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return; // Don't send empty messages

    if (newMessage.trim().toLowerCase() === "clear") {
      setMessages([]); // Clear the messages
      setNewMessage(""); // Clear the input field
      return;
    }

    const messages_to_send = (messages: Message[]) => {
      return messages.map((message) => message.text);
    };

    const history_messages = messages_to_send(messages);
    const messages_payload = [...history_messages, newMessage];

    try {
      const token = Cookies.get("token");
      setIsTyping(true);
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/chat-expert/${props.graph_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: messages_payload }),
        }
      );
      const data = await response.json();

      const newMessageObject = {
        text: newMessage,
        sender: "user",
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        newMessageObject as Message,
      ]);

      const expertMessageObject = {
        text: data.message,
        sender: "expert",
      };

      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          expertMessageObject as Message,
        ]);
        setIsTyping(false);
      }, 2000); // Simulate typing delay

      setNewMessage(""); // Clear the input field
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Render the chat interface
  return (
    <Card
      className="bg-slate-950"
      style={{ height: "45vh", display: "flex", flexDirection: "column" }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {messages && messages.length > 0 ? (
          <ul className="space-y-3">
            {messages.map((message, index) => (
              <li
                key={index}
                className={`flex ${
                  message.sender === "user" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white markdown-body"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
            {isTyping && (
              <li className="flex justify-end">
                <span className="text-white">
                  <span className="dot-animation">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                </span>
              </li>
            )}
          </ul>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Ghost className="text-white hover:animate-pulse" size={120} />
            <h3 className="mt-18 text-white text-xl font-bold">
              No Messages to Display
            </h3>
          </div>
        )}
      </div>
      <div
        className="flex"
        style={{ padding: 20, borderTop: "1px solid #ccc", marginTop: "auto" }}
      >
        <input
          className="bg-transparent text-sm text-white font-semibold border-2 border-white rounded-lg ml-0"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type clear to delete messages"
          style={{ flex: 1, marginRight: 10 }}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSendMessage}
                variant={"outline"}
                className="bg-transparent text-white hover:text-slate-950"
              >
                <Send />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-white">Send Message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
};

export default ChatExpert;
