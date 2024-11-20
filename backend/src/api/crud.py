from typing import Any, Dict

import boto3
from bson import ObjectId
from fastapi import HTTPException
from loguru import logger
from qdrant_client import models

from src.api.fields import PyObjectId
from src.api.models import (
    Agent,
    AgentValidate,
    ChartData,
    Graph,
    GraphCreateForm,
    MongoDBModel,
    S3Nodes,
    Session,
    SessionStart,
    SessionUser,
    User,
    UserDataResponse,
    UserInfo,
    UserTooltip,
)
from src.core.agents.AsyncMongoDBSaver import AsyncMongoDBSaver
from src.core.agents.graph import WakilAgent
from src.core.settings import settings
from src.db.client import MongoDBClient
from src.db.qdrant import get_qdrant


async def get_user_id(email: str) -> PyObjectId:
    client = MongoDBClient()
    user = await client.get_by_email(User, email)
    if user is None:
        return None
    return user["id"]


async def user_owns_document(
    collection: MongoDBModel, document_id: PyObjectId, user_id: PyObjectId
) -> bool:
    """Check if the user owns the document by comparing the user_id field in the document with the provided user_id."""
    """Also Checks user's subscription status and if the user has more than 10 documents"""

    client = MongoDBClient()
    result = await client.get(collection, document_id)
    user = await client.get(User, ObjectId(user_id))
    # print(result)
    if user is None:
        return False
    # print(user)
    if (
        user.get("subscription_plan") is None
        or user.get("subscription_status") == "canceled"
    ):
        return False
    document_count = await client.count_documents(
        collection, {"user_id": ObjectId(user_id)}
    )
    if document_count == 10:
        return False
    if result is None:
        return False
    return result.get("user_id") == user_id


async def start_new_session(
    user_data: SessionStart, user_id: PyObjectId
) -> Session | None:
    client = MongoDBClient()
    if user_id is None:
        return None
    session_data = {
        "title": user_data.title,
        "users": [user_data.user.model_dump()],
        "max_session_users": user_data.max_session_users,
        "players_joined": 1,
        "user_id": user_id,
        "session_started": False,
    }
    agent = await client.get_by_name_user_id(Agent, user_data.agent, user_id)
    # print("agent", agent)
    if agent is not None:
        session_data |= {
            "agent": {"id": agent["id"], "outline": user_data.outline}
        }
    else:
        session_data |= {"agent": {}}

    inserted_result = await client.insert(Session, session_data)  # type: ignore[arg-type]
    return await get_session_by_id(inserted_result.inserted_id)


async def create_new_graph(graph_data: GraphCreateForm, user_id: PyObjectId):
    client = MongoDBClient()
    if user_id is None:
        return None
    # Pop email cause we don't fucking need it
    graph_data = graph_data.model_dump()
    graph_data |= {"user_id": user_id}
    graph_data = AgentValidate(**graph_data)
    inserted_result = await client.insert(Agent, graph_data.model_dump())
    return await get_graph_by_id(inserted_result.inserted_id)


async def get_session_by_id(id: PyObjectId) -> Session | None:
    client = MongoDBClient()
    session_data = await client.get(Session, id)  # type: ignore[arg-type]
    if session_data is None:
        return None
    result = Session(**session_data)
    return result


async def get_graph_by_id(id: PyObjectId) -> Agent | None:
    client = MongoDBClient()
    graph_data = await client.get(Agent, id)  # type: ignore[arg-type]
    # print(Graph_data)
    if graph_data is None:
        return None
    result = Agent(**graph_data)

    return result


async def get_graphs_user_id(user_id: str) -> list[Agent]:
    client = MongoDBClient()
    result = await client.get_many_user_id(Agent, user_id)  # type: ignore[arg-type]
    # print(result)
    if result is None:
        return []

    return result


async def list_sessions_from_db() -> list[Session] | None:
    client = MongoDBClient()
    return await client.list(Session)


async def delete_sessions_from_db() -> int:
    client = MongoDBClient()
    result = await client.delete_many(Session)
    return result.deleted_count


async def join_new_session(
    session: Session, new_user: SessionUser
) -> Session | None:
    session.users.append(new_user)
    session.players_joined += 1
    session_data = session
    return await update_session(session.id, session_data)


async def update_session(
    session_id: PyObjectId, session_data: Session
) -> Session | None:
    client = MongoDBClient()
    print(session_data)
    await client.update_one(Session, session_id, session_data.model_dump())
    return await get_session_by_id(session_id)


