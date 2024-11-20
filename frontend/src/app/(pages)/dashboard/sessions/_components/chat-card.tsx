import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import { SessionData } from "../[id]/page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaPaperPlane } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import Cookies from 'js-cookie'

type Props = {
  data: SessionData;
  ws: WebSocket | null;
};

type message = {
  message: string;
  user: User;
};

type User = {
  firstname: string;
  image_uri: { image_uri: string };
  email: string;
};

const Chat = ({ data, ws }: Props) => {
  const [messages, setMessages] = useState<message[]>([]); // store chat messages
  const [newMessage, setNewMessage] = useState(""); // store new message input
  const [isTyping, setIsTyping] = useState(false); // indicate when user is typing
  const [currentUser, setCurrentUser] = useState<User | null>(); // store current user info

  useEffect(() => {
    // fetch current user info
    const fetchCurrentUser = async () => {
      const token = Cookies.get("token")
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/user_info`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      const userData = await response.json();
      //console.log("hello", userData);
      setCurrentUser(userData);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // establish WebSocket connection and listen for messages
    if (ws) {
      ws.onmessage = (event) => {
        setMessages((prevMessages) => [...prevMessages, event.data]);
      };
    }
  }, [ws]);

  const handleSendMessage = async () => {
    // send new message to WebSocket server
    if (ws && ws.readyState === WebSocket.OPEN && newMessage.trim()!== "") {
      if (!currentUser) {
        console.error("Current user is not defined");
        return;
      }
  
      const payload = {
        user: {
          name: currentUser.firstname,
          email: currentUser.email,
          image_uri: currentUser.image_uri.image_uri,
        },
        message: newMessage,
      };
      ws.send(JSON.stringify(payload));
      setMessages((prevMessages) => [
       ...prevMessages,
        { message: newMessage, user: currentUser }, // Ensure currentUser is not null
      ]);
      setNewMessage(""); // clear input field
      setIsTyping(false); // reset typing indicator
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(true); // indicate user is typing
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-3/4 h-3/4 bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px] shadow-2xl shadow-opacity-100 shadow-blur-sm shadow-blue-600 flex flex-col">
        <CardHeader>
          <CardTitle className="text-white font-psemibold">Chat</CardTitle>
          <CardDescription>Start chatting with your team.</CardDescription>
        </CardHeader>
        <div className="p-4 flex-grow overflow-auto">
          {messages.map((message, index) => (
            <div key={index} className="flex mb-2">
              <Avatar>
                <AvatarImage
                  src={message.user.image_uri.image_uri}
                  alt={message.user.firstname}
                />
                <AvatarFallback>
                  {message.user.firstname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-200 rounded-md p-2 max-w-xs ml-1">
                <p className="text-sm text-gray-600">{message.message}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <li className="mb-2">
              <span className="text-gray-700">Typing...</span>
            </li>
          )}
        </div>
        <hr className="border-gray-300 h-px w-full" />
        <div className="flex items-center p-2 rounded-md mt-1 ml-3 mb-3 w-full">
        <Input
        placeholder="Send a message..."
        className="flex-grow bg-transparent text-white placeholder-white py-2 px-4 w-full"
        value={newMessage}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage();
          }
        }}
      />
          <Button
            className="bg-transparent text-white ml-2 justify-end"
            onClick={handleSendMessage}
            variant="outline"
          >
            <FaPaperPlane />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
