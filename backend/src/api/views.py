from datetime import datetime
from typing import Any, Dict, List, Literal

from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from loguru import logger
from pydantic import ValidationError

from src.api.fields import PyObjectId
from src.core.agents.AsyncMongoDBSaver import AsyncMongoDBSaver
from src.core.agents.chat_expert import chat_expert
from src.core.agents.connections import (
    DBConnectionError,
    DBError,
    DBQueryError,
)
from src.core.agents.graph import WakilAgent
from src.core.agents.nodes import LLMUnSupportedError
from src.core.agents.utils import GraphValidationError
from src.security.oauth import get_current_user

from .crud import (
    create_new_graph,
    delete_graph_by_id,
    delete_session_by_id,
    fetch_chart_data_from_db,
    get_graph_by_id,
    get_graph_by_name_user_id,
    get_graphs_user_id,
    get_session_by_id,
    get_sessions_by_id,
    get_user_data,
    get_user_tooltip,
    join_new_session,
    retrieve_agent,
    retrieve_user_statistics,
    save_graph_to_db,
    start_new_session,
    update_session,
    update_user_data,
    update_user_image,
    user_owns_document,
)
from .models import (
    Agent,
    ChartData,
    ChatHistory,
    ChatResponse,
    GraphCreateForm,
    Session,
    SessionStart,
    SessionUser,
    UpdateImageModel,
    UserDataStripe,
    UserInfo,
)
from .websocket import connection_manager

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post(
    "/",
    description="Initiate session based on data crafted, and of course user_id",
)
async def start_session(
    user_data: SessionStart, user_id: PyObjectId = Depends(get_current_user)
) -> Session:
    session = await start_new_session(user_data, user_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session cannot be started right now, please try again later",
        )
    return session


@router.post(
    "/create_graph",
    description="Create Graph (Agent) Based on user_id and data sent",
)
async def create_graph(
    data: GraphCreateForm, user_id: PyObjectId = Depends(get_current_user)
) -> Agent:
    graph = await create_new_graph(data, user_id)
    if graph is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Graph cannot be started right now, please try again later",
        )
    return graph


"""@router.get("/")
async def list_sessions() -> list[Session] | None:
    return await list_sessions_from_db()  # type: ignore[return-value]
"""


@router.get(
    "/list_sessions", description="List sessions of a user based on his id"
)
async def list_sessions_of_user(
    user_id: PyObjectId = Depends(get_current_user),
) -> list[Session]:
    return await get_sessions_by_id(user_id)


@router.get(
    "/{session_id}/",
    description="Retrieve session based on user_id and session_id",
)
async def get_session(
    session_id: PyObjectId, user_id: PyObjectId = Depends(get_current_user)
) -> Session | None:
    ownership_bool = await user_owns_document(
        Session, document_id=session_id, user_id=user_id
    )
    if ownership_bool:
        session = await get_session_by_id(session_id)
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        return session

    # Raise a 403 Forbidden error if the user does not own the document
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this graph",
    )


"""@router.delete("/")
async def delete_sessions() -> dict[str, int]:
    deleted_count = await delete_sessions_from_db()
    return {"deleted_count": deleted_count}
"""


@router.post(
    "/{session_id}/join/",
    description="Join Session based on its id and user data",
)
async def join_session(
    session_id: PyObjectId, user_data: SessionUser
) -> Session:
    session = await get_session_by_id(id=session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.session_started:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session already started",
        )

    updated_session = await join_new_session(session, user_data)
    if updated_session is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session cannot be joined right now, please try again laterr",
        )

    return updated_session


@router.websocket("/ws/{session_id}/{session_type}")
async def websocket_session_endpoint(
    websocket: WebSocket,
    session_id: PyObjectId,
    session_type: Literal["Chat", "hi"],
    # user_id: PyObjectId = Depends(get_ws_current_user),
) -> None:
    try:
        # Validate session
        session = await get_session_by_id(session_id)
        if not session:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Session not found",
            )
            return

        # Validate session type
        if session_type not in ["Chat", "hi"]:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Invalid session type",
            )
            return

        # Validate user permissions
        # Modify get_current_user with sth rlse
        """user_id = "11"
        user = await get_current_user(user_id)
        if not user:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="User not found"
            )
            return"""

        # Connect to session
        await connection_manager.connect(websocket, session_id)

        while True:
            # Receive data from client
            try:
                data = await websocket.receive_json()
            except ValidationError:
                await websocket.send_json({"error": "Invalid data format"})
                continue

            # Process data based on session type
            updated_state = session.agent.invoke(data.state)

            # Broadcast updated state to all users
            await connection_manager.broadcast_session(updated_state)

    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, session_id)

    except Exception as e:
        await websocket.close(
            code=status.WS_1011_INTERNAL_ERROR, reason="Internal server error"
        )
        # Log the exception
        print(f"Error occurred: {e}")


