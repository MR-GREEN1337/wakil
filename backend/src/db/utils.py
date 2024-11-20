from loguru import logger
from motor.motor_asyncio import AsyncIOMotorClient

from ..core.settings import MONGODB_MAXPOOLSIZE, MONGODB_MINPOOLSIZE, settings


def get_mongodb_client() -> AsyncIOMotorClient:
    """Get MongoDB client instance"""
    try:
        db = AsyncIOMotorClient(
            settings.MONGO_DB_URL,
            maxPoolSize=MONGODB_MAXPOOLSIZE,
            minPoolSize=MONGODB_MINPOOLSIZE,
            uuidRepresentation="standard",
        )
        logger.info("MongoDB Connexion established!")
        return db

    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise e
