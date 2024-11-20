from typing import (
    Annotated,
    Any,
    Dict,
    List,
    Literal,
    Optional,
    Type,
)

from langgraph.graph.message import add_messages
from loguru import logger
from typing_extensions import TypedDict

from src.api.models import Agent


class BaseAgentState(TypedDict):
    messages: Annotated[list, add_messages]


class GraphStateManager:
    """
    Build state based on agents's tools and graph structure.
    """

    def __init__(self, agent: Agent):
        """
        Initialize the GraphStateManager with the agent's graph structure.
        """
        self.graph = agent.graph

    def build_state(self) -> TypedDict:  # type: ignore
        """
        Build the state of the agent from the graph, compatible with LangGraph.
        add something like this
        MessagesPlaceholder(variable_name="messages"),
        """

        class AgentState(BaseAgentState):
            pass

        # Analyze the graph structure and add fields based on node types
        for node in self.graph.nodes:
            if node.type == "Pinecone" or node.type == "Qdrant":
                AgentState.__annotations__["vector_store"] = Optional[
                    Dict[str, Any]
                ]
            elif node.type == "URL Scraper":
                AgentState.__annotations__["scraped_data"] = Optional[
                    List[str]
                ]
            elif node.type == "File Upload":
                AgentState.__annotations__["uploaded_files"] = Optional[
                    List[str]
                ]
            elif node.type in ["GPT-4o", "GPT-o1"]:
                AgentState.__annotations__["llm_config"] = Optional[
                    Dict[str, Any]
                ]
            # Add more conditions for other node types as needed

        return AgentState

    def initialize_state(self) -> TypedDict:  # type: ignore
        """
        Create an instance of the dynamic state class with default values.
        Probably useless
        """
        StateClass = self.build_state()
        initial_state: StateClass = StateClass(messages=[])  # type: ignore

        # Initialize optional fields with None
        for field in StateClass.__annotations__:
            if field != "messages":
                initial_state[field] = None

        return initial_state


LLMNodes = Literal[
    "GPT-4o",
    "GPT-o1",
]


from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from typing_extensions import TypedDict


async def build_agent_prompt(
    agent: Agent,
    state_class: Type[TypedDict],  # type: ignore
) -> ChatPromptTemplate:
    """
    Build a comprehensive prompt for the agent based on its properties, graph structure, and state.

    Args:
        agent (Agent): The agent object containing all relevant information.
        state_class (Type[TypedDict]): The state class generated by GraphStateManager.

    Returns:
        ChatPromptTemplate: A well-structured prompt template for the agent.
    """
    from src.core.agents.state import LLMNodes

    # Extract basic agent information
    agent_name = agent.title
    agent_description = agent.description

    # Find the LLM node
    llm_node = next(
        (
            node
            for node in agent.graph.nodes
            if node.data.title in list(LLMNodes.__args__)
        ),
        None,
    )
    if not llm_node:
        raise ValueError("No LLM node found in the graph")

    # Extract LLM-specific prompt if available
    llm_prompt = llm_node.data.metadata.get(
        "prompt", "You are a helpful assistant"
    )

    # Analyze graph structure
    node_types = [node.type for node in agent.graph.nodes]
    edge_count = len(agent.graph.edges)

    # Analyze state structure
    state_fields = list(state_class.__annotations__.keys())
    logger.info(f"State fields: {state_fields}")

    # Build the system message
    system_message_parts = [
        f"You are {agent_name}, an AI agent with the following purpose: {agent_description}",
        f"Your base capabilities are defined as: {llm_prompt}",
        f"You have access to the following types of nodes: {', '.join(set(node_types))}",
        f"Your knowledge graph consists of {len(agent.graph.nodes)} nodes and {edge_count} connections.",
        f"Your state contains the following fields: {', '.join(state_fields)}",
        "Your task is to utilize your capabilities, the provided graph structure, and your current state to assist users effectively.",
        "Always consider the context of the user's query, your current state, and leverage the appropriate nodes in your responses.",
        "If you need to access specific information or perform certain actions, mention the relevant node types you would use.",
        "Maintain a professional and helpful demeanor while adhering to ethical guidelines and user privacy.",
    ]

    # Add specific instructions based on node types and state fields
    if "URL Scraper" in node_types:
        system_message_parts.append(
            "You can access web content. When referring to online information, specify that you're using the URL Scraper."
        )
    if "messages" in state_fields:
        system_message_parts.append(
            "You have access to the conversation history. Use this to maintain context throughout the interaction."
        )
    if "vector_store" in state_fields:
        system_message_parts.append(
            "You can access and update the vector store in your state. Use this for maintaining and querying embedded information."
        )
    if "scraped_data" in state_fields:
        system_message_parts.append(
            "You have access to scraped data in your state. Refer to this when providing information from web sources."
        )
    if "uploaded_files" in state_fields:
        system_message_parts.append(
            "You can access information about uploaded files. Use this when discussing or analyzing user-provided documents."
        )
    if "llm_config" in state_fields:
        system_message_parts.append(
            "You have access to LLM configuration. You can adjust your behavior based on this configuration if needed."
        )

    # Add instructions for state management
    system_message_parts.append(
        "Remember to update your state appropriately as you process information and interact with the user."
    )
    system_message_parts.append(
        "When referring to or using information from your state, specify which state field you're utilizing."
    )

    # Combine all system message parts
    system_message = "\n\n".join(system_message_parts)

    # Create the ChatPromptTemplate
    prompt_template = ChatPromptTemplate.from_messages(
        [
            ("system", system_message),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{input}"),
        ]
    )

    return prompt_template