@router.delete(
    "/graph/{graph_id}",
    description="Delete Graph (Agent) given its id, and user_id checking of graph belongs to user, as well clean vector_database",
)
async def delete_graph(
    graph_id: PyObjectId, user_id: PyObjectId = Depends(get_current_user)
) -> Any:
    ownership_bool = await user_owns_document(
        Agent, document_id=graph_id, user_id=user_id
    )
    if ownership_bool:
        result = await delete_graph_by_id(graph_id)
        return result
    # Raise a 403 Forbidden error if the user does not own the document
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this graph",
    )


@router.get("/get_graphs", description="Listing Agents based on user_id")
async def get_graphs(
    user_id: PyObjectId = Depends(get_current_user),
) -> list[Agent]:
    return await get_graphs_user_id(user_id)


@router.get(
    "/graphNames", description="retrieving agent names based on user_id"
)
async def get_graph_names(
    user_id: PyObjectId = Depends(get_current_user),
) -> list[str]:
    graphs = await get_graphs_user_id(user_id)
    return [graph["title"] for graph in graphs]


@router.delete(
    "/{session_id}",
    description="Delete Session based given its id, and user_id, checking his ownership of it",
)
async def delete_session(
    session_id: PyObjectId, user_id: PyObjectId = Depends(get_current_user)
) -> dict[str, Any]:
    ownership_bool = await user_owns_document(
        Session, document_id=session_id, user_id=user_id
    )
    if ownership_bool:
        result = await delete_session_by_id(session_id)
        return {"result": result}
    # Raise a 403 Forbidden error if the user does not own the document
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to delete this graph",
    )


@router.get("/user_info", description="Retrieving user info based on his id")
async def get_user_info(
    user_id: PyObjectId = Depends(get_current_user),
) -> UserInfo:
    result = await get_user_data(ObjectId(user_id))
    return result


@router.get(
    "/user_info_stripe",
    description="Retrieving user info regarding his stripe based on his id",
)
async def get_user_info_stripe(
    user_id: PyObjectId = Depends(get_current_user),
) -> UserDataStripe:
    result = await get_user_data(ObjectId(user_id))
    return result


@router.put(
    "/user", description="Updating user info based on Data and user_id"
)
async def update_user_info(
    updated_data: UserInfo, user_id: PyObjectId = Depends(get_current_user)
):
    await update_user_data(updated_data, user_id)
    return "horaay"


@router.put("/user/image")
async def update_image(
    update_model: UpdateImageModel,
    user_id: PyObjectId = Depends(get_current_user),
):
    try:
        image_uri = update_model.image_uri
        await update_user_image(image_uri, user_id)
        return {"message": "image updated"}

    except Exception as e:
        logger.error(e)


@router.put(
    "/{id}",
    description="update Session based on sesssion_id and user_id to check ownership",
)
async def update_sess(
    id: PyObjectId,
    update_model: Session,
    user_id: PyObjectId = Depends(get_current_user),
):
    ownership_bool = await user_owns_document(
        Session, document_id=id, user_id=user_id
    )
    if ownership_bool:
        result = await update_session(session_data=update_model, session_id=id)
        return result
    # Raise a 403 Forbidden error if the user does not own the document
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to modify the session",
    )


@router.get(
    "/user-details/{user_game_id}",
    description="Retrive user session details based on user_id",
)
async def get_user(
    user_game_id: str, user_id: PyObjectId = Depends(get_current_user)
):
    result = await get_user_tooltip(user_game_id)
    return result


@router.post(
    "/graph/outlines",
    description="Retrieve session outlines of agent based on title and description",
)
async def get_outlines(
    data: dict[str, str], user_id: PyObjectId = Depends(get_current_user)
):
    # print(data )
    # return await set_outline(data)
    return ["Chat"]


@router.post(
    "/graph/", description="Retrive Graph (Agent) through its name and user_id"
)
async def get_graph_through_name_and_user_id(
    name: dict[str, str], user_id: PyObjectId = Depends(get_current_user)
) -> Agent:
    result = await get_graph_by_name_user_id(user_id, name["agent"])
    if result is None:
        return []
    return result


@router.get(
    "/graph_id/{graph_id}", description="Retrieve Graph Based on its Id"
)
async def get_agent(
    graph_id: PyObjectId, user_id: PyObjectId = Depends(get_current_user)
) -> Agent:
    ownership_bool = await user_owns_document(
        Agent, document_id=graph_id, user_id=user_id
    )
    if ownership_bool:
        agent = await retrieve_agent(graph_id)
        if agent is None:
            return []
        if "graph" not in agent or agent["graph"] is None:
            agent |= {"graph": {"nodes": [], "edges": []}}
        return Agent(**agent)
    # Raise a 403 Forbidden error if the user does not own the document
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this graph",
    )


