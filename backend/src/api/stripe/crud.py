import logging
from typing import Optional

from fastapi import HTTPException

from src.api.fields import PyObjectId
from src.api.models import User
from src.db.client import MongoDBClient

# Initialize logger
logger = logging.getLogger(__name__)


async def get_user_from_id(user_id: PyObjectId) -> Optional[User]:
    """
    Retrieves a user from the database by their ID.

    Args:
    user_id (PyObjectId): The ID of the user to retrieve.

    Returns:
    Optional[UserInfo]: The user's information, or None if not found.

    Raises:
    HTTPException: If the user ID is invalid or the database query fails.
    """

    try:
        # Initialize MongoDB client
        client = MongoDBClient()

        # Retrieve user from database
        user: User = await client.get(User, user_id)

        # If user is not found, return None
        if not user:
            logger.info(f"User not found with ID {user_id}")
            return None

        # Return user information
        return user

    except Exception as e:
        # Log error and raise HTTP exception
        logger.error(f"Error retrieving user with ID {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
