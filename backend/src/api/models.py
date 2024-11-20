from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)

from .fields import PyObjectId


class MongoDBModel(BaseModel):
    class Meta:
        collection_name: str

    id: PyObjectId
    created_at: datetime
    updated_at: datetime

    @classmethod
    def get_collection_name(cls) -> str:
        return cls.Meta.collection_name


class UpdateImageModel(BaseModel):
    image_uri: str


#################### User Schemas ########################


class User(MongoDBModel):
    class Meta:
        collection_name = "users"

    firstname: str
    lastname: str
    email: EmailStr
    password: str
    image_uri: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    current_period_end: Optional[datetime] = None


class UserDataStripe(BaseModel):
    firstname: str
    lastname: str
    email: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    current_period_end: Optional[datetime] = None


class UserData(BaseModel):
    firstname: str
    lastname: str
    password: str
    email: str


class UserInfo(BaseModel):
    firstname: str
    lastname: str
    email: str
    created_at: Any
    updated_at: Any
    image_uri: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserTooltip(BaseModel):
    id: PyObjectId
    name: str
    image: str


#################### Session Schemas ########################


class SessionUser(BaseModel):
    user: str = Field(max_length=30)
    flag: str = Literal["admin", "spectator"]


class SessionStart(BaseModel):
    title: str
    user: SessionUser
    max_session_users: int
    agent: Optional[str]
    outline: str
    session_started: bool = False


class SessionAgent(BaseModel):
    id: PyObjectId
    state: Optional[dict[str, Any]] = None
    outline: str


class Session(MongoDBModel):
    class Meta:
        collection_name = "sessions"

    title: str
    max_session_users: int = 3
    session_started: bool = False
    users: list[SessionUser]
    agent: Optional[SessionAgent]  # SessionAgent
    players_joined: int = 0
    user_id: PyObjectId
    finished_at: datetime | None | str = None


#################### Agent Schemas ########################

EditorCanvasTypes = Literal[
    "GPT-4o",
    "GPT-o1",
    #    "Pinecone",
    "Qdrant",
    "File Upload",
    "URL Scraper",
    "Wikipedia Search",
    "Google Drive",
    "SQL DB",
    "Notion",
    "Custom Webhook",
    "Google Calendar",
    "Trigger",
    "Action",
    "Wait",
    "Condition",
    "AWS Bedrock",
    "Email",
    "Docker",
    "Webhook",
]

DataNodes = Literal[
    "File Upload",
    "URL Scraper",
    "Google Drive",
]

S3Nodes = Literal["File Uplaod"]

VectorDatabaseNodes = Literal[
    "Pinecone",
    "Qdrant",
]


class NodePosition(BaseModel):
    x: int | float
    y: int | float


class EditorCanvasCardData(BaseModel):
    title: str
    description: str
    completed: bool
    currrent: bool = False
    metadata: dict
    type: EditorCanvasTypes


class NodeMeasures(BaseModel):
    height: int | float
    width: int | float


class Node(BaseModel):
    id: str
    type: EditorCanvasTypes  # Should be one of the EditorCanvasTypes
    position: NodePosition
    measured: NodeMeasures
    data: EditorCanvasCardData
    selected: Optional[bool] = False
    dragging: Optional[bool] = False


class Edge(BaseModel):
    id: str
    source: str
    sourceHandle: str  # noqa: N815
    target: str


class Graph(BaseModel):
    nodes: List[Node] = []
    edges: List[Edge] = []


class GraphCreateForm(BaseModel):
    title: str
    description: str
    outlines: list[str]


class Publish(BaseModel):
    """
    Model for storing publishing states
    """

    published: bool = False
    last_published: Optional[datetime] = None
    publish_count: int = 0


class Agent(MongoDBModel):
    class Meta:
        collection_name = "agents"

    title: str
    description: str
    outlines: list[str]
    graph: Optional[Graph] = None
    user_id: PyObjectId
    publish: Publish = Publish()


class AgentValidate(BaseModel):
    title: str
    description: str
    outlines: list[str]
    graph: Optional[Graph] = None
    user_id: PyObjectId
    publish: Publish = Publish()

    @field_validator("title")
    @classmethod
    def check_title(cls, v):
        if len(v) < 1:
            return "Untitled"
        return v.title()

    @field_validator("description")
    @classmethod
    def check_description(cls, v):
        if len(v) < 1:
            return "New Description"
        return v.title()

    @field_validator("outlines")
    @classmethod
    def check_outline(cls, v):
        if len(v) < 1:
            return ["Chat"]
        return v


class ChartData(BaseModel):
    date: str
    sessions: int
    agents: int


class UserDataResponse(BaseModel):
    chart_data: List[ChartData]


#############################Miscelleanous###########################################


class ChatResponse(BaseModel):
    message: str


class ChatHistory(BaseModel):
    messages: List[str]
