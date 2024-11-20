from collections import defaultdict
from typing import Any

from fastapi import WebSocket

from .fields import PyObjectId
from .models import Session


class ConnectionManager:
    def __init__(self) -> None:
        self.sessions: dict[PyObjectId, Any] = defaultdict(
            lambda: defaultdict(list)
        )

    async def connect(
        self, websocket: WebSocket, session_id: PyObjectId
    ) -> None:
        await websocket.accept()
        self.sessions[session_id]["users"].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: PyObjectId) -> None:
        players = self.sessions[session_id]["users"]  # safe due to defaultdict
        if websocket in players:
            players.remove(websocket)

    async def broadcast_session(self, session: Session) -> None:
        json_data = session.model_dump_json()
        for connection in self.sessions[session.id]["users"]:
            await connection.send_json(json_data)


connection_manager = ConnectionManager()
