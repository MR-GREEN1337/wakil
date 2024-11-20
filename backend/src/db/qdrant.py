from loguru import logger
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models

from src.core.settings import settings

qdrant_db = None


async def get_qdrant():
    global qdrant_db

    if qdrant_db is None:
        logger.error("Qdrant is either nt initialized or not available")
    return qdrant_db


async def init_qdrant():
    global qdrant_db

    qdrant_db = AsyncQdrantClient(
        url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY
    )
    try:
        existing_collections = await qdrant_db.get_collections()
        logger.info(f"Existing collections: {existing_collections}")
        # /!\ Once the collection is created, it cannot be updated
        # To change the underlying embedding model, we need to create a new collection
        # And re-embed all the tasks
        if "user_data" in [
            collection.name for collection in existing_collections.collections
        ]:
            logger.info("Collection tasks already exists")
        else:
            await qdrant_db.create_collection(
                collection_name="user_data",
                vectors_config=models.VectorParams(
                    size=1536, distance=models.Distance.COSINE
                ),
            )
        logger.info("Qdrant initialized")

    except Exception as e:
        logger.error(f"Error initializing Qdrant: {e}")
        await close_qdrant()
        qdrant_db = None


async def close_qdrant():
    global qdrant_db

    if qdrant_db is not None:
        await qdrant_db.close()
    else:
        logger.info("Qdrant is not initialized.")
