from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.stripe.router import router as stripe_router
from src.api.views import router as api_router
from src.cloud.router import router as cloud_router
from src.core.settings import settings
from src.db.qdrant import close_qdrant, init_qdrant
from src.db.utils import get_mongodb_client
from src.security.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    client = get_mongodb_client()
    db = client.get_database(settings.MONGO_DB_DB)
    app.mongodb = db

    await init_qdrant()

    try:
        yield
    finally:
        # Close MongoDB connection
        client.close()
        # Close Qdrant connection
        await close_qdrant()


app = FastAPI(lifespan=lifespan)
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(cloud_router)
app.include_router(stripe_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"Hello: ": "Project"}