async def delete_graph_by_id(graph_id: PyObjectId):
    """delete vectors from vector db with given graph_id"""
    client = MongoDBClient()
    # Step 2: Delete the graph from MongoDB

    qdrant_db = await get_qdrant()
    if qdrant_db is None:
        return {
            "status": "error",
            "message": "Vector database is not available.",
        }

    # WIP: Delete S3 Blobs
    try:
        data_nodes = list(S3Nodes.__args__)
        # First check if any file upload exist
        client = MongoDBClient()
        agent = await client.get(Agent, graph_id)
        # print(agent)
        # If a graph is constructed
        if agent["graph"] is not None:
            nodes = agent["graph"]["nodes"]
            nodes_files = [
                node
                for node in list(nodes)
                if node["data"]["title"] in data_nodes
            ]
            logger.info("file nodes", nodes_files)
            s3_exists = any(nodes_files)
            if s3_exists:
                try:
                    s3_client = boto3.client(
                        "s3",
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_REGION_NAME,
                    )
                    for node in nodes_files:
                        logger.info(node)
                        # See if the node has metadata
                        if node["data"]["metadata"]:
                            # EXTRACT FILE KEY NAME FROM PRESIGNED URL
                            filename = node["data"]["metadata"]["file"]["url"]
                            file_name = filename.rsplit("/", 1)[-1].split(
                                "?", 1
                            )[0]
                            response = s3_client.delete_object(
                                Bucket=settings.S3_BUCKET_NAME,
                                Key=file_name,
                            )
                            logger.info(
                                f"Deleted Data from S3 Bucket {response}"
                            )

                except Exception as e:
                    logger.warning(f"Error while deleting blobs from S3: {e}")
                    return []

    except Exception as e:
        logger.warning(f"Error while deleting blobs from S3: {e}")
        return []

    # Delete vectors from Qdrant based on `graph_id`
    try:
        await qdrant_db.delete(
            collection_name="user_data",
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="graph_id",
                            match=models.MatchValue(value=str(graph_id)),
                        ),
                    ]
                ),
            ),
        )
        logger.info(f"Deleted vectors from Qdrant for graph {graph_id}")
    except Exception as e:
        logger.warning(f"Error while deleting vectors from Qdrant: {e}")
        return []
    # Delete Agent checkpoints documents from mongodb
    try:
        # Connect to MongoDB, access checkpoints documents and delete based on id
        deleted_count = await AsyncMongoDBSaver().aremove_checkpoints(graph_id)
        logger.info(f"Deleted {deleted_count} checkpoints")

    except Exception as e:
        logger.error(f"Error Deleting agents checkpoints if hey exist: {e}")

    try:
        await client.delete_one(Agent, graph_id)
    except Exception as e:
        logger.error(f"Error while deleting graph from MongoDB: {e}")
        return []

    return {
        "status": "success",
        "message": f"Graph {graph_id} and its vectors deleted successfully.",
    }


async def get_sessions_by_id(user_id: PyObjectId):
    client = MongoDBClient()
    if user_id is None:
        return None
    result = await client.get_many_user_id(Session, user_id)  # type: ignore[arg-type]
    result = [
        {**card, "finished_at": card.get("finished_at", "not yet finished")}
        for card in result
    ]

    return result


async def delete_session_by_id(session_id: PyObjectId):
    client = MongoDBClient()
    await client.delete_one(Session, session_id)


async def get_user_data(id: PyObjectId):
    client = MongoDBClient()
    return await client.get(User, id)


async def update_user_data(user_data: UserInfo, user_id: PyObjectId):
    client = MongoDBClient()
    await client.update_one(
        User, id=ObjectId(user_id), data=user_data.model_dump()
    )


async def update_user_image(user_uri: str, user_id: PyObjectId):
    client = MongoDBClient()
    await client.update_one(
        User, ObjectId(user_id), data={"image_uri": user_uri}
    )


async def get_user_tooltip(user_email: str) -> UserTooltip:
    client = MongoDBClient()
    result = await client.get_by_email(User, user_email)
    if result is None:
        return None
    # print(result)
    result = {
        "name": result["firstname"] + " " + result["lastname"],
        "image": result["image_uri"],
        "id": result["id"],
    }
    result = UserTooltip(**result)
    # print(result)
    # return  {'id':result.id, 'name': result.firstname + result.lastname, 'image': result.image_uri}
    return result


async def get_graph_by_name_user_id(user_id: PyObjectId, name: str):
    client = MongoDBClient()
    result = await client.get_many_user_id(Agent, user_id)  # type: ignore[arg-type]
    for agent in result:
        # print(agent)
        if agent["title"] == name:
            return agent
    return None


async def retrieve_agent(graph_id: PyObjectId) -> Agent:
    client = MongoDBClient()
    agent = await client.get(Agent, graph_id)
    if agent is None:
        return None

    return agent


