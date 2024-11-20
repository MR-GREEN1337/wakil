"""
Different methods that help in building an Agent
"""

# Define the function that determines whether to continue or not
import io
import json
from typing import List, Literal, Type, Union

from typing_extensions import TypedDict

from src.api.models import Agent, Edge, Graph, Node
from src.core.agents.nodes import URLScraperNode, WikipediaLoader


def should_continue(state):
    messages = state.messages
    last_message = messages[-1]
    # If there is no function call, then we finish
    if not last_message.tool_calls:
        return "end"
    # Otherwise if there is, we continue
    else:
        return "continue"


def route_tools(state: Type[TypedDict]) -> Literal["tools", "__end__"]:  # type: ignore
    from langgraph.graph import END

    """Determine whether to use tools or end the conversation based on the last message.

    Args:
        state (schemas.State): The current state of the conversation.

    Returns:
        Literal["tools", "__end__"]: The next step in the graph.
    """
    msg = state["messages"][-1]  # type: ignore
    if msg.tool_calls:
        return "tools"

    return END


DataNode = Union[
    URLScraperNode,
    WikipediaLoader,
]


def pretty_print_graph(graph: Graph) -> str:
    """
    Convert the Graph object to a pretty-printed JSON string for better readability.

    Args:
        graph (Graph): The Graph object to serialize.

    Returns:
        str: Pretty-printed JSON string of the Graph object.
    """
    if not graph:
        return "No graph found"
    graph_dict = (
        "nodes: "
        + "\n".join([pretty_print_node(node) for node in graph.nodes])
        + "edges: "
        + "\n".join(
            [pretty_print_edge(edge, graph.nodes) for edge in graph.edges]
        )
    )

    return json.dumps(graph_dict, indent=4)


def pretty_print_node(node: Node) -> str:
    """
    Pretty print a Node object.

    Args:
        node (Node): The Node object to serialize.
    """
    output = f"id: {str(node.id).strip()},type: {str(node.type).strip()},data of node:title: {str(node.data.title).strip()},description: {str(node.data.description).strip()},completed: {str(node.data.completed).strip()},type: {str(node.data.type).strip()}"

    return output


# "metadata": {str(node.data).metadata},


def pretty_print_edge(edge: Edge, nodes: List[Node]) -> str:
    """
    Pretty print an Edge object.

    Args:
        edge (Edge): The Edge object to serialize.
    """
    node_source = [
        node.data.title for node in nodes if node.id == edge.source
    ][0]
    node_target = [
        node.data.title for node in nodes if node.id == edge.target
    ][0]
    output = f"node {node_source} is connected to node {node_target}"
    return output


# ------------------- Tests to validate Agent's structure -------------------
async def validate_agent_connections(agent: Agent):
    """
    Validate if agent is well connected
    """
    from src.core.agents.state import LLMNodes as LLMNodesTypes

    nodes = agent.graph.nodes
    edges = agent.graph.edges

    # Retrieve data and vector nodes
    data_nodes = [
        node
        for node in nodes
        if node.type in ["URL Scraper", "Wikipedia Search", "File Upload"]
    ]
    vector_db_nodes = [
        node for node in nodes if node.type in ["Pinecone", "Qdrant"]
    ]
    llm_node = [
        node for node in nodes if node.type in list(LLMNodesTypes.__args__)
    ]

    if len(nodes) != len(edges) + 1:
        raise GraphValidationError("Graph is not connected")
    if len(llm_node) != 1:
        raise GraphValidationError(
            "There should be only one LLM node in the graph"
        )
    if len(data_nodes) < 1:
        raise GraphValidationError(
            "There should be at least one data node in the graph"
        )
    if len(vector_db_nodes) < 1:
        raise GraphValidationError(
            "There should be at least one vector db node in the graph"
        )

    # See if order is good, if data is connected to vector db nodes and latter to LLM, using edges
    for data_node in data_nodes:
        connected_nodes = []
        for edge in edges:
            if edge.source == data_node.id:
                connected_nodes.append(edge.target)
        for connected_node in connected_nodes:
            if connected_node not in [node.id for node in vector_db_nodes]:
                raise GraphValidationError(
                    f"Data node {data_node.id} is not connected to a vector db node"
                )

    for vector_db_node in vector_db_nodes:
        connected_nodes = []
        for edge in edges:
            if edge.source == vector_db_node.id:
                connected_nodes.append(edge.target)
        for connected_node in connected_nodes:
            if connected_node not in [
                node_id for node_id in [node.id for node in llm_node]
            ]:
                raise GraphValidationError(
                    f"Vector db node {vector_db_node.id} is not connected to an LLM node"
                )


class GraphValidationError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(self.detail)


# File Processing


async def process_pdf(data: bytes) -> str:
    from PyPDF2 import PdfReader

    """Process PDF data and return extracted text."""

    reader = PdfReader(io.BytesIO(data))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


async def process_docx(data: bytes) -> str:
    from docx import Document

    """Process DOCX data and return extracted text."""

    doc = Document(io.BytesIO(data))
    text = []
    for paragraph in doc.paragraphs:
        text.append(paragraph.text)
    return "\n".join(text)


async def llm_agent(state: Type[TypedDict], executable) -> Type[TypedDict]:  # type: ignore
    prediction = executable.invoke(state)

    return {"messages": [prediction]}
