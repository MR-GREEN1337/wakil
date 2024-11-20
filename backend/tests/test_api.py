from unittest.mock import AsyncMock, patch

import pytest
from bson import ObjectId

from src.api.crud import create_new_graph
from src.api.models import GraphCreateForm


@pytest.mark.asyncio
@patch("src.api.crud.MongoDBClient")
async def test_create_new_graph(mock_mongo_client):
    # Mocking MongoDB Client and its methods
    mock_mongo = AsyncMock()
    mock_mongo_client.return_value = mock_mongo

    # Mock the insert result
    inserted_id = ObjectId()
    mock_mongo.insert.return_value.inserted_id = inserted_id

    # Mock the graph retrieval after insertion
    mock_mongo.get.return_value = {
        "_id": inserted_id,
        "title": "Test Graph",
        "description": "Graph description",
        "outlines": ["Outline 1", "Outline 2"],
        "user_id": ObjectId(),
    }

    # Sample user_id and graph data
    user_id = ObjectId()
    graph_data = GraphCreateForm(
        title="Test Graph",
        description="Graph description",
        outlines=["Outline 1", "Outline 2"],
    )

    # Call the function
    result = await create_new_graph(graph_data, user_id)

    # Assertions
    mock_mongo.insert.assert_called_once()
    mock_mongo.get.assert_called_once_with("agents", inserted_id)

    assert result.title == "Test Graph"
    assert result.description == "Graph description"
