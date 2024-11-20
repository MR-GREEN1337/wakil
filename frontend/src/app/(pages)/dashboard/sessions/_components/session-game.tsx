import React from "react";
import { SessionData } from "../[id]/page";
import Chat from "./chat-card";

type Props = {
  data: SessionData;
  ws: WebSocket | null;
};

const SessionGame = ({ data, ws }: Props) => {
  const player = localStorage.getItem("email");
  console.log(data)
  return (
    // Conditional Rendering based on data.agent.outlie
  <div className="flex flex-col ml-2 justify-center mt-0">
      {/*<p>{data.agent.outline}</p>*/}
      <Chat data={data} ws={ws}/>
    </div>
  );
}

export default SessionGame;