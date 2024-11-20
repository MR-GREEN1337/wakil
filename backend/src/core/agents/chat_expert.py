from functools import partial
from typing import List

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import MessagesState

from src.api.models import ChatResponse, EditorCanvasTypes, Graph
from src.core.agents.utils import pretty_print_graph
from src.core.settings import settings


def create_graph_expert_agent(prompt: str, graph: Graph, messages: List[str]):
    """
    Create a LangGraph agent configured with a given prompt and model from ChatGroq.

    Args:
        prompt (str): The prompt to initialize the LangGraph agent with.
        graph (Graph): The current graph state for the agent.
        messages (List[str]): History of user messages for better context.

    Returns:
        LangGraph Agent: Compiled LangGraph agent.
    """
    pretty_graph = pretty_print_graph(graph)
    possible_nodes = ", ".join(list(EditorCanvasTypes.__args__))

    # Concatenate history messages
    conversation_history = "\n".join(
        f"{'User' if i % 2 == 0 else 'Expert'}: {msg}"
        for i, msg in enumerate(messages)
    )

    prompt_template = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                f"You are a helpful AI assistant, an expert in helping users build and modify their own AI agents. YOU HAVE NO POWER TO MODIFY IT, YOU JUST GIVE ADVICE"
                f"Be friendly and helpful, don't jam usr with this complicated data, try to simplify it."
                f" An AI Agent consists of nodes connected by edges to form a graph, which is used to perform actions."
                f" Based on the user's request, current graph state (nodes and edges), and the details provided,"
                f" If user asks graph related data, suggest nodes and edges to add, modify, or remove to fulfill the user's request."
                f" If you are unable to fully answer, just say so."
                f"You are the only hope to save these wary travelers and help them to reach their destination. by helping them to build their own functional AI agents."
                f"KEEP QUESTIONS AS SHORT AS CAN BE, DON'T REPEAT FACTS, MAKE IT AS SIMPLE AS POSSIBLE, YOU ARE EXPERIENCING WITH VERY LIMITED TIME SO THESE HUMANS CAN SURVIVE."
                f"DON'T TRY TO BUILD A GRAPH BY GIVING JSON, JUST STATE NODES TO ADD, MODIFY, OR REMOVE AND EDGES IF NEEDED."
                f"If user asked for a specific node or edge or their count, and your answer is wrong to them, tell them if they have made modifications, AND TELL THEM TO SAVE the workflow so that I can see it."
                f"HERE ARE SOME RULES IN CONNECTING NODES USING EDGES: DATA NODES SUCH AS URL SCRAPER AND WIKIPEDIA ARE ONLY CONNECTED TO VECTOR DATABASED SUCH AS PINECONE AND QDRNT"
                f"\nCurrent Graph State:\n{pretty_graph}\nPossible Nodes To choose from: {possible_nodes}\nHuman Prompt, THIS IS THE QUESTION YOU SHOULD RESPOND TO: {prompt}",
            ),
            ("user", f"{conversation_history}"),
        ]
    )

    llm = ChatGroq(
        model="llama-3.1-70b-versatile", api_key=settings.GROQ_API_KEY
    )

    return prompt_template | llm


def agent_node(state, agent):
    result = agent.invoke(state)

    return {"messages": result}


def build_graph(prompt: str, graph: Graph, messages: List[str]):
    workflow = StateGraph(MessagesState)
    workflow.add_node(
        "Expert",
        partial(
            agent_node,
            agent=create_graph_expert_agent(
                prompt=prompt, graph=graph, messages=messages
            ),
        ),
    )
    workflow.add_edge(START, "Expert")
    workflow.add_edge("Expert", END)
    graph = workflow.compile()

    return graph


async def chat_expert(
    graph: Graph, prompt: str, history_messages: List[str]
) -> ChatResponse:
    expert = build_graph(prompt=prompt, graph=graph, messages=history_messages)
    res = await expert.ainvoke({"messages": [("human", prompt)]})

    return res["messages"][1].content
