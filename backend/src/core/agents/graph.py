import functools
from typing import Dict, List, Optional, Type, TypedDict

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import StateGraph
from langgraph.graph.state import CompiledStateGraph
from loguru import logger

from src.api.models import Agent, Edge, EditorCanvasTypes, Node
from src.core.agents.state import build_agent_prompt
from src.core.agents.utils import validate_agent_connections


class WakilAgent:
    """
    Python Client to build an agent that asynchronously constructs a LangGraph
    Logic is to decompose graph into LLM, Tools and memory
    Steps to build that agent:
        1 => Build Data Nodes
        2 => Build Vector DB Nodes + Ingest Data Nodes
        3 => Build Prompt + State + Construct LLM Node
        4 => Connect Nodes

    Building Prompt and State are a tricky part, i need to have a method that takes graph, analyses nodes and produces a prompt that
    represent the goal of the agent

    Regarding the state, we would need elements that hold state of agent, most basic in messages

    Then connect all of that and compile the graph
    """

    async def intialize(self, agent: Agent):
        # Initialize the node clusters
        self.user_id = agent.user_id
        self.graph_id = agent.id
        self.data_nodes: Dict[str, Node] = {}
        self.tools = {}
        self.prompt = ""
        self.llm_node = None
        self.nodes: Optional[List[Node]] = []  # This will store all nodes
        self.edges: Optional[List[Edge]] = agent.graph.model_dump().get(
            "edges", []
        )
        self._node_map = {}  # Maps node IDs to node instances
        self.state: Type[TypedDict] = {}  # type: ignore
        self.compiled_agent = None

        # BEFORE DOING ANYTHING, VALIDATE AGENT STRUCETURE /!\ NEVER TRUST A HUMAN INPUT
        await self._validate_agent(agent)
        logger.info("Agent is valid!")

        # First Build and cluster Data-related nodes
        await self._build_data_nodes(agent.graph.nodes)
        logger.info("Data nodes are ready!")

        # First Build and cluster Data-related nodes
        await self._build_database_tools(agent.graph.nodes)
        logger.info("Database nodes nodes are ready!")

        # Then Build and cluster Vector DB nodes
        await self._build_vector_db_nodes(agent.graph.nodes)
        logger.info("Vector DB nodes are ready!")

        # Craft a well-suited state for the agent
        await self._build_state(agent)
        logger.info("Agent's state is built")

        # Build prompt given agent and state
        await self._build_prompt(agent)
        logger.info("Prompt Built!")

        # Build LLM Node
        await self._build_llm_node(agent)
        logger.info("LLM node constructed!")

        logger.info("Agent is cooked, let's serve it!")
        # The dish is cooked, let's serve it! However on user's notice
        # await self.build_agent()

    async def _validate_agent(self, agent: Agent):
        """
        Validate the agent structure
        Run rigorous tests to see if the agents stands as valid
        """

        if not agent.graph:
            raise ValueError("Agent graph is missing")

        # List of tests defined on utils
        await validate_agent_connections(agent)
        # ADD MORE ...

    async def _build_llm_node(self, agent: Agent):
        """
        Build the LLM node
        """
        from src.core.agents.nodes import LLMNode
        from src.core.agents.state import LLMNodes as LLMNodesTypes

        llm_node = [
            node
            for node in agent.graph.nodes
            if node.data.title in list(LLMNodesTypes.__args__)
        ]

        if not any(llm_node):
            raise ValueError("No LLM node found in the graph")
        llm_node = llm_node[0]
        llm_node_class = LLMNode()
        await llm_node_class.initialize(llm_node)
        self.llm_node = await llm_node_class.llm()
        # logger.info(llm_node)

    async def _build_state(self, agent: Agent):
        """
        Build the state, take agent and do magic with it
        """
        from src.core.agents.state import GraphStateManager

        try:
            state_manager = GraphStateManager(agent)
            self.state = state_manager.build_state()
        except Exception as e:
            raise ValueError(f"Failed to build state: {str(e)}")

    async def _build_data_nodes(self, nodes_data: List[Node]):
        """
        Build and initialize data nodes.
        """

        nodes_data = [
            node
            for node in nodes_data
            if node.type in ["URL Scraper", "Wikipedia Search", "File Upload"]
        ]

        if not nodes_data:
            raise ValueError("No data nodes found")

        for node_data in nodes_data:
            node_type = node_data.type
            node_class = self._get_node_class(node_type)

            if not node_class:
                raise ValueError(f"Node class for type {node_type} not found")

            try:
                node = node_class(node_data)
                self.data_nodes[node_type] = node
                self._node_map[node_data.id] = node
            except Exception as e:
                raise RuntimeError(
                    f"Failed to initialize node {node_type}: {e}"
                )

    async def _build_database_tools(self, nodes: List[Node]):
        """
            This method is suited for database nodes as tools
            They require specific handling especially with the way of
            interacting with em as tools
            Inputs
                - dbType: str
                - host: str,
                - user: str,
                - password: str,
                - dbName: str,
                - port: str,
        },
        """
        from src.core.agents.connections import DBError, SQLDatabaseNode
        from src.core.agents.models import DatabaseNodes

        db_nodes = [
            node
            for node in nodes
            if node.type in list(DatabaseNodes.__args__)
        ]
        for node in db_nodes:
            # Further in time, We might have different database types, redis for example
            # So we need to check the type of the database and create the appropriate tool
            try:
                sql_db_node = SQLDatabaseNode(node)
                sql_tool = sql_db_node.get_sql_agent_tool()
                if sql_tool:
                    self.tools["SQL DB"] = sql_tool
                    logger.info(f"Added SQL Database Tool for node: {node.id}")
                else:
                    logger.warning(
                        f"Failed to create SQL Database Tool for node: {node.id}"
                    )
            except DBError as e:
                logger.error(f"Database error for node {node.id}: {str(e)}")
                # You might want to handle this error, e.g., skip this node or set a flag
            except Exception as e:
                logger.error(f"Unexpected error for node {node.id}: {str(e)}")
                # Handle unexpected errors

    async def _build_vector_db_nodes(self, nodes: List[Node]):
        """
        Build and initialize vector database nodes.
        """
        vector_db_nodes = [
            node for node in nodes if node.type in ["Pinecone", "Qdrant"]
        ]

        if not vector_db_nodes:
            raise ValueError("No vector DB nodes found")

        for node in vector_db_nodes:
            node_type = node.type
            node_class = self._get_node_class(node_type)

            if not self.data_nodes:
                raise ValueError(
                    "No data nodes available for vector DB ingestion"
                )

            if not node_class:
                raise ValueError(f"Node class for type {node_type} not found")

            try:
                node_instance = node_class()
                data = [
                    (await self.data_nodes[node_type].load_data()).strip("\n")
                    for node_type in self.data_nodes.keys()
                ]
                await node_instance.ingest_data(
                    user_id=self.user_id,
                    graph_id=self.graph_id,
                    node_id=node.id,
                    data=data,
                )
                self.tools[node_type] = node_instance
                self._node_map[node.id] = node_instance
            except Exception as e:
                raise RuntimeError(
                    f"Failed to initialize vector DB node {node_type}: {e}"
                )

    async def _build_prompt(self, agent: Agent) -> str:
        """
        Build a prompt that represents the goal of the agent
        Feed initial prompt to LLM that wuold understand it
        """
        self.prompt = await build_agent_prompt(agent, self.state)

    def _get_node_class(self, node_type: EditorCanvasTypes) -> Optional[Type]:
        from src.core.agents.nodes import (
            FileUploadNode,
            GoogleDriveNode,
            LLMNode,
            PineconeNode,
            QdrantNode,
            URLScraperNode,
            WikipediaLoader,
        )

        node_class_mapping = {
            "GPT-4o": LLMNode,
            "GPT-o1": LLMNode,
            "Pinecone": PineconeNode,
            "Qdrant": QdrantNode,
            "Google Drive": GoogleDriveNode,
            "URL Scraper": URLScraperNode,
            "Wikipedia Search": WikipediaLoader,
            "File Upload": FileUploadNode,
        }
        return node_class_mapping.get(node_type)

    async def build_agent(
        self, checkpointer: BaseCheckpointSaver = None
    ) -> CompiledStateGraph:
        """
        For this initial attempt, we only handle connecting data nodes + tools, vector db, and llms
        """
        from langgraph.graph import END
        from langgraph.prebuilt import ToolNode

        from src.core.agents.utils import llm_agent, route_tools

        # Check if llm_node exists before proceeding
        if not self.llm_node:
            raise ValueError(
                "LLM node is missing. Cannot connect nodes without an LLM node."
            )

        # Construct LLM Node
        prompt = self.prompt

        # Do something more intelligent with tools choice
        # Based on tool type, call/build it accordingly
        logger.info(f"Tools: {self.tools.items()}")
        tools = []
        for tool_type, tool in self.tools.items():
            if tool_type == "SQL DB":
                tools.append(tool.get_sql_agent_tool())
            elif tool_type in ["Pinecone", "Qdrant"]:
                tools.append(tool.get_rag_tool())
            # And the list goes on

        binded_tools = ToolNode(tools)
        # Bind tools to the LLM node, Do this on llm_node,
        # Tools are methods of my Tools' Classes that play role of tools
        # Tools for now are just vector db nodes
        self.llm_node.bind_tools(tools)

        self.executable = prompt | self.llm_node

        # Build LLM node Agent
        agent = functools.partial(llm_agent, executable=self.executable)
        # agent = await llm_agent(self.state, self.executable)
        # Build agent workflow, return the compiled workflow
        # (assuming there's some final step to compile and return the workflow)
        workflow = StateGraph(self.state)
        workflow.add_node("llm", agent)
        workflow.add_node("tools", binded_tools)
        workflow.set_entry_point("llm")

        # Add edges to connect LLM and tool nodes
        workflow.add_edge("llm", "tools")
        workflow.add_conditional_edges("llm", route_tools, ["tools", END])
        workflow.add_edge("tools", "llm")

        self.compiled_agent = workflow.compile(checkpointer=checkpointer)

        return self.compiled_agent

    async def draw_agent(self):
        """
        Draw the agent
        Use mermaid method to draw agent, maybe display it on frontend
        instead publish it to S3
        """
        from PIL.Image import Image

        try:
            if not self.compiled_agent:
                raise ValueError("Agent is not compiled yet")
            image = Image(
                self.compiled_agent.get_graph(xray=True).draw_mermaid_png()
            )
            with open("graph.png", "wb") as png:
                png.write(image.data)
        except Exception as e:
            print(e)

    def __repr__(self):
        return (
            f"Graph(nodes={self.nodes}, edges={self.edges}, "
            f"data_nodes={self.data_nodes}, vector_db_nodes={self.tools['vector_db_nodes']}, "
            f"llm_nodes={self.llm_nodes})"
        )
