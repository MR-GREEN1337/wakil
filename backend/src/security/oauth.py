from fastapi import (
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.security import OAuth2PasswordBearer

from .jwttoken import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    return await verify_token(token)


def get_token_user(token: str = Depends(oauth2_scheme)):
    return token


async def get_ws_current_user(websocket: WebSocket):
    # Get the token from the WebSocket headers
    token = websocket.query_params.get("token")
    print("zzzz", websocket)
    if not token:
        raise WebSocketDisconnect(
            code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized"
        )

    # Verify the token
    user = await verify_token(token)
    if not user:
        raise WebSocketDisconnect(
            code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized"
        )
    return user
