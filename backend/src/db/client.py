import importlib
from datetime import datetime, timezone
from typing import Any, Dict, cast

from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from pymongo.results import DeleteResult, InsertOneResult, UpdateResult

from src.api.fields import PyObjectId
from src.api.models import MongoDBModel


class MongoDBClient:
    __instance = None
    mongodb: AsyncIOMotorDatabase

    def __new__(cls) -> "MongoDBClient":
        if cls.__instance is None:
            cls.__instance = super().__new__(cls)
            app = get_current_app()
            cls.__instance.mongodb = app.mongodb  # type: ignore[attr-defined]
        return cls.__instance

    def get_collection(self, model: MongoDBModel) -> AsyncIOMotorCollection:
        collection_name = model.get_collection_name()
        return self.mongodb.get_collection(collection_name)

    async def insert(
        self, model: MongoDBModel, data: dict[str, Any]
    ) -> InsertOneResult:
        collection = self.get_collection(model)
        now = datetime.now(timezone.utc)
        data |= {"created_at": now, "updated_at": now}
        return await collection.insert_one(data)

    async def get(self, model: MongoDBModel, id: str) -> dict[str, Any]:
        collection = self.get_collection(model)
        result = await collection.find_one({"_id": id})
        if result is None:
            return None
        result = cast(dict[str, Any], result)
        return result | {"id": result.pop("_id")}  # _id -> id

    async def get_by_email(
        self, model: MongoDBModel, email: str
    ) -> dict[str, Any]:
        collection = self.get_collection(model)
        result = await collection.find_one({"email": email})
        result = cast(dict[str, Any], result)
        if result is None:
            return None
        return result | {"id": result.pop("_id")}

    async def list(self, model: MongoDBModel) -> list[dict[str, Any]]:
        collection = self.get_collection(model)
        result = collection.find({})
        sessions = []
        async for session in result:
            session = cast(dict[str, Any], session)
            sessions.append(session | {"id": session.pop("_id")})
        return sessions

    async def delete_many(self, model: MongoDBModel) -> DeleteResult:
        collection = self.get_collection(model)
        return await collection.delete_many({})

    async def delete_one(
        self, model: MongoDBModel, id: PyObjectId
    ) -> DeleteResult:
        collection = self.get_collection(model)
        return await collection.delete_one({"_id": id})

    async def update_one(
        self, model: MongoDBModel, id: PyObjectId, data: dict[str, Any]
    ) -> UpdateResult:
        collection = self.get_collection(model)
        data |= {"updated_at": datetime.now()}
        return await collection.update_one({"_id": id}, {"$set": data})

    async def get_by_name_user_email(
        self, model: MongoDBModel, agent: str, email: str
    ) -> dict[str, Any]:
        collection = self.get_collection(model)
        result = await collection.find_one({"name": agent, "email": email})
        if result is None:
            return None
        result = cast(dict[str, Any], result)
        return result | {"id": result.pop("_id")}

    async def get_by_name_user_id(
        self, model: MongoDBModel, agent: str, user_id: PyObjectId
    ) -> dict[str, Any]:
        collection = self.get_collection(model)
        result = await collection.find_one(
            {"title": agent, "user_id": user_id}
        )
        if result is None:
            return None
        result = cast(dict[str, Any], result)
        return result | {"id": result.pop("_id")}

    async def get_many_by_mail(
        self, model: MongoDBModel, id: PyObjectId
    ) -> dict[str, any]:
        collection = self.get_collection(model)
        sessions = []
        async for session in collection.find({"email": id}):
            session = cast(dict[str, any], session)
            sessions.append(session | {"id": session.pop("_id")})
        if sessions is None:
            return None
        return sessions

    async def get_many_user_id(
        self, model: MongoDBModel, id: PyObjectId
    ) -> dict[str, any]:
        collection = self.get_collection(model)
        sessions = []
        async for session in collection.find({"user_id": id}):
            session = cast(dict[str, any], session)
            sessions.append(session | {"id": session.pop("_id")})
        if sessions is None:
            return None
        return sessions

    async def update_image_uri_by_email(
        self, model: MongoDBModel, email: str, image_uri: str
    ) -> dict[str, Any]:
        collection = self.get_collection(model)
        update_data = {"image_uri": image_uri, "updated_at": datetime.now()}
        result = await collection.update_one(
            {"email": email}, {"$set": update_data}
        )

        return result

    async def count_documents(
        self, model: "MongoDBModel", filter: Dict[str, Any]
    ) -> int:
        """
        Count the number of documents that match a filter.

        Args:
            model: The MongoDB model instance.
            filter: The filter criteria.

        Returns:
            The count of documents that match the filter.
        """
        collection = self.get_collection(model)
        return await collection.count_documents(filter)


def get_current_app() -> FastAPI:
    module = importlib.import_module("src.main")
    field = "app"
    return cast(FastAPI, getattr(module, field))
