import functools
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List

import openai
from langchain.schema import Document
from langchain.tools import Tool
from langchain_community.chat_models import ChatAnthropic
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_openai import ChatOpenAI
from loguru import logger

from src.api.fields import PyObjectId
from src.api.models import Node
from src.cloud.utils import fetch_blob_from_s3
from src.core.settings import settings
from src.db.qdrant import get_qdrant, models


class LLMUnSupportedError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(self.detail)


class LLMNode:
    """
    Initialize an LLM based on user input
    Depending on node type, Call the appropriate LLM
    Take already developed prompt and feed it
    """

    async def initialize(self, llm_node: Node):
        # WIP: Depending on sender node, build prompt and stuff accordingly
        self.llm_node: Node = llm_node
        self.node = None
        self._initialize_node()

    def _initialize_node(self):
        temperature = self.llm_node.data.metadata.get(
            "temperature", 0.7
        )  # Default temperature if not specified

        # Based on LLM Type, call Appropriate LangChain constructor
        llm_type = self.llm_node.type

        if llm_type.startswith("GPT"):
            self._initialize_openai(temperature)
        elif llm_type.startswith("Claude"):
            self._initialize_anthropic(temperature)
        else:
            raise ValueError(f"Unsupported LLM type: {llm_type}")

    def _initialize_openai(self, temperature):
        partial_openai = functools.partial(
            ChatOpenAI,
            temperature=temperature,
            openai_api_key=settings.OPENAI_API_KEY,
        )
        if self.llm_node.type == "GPT-4":
            self.node = partial_openai(model="gpt-4")
        elif self.llm_node.type == "GPT-3.5-turbo":
            self.node = partial_openai(model="gpt-3.5-turbo")
        elif self.llm_node.type == "GPT-4o":
            self.node = partial_openai(model="gpt-4o mini")

        else:
            raise LLMUnSupportedError(
                f"Unsupported OpenAI model: {self.llm_node.type}"
            )

    def _initialize_anthropic(self, temperature):
        """
        Change Model Names both for anthropic and openai
        """
        if self.llm_node.type == "Claude-2":
            model = "claude-2"
        elif self.llm_node.type == "Claude-1":
            model = "claude-1"
        else:
            raise ValueError(
                f"Unsupported Anthropic model: {self.llm_node.type}"
            )

        self.node = ChatAnthropic(
            temperature=temperature,
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            model=model,
        )

    async def llm(self):
        """
        Return LLM Node
        """
        return self.node


class GoogleDriveNode:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Additional initialization specific to Google Drive nodes


# Data Nodes
class BaseNode(ABC):
    """Base class for all node types"""

    def __init__(self, node):
        self.node = node


class BaseDataNode(BaseNode):
    """Base class for all data node types"""

    def __init__(self, node: Node):
        self.node = node

    @abstractmethod
    async def load_data(self):
        """Abstract method to load data"""
        pass

    @staticmethod
    def _format_output(content):
        """Format the output to a standardized string"""
        if isinstance(content, list):
            return "\n".join(
                doc.page_content
                for doc in content
                if isinstance(doc, Document)
            )
        elif isinstance(content, str):
            return content
        else:
            raise ValueError("Unsupported content type")


class URLScraperNode(BaseDataNode):
    """URL Scraper Node"""

    def __init__(self, node):
        super().__init__(node)
        self.url = node.data.metadata.get("urlSearch")
        if not self.url:
            raise ValueError("No URL found in metadata in URLScraper Node.")

    async def load_data(self):
        """Load data from URL"""
        try:
            loader = WebBaseLoader(self.url)
            content = loader.load()
            return self._format_output(content)
        except Exception as e:
            logger.error(f"Error loading data from URL: {e}")
            raise ValueError(f"Error loading data from URL: {self.url}")


class WikipediaLoader(BaseDataNode):
    """Wikipedia Loader Node"""

    def __init__(self, node):
        super().__init__(node)
        self.query = node.data.metadata.get("query")
        if not self.query:
            raise ValueError(
                "No query found in metadata in WikipediaLoader Node."
            )

    async def load_data(self):
        """Load data from Wikipedia"""
        try:
            loader = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())
            content = loader.run(tool_input=self.query)
            return self._format_output(content)
        except Exception as e:
            logger.error(f"Error loading data from Wikipedia: {e}")
            raise ValueError(
                f"Error loading data from Wikipedia for query: {self.query}"
            )


class FileUploadNode(BaseDataNode):
    """File Upload Node for retrieving blobs from AWS S3"""

    async def load_data(self):
        """Retrieve and process data from S3 presigned url"""
        url = self.node.data.metadata.get("url")
        if not url:
            raise ValueError("No URL found in metadata in FileUpload Node.")

        try:
            data = await fetch_blob_from_s3(url)
            content = await self._process_file(url, data)
            return self._format_output(content)
        except Exception as e:
            logger.error(f"Error loading data from S3: {e}")
            raise ValueError(f"Error loading data from S3: {url}")

    @staticmethod
    async def _process_file(url: str, data):
        """Process the file based on its type"""
        from src.core.agents.utils import process_docx, process_pdf

        # Retrieve file from url
        file_type = url.rsplit("/", 1)[-1].split("?", 1)[0]

        logger.info(file_type)
        if file_type.endswith(".pdf"):
            return await process_pdf(data)
        elif file_type.endswith(".docx"):
            return await process_docx(data)
        elif file_type.endswith(".txt"):
            return data.decode("utf-8")
        else:
            raise ValueError(
                "Unsupported file type. Only PDF, DOCX, and TXT are allowed."
            )


