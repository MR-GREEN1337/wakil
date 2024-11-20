import { BACKEND_API_BASE_URL } from "@/lib/constants";

import Cookies from 'js-cookie';

export const onGetNodesEdges = async (graphId: string) => {
    try {
        const token = Cookies.get("token")  
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/sessions/graph_id/${graphId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              "Authorization": `Bearer ${token}`
            }
          }
        
        );
        const data = await response.json();
        //console.log("hi there", data)
        return data
      } catch (error: any) {
        console.error(error.message);
      }
  }