@router.post(
    "/save_graph/{graph_id}", description="Save nodes and edges to the graph"
)
async def save_graph(
    graph: dict,
    graph_id: PyObjectId,
    user_id: PyObjectId = Depends(get_current_user),
):
    ownership_bool = await user_owns_document(
        Agent, document_id=graph_id, user_id=user_id
    )
    try:
        if ownership_bool:
            result = await save_graph_to_db(graph, graph_id)
            if result:
                return {"message": "graph updated successfully"}

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Graph Cannot be updated, try again later",
            )
        # Raise a 403 Forbidden error if the user does not own the document
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this graph",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/publish_graph/{graph_id}", description="Publish Graph")
async def publish_graph(
    graph: dict,
    graph_id: PyObjectId,
    user_id: PyObjectId = Depends(get_current_user),
):
    """
    First save the graph in case if user forgot to
    See if the agent is coherent, if not return error to user, WakilAgent should be able to process that
    If coherent, buid agent, take blob and send it to S3, need to add cron jobs to run it once in a while

    To optimize this endpoint we need to block useless publishes, if previously published and current agent
    payload is same as one in db then don't publish it again
    """
    # print(user_id)

    ownership_bool = await user_owns_document(
        Agent, document_id=graph_id, user_id=user_id
    )
    if ownership_bool:
        agent = await retrieve_agent(graph_id)
        if agent["graph"] == graph and agent["publish"]["published"]:
            raise HTTPException(
                status_code=400,
                detail="Graph is still same and already published",
            )

        # Increment publish count
        agent["publish"]["publish_count"] += 1
        # Set last published date
        agent["publish"]["last_published"] = datetime.now()
        # Set published to True
        agent["publish"]["published"] = True
        """        try:
            result = await save_agent_to_db(agent, graph_id)
        except Exception as e:
            logger.error(e)
            raise HTTPException(status_code=400, detail=str(e))"""
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this graph",
        )
    # Do something with result
    # Retrieve Agent
    agent = await retrieve_agent(graph_id)
    agent_compiled = WakilAgent()  # FIX Coroutine and not awaiting error²
    # logger.info(graph)
    try:
        await agent_compiled.intialize(Agent(**agent))
        async with AsyncMongoDBSaver.from_conn_info() as checkpointer:
            compiled_agent = await agent_compiled.build_agent(
                checkpointer=checkpointer
            )
            _ = await agent_compiled.draw_agent()

            # Send blob to S3 - Doesn't work
            # await send_agent_to_cloud(
            #    compiled_agent, user_id=user_id, graph_id=graph_id
            # )
    except GraphValidationError as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail=e.detail)
    except LLMUnSupportedError as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail=e.detail)
    except ValueError as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail=str(e))
    except DBConnectionError as e:
        raise HTTPException(
            status_code=503, detail=f"Database connection error: {str(e)}"
        )
    except DBQueryError as e:
        raise HTTPException(
            status_code=400, detail=f"Database query error: {str(e)}"
        )
    except DBError as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail=str(e))

    # result = await publish_graph_away(graph, graph_id)


@router.post(
    "/chat-expert/{graph_id}",
    description="Each Graph has a chat expert with memory of history chat, aiming to help user to build better graphs",
)
async def chat_with_expert(
    graph_id: PyObjectId,
    messages: ChatHistory,
    user_id: PyObjectId = Depends(get_current_user),
) -> ChatResponse:
    ownership_bool = await user_owns_document(
        Agent, document_id=graph_id, user_id=user_id
    )
    if ownership_bool:
        graph = await get_graph_by_id(graph_id)
        result = await chat_expert(
            graph=graph.graph,
            prompt=messages.messages[-1],
            history_messages=messages.messages,
        )
        # print(result)
        return ChatResponse(message=result)
    # Raise a 403 Forbidden error if the user does not own the document
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to modify this graph",
    )


@router.get(
    "/chat-expert/initial-messages/{graph_id}",
    description="Retrieve history of chat",
)
async def retrieve_chat_expert_message_history(
    graph_id: PyObjectId,
) -> List[Any]:
    """Work some magic on checkpointer documents to return hisotry of messages"""
    return []


@router.get(
    "/user-stats",
    description="Get user stats (nb of sessions/graphs) and other stuff",
    response_model=Dict[str, Any],
)
async def retrieve_user_stats(
    user_id: PyObjectId = Depends(get_current_user),
) -> Dict[str, Any]:
    """Work some magic by getting stats"""
    result = await retrieve_user_statistics(user_id)
    return result


@router.get(
    "/chart-data",
    description="Get Chart data of user creation of sessions and graphs",
    response_model=List[ChartData],
)
async def retrieve_user_chart_data(
    user_id: PyObjectId = Depends(get_current_user),
) -> List[ChartData]:
    """Work some magic by getting stats, and charts data"""
    try:
        # Fetch real chart data from the database
        chart_data = await fetch_chart_data_from_db(user_id)
        return chart_data.chart_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