# Vector DB Nodes
class BaseVectorDBNode(ABC):
    """
    Abstract base class for a vector database node.
    Defines the common interface for ingesting data and querying the database.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @abstractmethod
    async def ingest_data(
        self,
        data: List[Dict[str, str]],
        user_id: PyObjectId,
        graph_id: PyObjectId,
        node_id: PyObjectId,
    ) -> List[int]:
        """
        Ingests data into the vector database by computing vector representations.

        Args:
            data (List[Dict[str, str]]): A list of dictionaries where keys are identifiers and values are the text to be vectorized.
            user_id (PyObjectId): The ID of the user ingesting the data.
            graph_id (PyObjectId): The ID of the graph to which the data belongs.
            node_id (PyObjectId): The ID of the node in the graph.

        Returns:
            List[int]: A list of blob IDs that were successfully ingested.
        """
        pass

    @abstractmethod
    async def query_db(self, query: str) -> List[Dict]:
        """
        Queries the vector database to retrieve the most relevant results based on the input query.

        Args:
            query (str): The query string to be vectorized and searched.

        Returns:
            List[Dict]: A list of dictionaries containing the most relevant results.
        """
        pass

    def get_rag_tool(self) -> "Tool":
        """
        Returns a tool for performing Retrieval-Augmented Generation (RAG).

        This is a common utility that can be used across different vector databases.

        Returns:
            Tool: A tool that queries the vector database and returns formatted results.
        """

        async def rag_tool(query: str) -> str:
            results = await self.query_db(query)
            if not results:
                return "No relevant information found."

            # Process and format the results
            formatted_results = []
            for result in results:
                formatted_result = f"Content: {result['payload'].get('content', 'No content available')}\n"
                formatted_results.append(formatted_result)

            return "\n\n".join(formatted_results)

        return Tool(
            name=f"{self.__class__.__name__}RAGTool",
            func=rag_tool,
            description=f"A tool to retrieve relevant information from the {self.__class__.__name__} vector database based on a given query.",
        )


class QdrantNode(BaseVectorDBNode):
    async def ingest_data(
        self,
        data: List[Dict[str, str]],  # List of different data sources
        user_id: PyObjectId,
        graph_id: PyObjectId,
        node_id: PyObjectId,
    ):
        """
        Ingest data into Qdrant database by computing vector representations.
        A blob is a datum that is either URL Scraped, file upload, etc

        Args:
            data (Dict[str, str]): A dictionary where keys are identifiers and values are the text to be vectorized.

        Returns:
            List[int]: A list of user blob IDs that were successfully ingested.
        """
        logger.info(f"Vectorizing {node_id}'s data and adding them to Qdrant")
        qdrant_db = await get_qdrant()
        if qdrant_db is None:
            return []

        openai_client = openai.AsyncClient(api_key=settings.OPENAI_API_KEY)
        try:
            embeddings = await openai_client.embeddings.create(
                input=list(datum for datum in data),
                model="text-embedding-3-small",
            )
            # logger.info(embeddings)
            embeddings = embeddings.data
        except openai.APIError as e:
            logger.warning(f"Error while embedding the blob: {e}")
            return []

        try:
            # logger.info(data)
            await qdrant_db.upsert(
                collection_name="user_data",
                points=[
                    models.PointStruct(
                        id=str(node_id),
                        vector=embedding.embedding,
                        payload={
                            "user_id": str(user_id),
                            "graph_id": str(graph_id),
                            "node_id": node_id,
                            "created_at": datetime.now().isoformat(),
                            # "metadata": self.metadata,
                        },
                    )
                    # Fix error:'list' object has no attribute 'keys'
                    for key, embedding in zip(
                        [datum for datum in data], embeddings
                    )
                ],
            )
        except Exception as e:
            logger.warning(f"Error while adding the user data to Qdrant: {e}")
            return []

    async def query_db(self, query: str) -> List[Dict]:
        """
        RAG Tool for an Agent
        Query the Qdrant database to retrieve the most relevant results based on the input query.

        Args:
            query (str): The query string to be vectorized and searched.
            node_id (str): The node ID to filter the search results.
            top_k (int): The number of top results to retrieve. Default is 5.

        Returns:
            List[Dict]: A list of dictionaries containing the most relevant results.
        """
        logger.info(
            f"Querying Qdrant with query: {query} and node_id: {self.node_id}"
        )
        qdrant_db = await get_qdrant()
        if qdrant_db is None:
            return []

        openai_client = openai.AsyncClient()
        try:
            embedding_response = await openai_client.embeddings.create(
                input=query, model="text-embedding-ada-002"
            )
            query_embedding = embedding_response["data"][0]["embedding"]
        except openai.APIError as e:
            logger.warning(f"Error while embedding the query: {e}")
            return []

        try:
            search_result = await qdrant_db.search(
                collection_name="user_data",
                query_vector=query_embedding,
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="node_id",
                            match=models.MatchValue(value=self.node_id),
                        )
                    ]
                ),
                limit=5,
            )
            results = [
                {
                    "id": result.id,
                    "score": result.score,
                    "payload": result.payload,
                    "vector": result.vector,
                }
                for result in search_result
            ]
            # logger.info(results)
            return results
        except Exception as e:
            logger.warning(f"Error while querying Qdrant: {e}")
            return []


class PineconeNode(BaseVectorDBNode):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Additional initialization specific to Pinecone nodes
