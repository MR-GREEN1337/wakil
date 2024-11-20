from typing import Optional

from langchain.tools import Tool
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.llms import OpenAI
from langchain_community.utilities import SQLDatabase
from loguru import logger

from src.api.models import Node


class DBError(Exception):
    """Base exception for database-related errors."""

    pass


class DBConnectionError(DBError):
    """Exception raised for errors in the database connection."""

    pass


class DBQueryError(DBError):
    """Exception raised for errors in executing database queries."""

    pass


class SQLDatabaseNode:
    def __init__(self, node: Node):
        self.node = node
        self.metadata = node.data.metadata
        self.db_connection = None

    def connect_to_db(self) -> Optional[SQLDatabase]:
        try:
            db_type = self.metadata.get("dbType", "").lower()
            host = self.metadata.get("host", "")
            user = self.metadata.get("user", "")
            password = self.metadata.get("password", "")
            db_name = self.metadata.get("dbName", "")
            port = self.metadata.get("port", "")

            if db_type == "mysql":
                connection_string = f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}"
            elif db_type == "postgresql":
                connection_string = (
                    f"postgresql://{user}:{password}@{host}:{port}/{db_name}"
                )
            else:
                error_msg = f"Unsupported database type: {db_type}"
                logger.error(error_msg)
                raise DBConnectionError(error_msg)

            self.db_connection = SQLDatabase.from_uri(connection_string)
            return self.db_connection
        except Exception as e:
            error_msg = f"Error connecting to database: {str(e)}"
            logger.error(error_msg)
            raise DBConnectionError(error_msg)

    def get_sql_agent_tool(self) -> Optional[Tool]:
        if not self.db_connection:
            logger.warning(
                "Database connection not established. Trying to connect..."
            )
            self.connect_to_db()  # This will raise DBConnectionError if it fails

        try:
            llm = OpenAI(
                temperature=0
            )  # You can adjust the LLM and its parameters as needed
            toolkit = SQLDatabaseToolkit(db=self.db_connection, llm=llm)

            agent_executor = create_sql_agent(
                llm=llm,
                toolkit=toolkit,
                verbose=True,
                agent_type="zero-shot-react-description",
            )

            def sql_agent_tool(query: str) -> str:
                try:
                    result = agent_executor.run(query)
                    return result
                except Exception as e:
                    error_msg = f"Error executing SQL query: {str(e)}"
                    logger.error(error_msg)
                    raise DBQueryError(error_msg)

            return Tool(
                name="SQLDatabaseTool",
                func=sql_agent_tool,
                description="A tool to interact with SQL databases using natural language queries. Use this for database-related questions or operations.",
            )
        except Exception as e:
            error_msg = f"Error creating SQL agent tool: {str(e)}"
            logger.error(error_msg)
            raise DBError(error_msg)