async def save_graph_to_db(graph: Graph, graph_id: PyObjectId):
    """
    Save graph to db
    See if any data node was deleted and trigger delete node from S3/Vector DB
    """
    client = MongoDBClient()
    result = 0
    try:
        agent = await client.get(Agent, graph_id)
        #logger.info(agent)
        # Check if graph exists
        if agent["graph"]:
            agent_nodes = agent["graph"]["nodes"]
            new_agent_nodes = graph["nodes"]
            deleted_nodes = [
                node for node in agent_nodes if node not in new_agent_nodes
            ]
            logger.info(deleted_nodes)
            if len(deleted_nodes) > 0:
                # First check if any file upload exist
                data_nodes = list(S3Nodes.__args__)
                nodes_files = [
                    node
                    for node in deleted_nodes
                    if node["data"]["title"] in data_nodes
                ]
                logger.info("file nodes", nodes_files)
                s3_exists = any(nodes_files)
                if s3_exists:
                    try:
                        s3_client = boto3.client(
                            "s3",
                            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                            region_name=settings.AWS_REGION_NAME,
                        )
                        for node in nodes_files:
                            logger.info(node)
                            # See if the node has metadata
                            if node["data"]["metadata"]:
                                # EXTRACT FILE KEY NAME FROM PRESIGNED URL
                                filename = node["data"]["metadata"]["file"]["url"]
                                file_name = filename.rsplit("/", 1)[-1].split(
                                    "?", 1
                                )[0]
                                response = s3_client.delete_object(
                                    Bucket=settings.S3_BUCKET_NAME,
                                    Key=file_name,
                                )
                                logger.info(
                                    f"Deleted Data from S3 Bucket {response}"
                                )

                    except Exception as e:
                        logger.warning(f"Error while deleting blobs from S3: {e}")
                        return []
            # Check if any vector db node exist
            vector_db_nodes = [
                node for node in deleted_nodes if node["type"] == "Qdrant"
            ]
            vector_db_exists = any(vector_db_nodes)
            if vector_db_exists:
                qdrant_db = await get_qdrant()
                if qdrant_db is None:
                    return {
                        "status": "error",
                        "message": "Vector database is not available.",
                    }
                try:
                    for node in vector_db_nodes:
                        await qdrant_db.delete(
                            collection_name="user_data",
                            points_selector=models.FilterSelector(
                                filter=models.Filter(
                                    must=[
                                        models.FieldCondition(
                                            key="graph_id",
                                            match=models.MatchValue(
                                                value=str(graph_id)
                                            ),
                                        ),
                                    ]
                                ),
                            ),
                        )
                        logger.info(
                            f"Deleted vectors from Qdrant for graph {graph_id}"
                        )
                except Exception as e:
                    logger.warning(
                        f"Error while deleting vectors from Qdrant: {e}"
                    )
                    return []
        result = await client.update_one(
            Agent, graph_id, {"graph": graph, "publish.published": False}
        )
    except Exception as e:
        logger.error(f"failed saving error: {e}")
    if result is None:
        return None

    return result


async def save_agent_to_db(agent: Agent, graph_id: PyObjectId):
    client = MongoDBClient()
    result = 0
    try:
        result = await client.update_one(Agent, graph_id, agent)
    except Exception as e:
        logger.error(f"failed saving error: {e}")
    if result is None:
        return None

    return result


async def publish_graph_away(graph: Graph, graph_id: PyObjectId):
    # client = MongoDBClient()
    result = WakilAgent(graph)
    print(result)


async def retrieve_user_statistics(user_id: PyObjectId) -> Dict[str, Any]:
    client = MongoDBClient()
    nb_agents = await client.get_many_user_id(Agent, user_id)
    nb_sessions = await client.get_many_user_id(Session, user_id)

    return {"nb_sessions": len(nb_agents), "nb_agents": len(nb_sessions)}


async def fetch_chart_data_from_db(user_id: PyObjectId) -> UserDataResponse:
    """
    Fetch User Agent and Session Creation from account creation till now
    Problem is Chart will become saturated
    Implement a way to cut data and retrieve only 100th latest dates
    """
    try:
        client = MongoDBClient()
        agents = await client.get_many_user_id(Agent, user_id)
        sessions = await client.get_many_user_id(Session, user_id)

        # Create a dictionary to store the chart data
        chart_data_dict = {}

        # Iterate over sessions to create a dictionary with date as key
        for session in sessions:
            date = session["created_at"].date().isoformat()
            if date not in chart_data_dict:
                chart_data_dict[date] = {"sessions": 0, "agents": 0}
            chart_data_dict[date]["sessions"] += 1

        # Iterate over agents to add to the dictionary
        for agent in agents:
            date = agent["created_at"].date().isoformat()
            if date not in chart_data_dict:
                chart_data_dict[date] = {"sessions": 0, "agents": 0}
            chart_data_dict[date]["agents"] += 1

        # Convert the dictionary to a list of ChartData objects
        chart_data = [
            ChartData(
                date=date, sessions=data["sessions"], agents=data["agents"]
            )
            for date, data in chart_data_dict.items()
        ]

        # Sort the chart data by date
        chart_data.sort(key=lambda x: x.date)

        # logger.info(chart_data)
        return UserDataResponse(chart_data=chart_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
