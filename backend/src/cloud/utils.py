import aiohttp
import boto3
import dill as pickle
from langgraph.graph.state import CompiledStateGraph
from loguru import logger

from src.api.fields import PyObjectId
from src.core.settings import settings


def create_presigned_url(bucket_name, object_name, expiration=360000):
    """Generate a presigned URL to share an S3 object

    :param bucket_name: string
    :param object_name: string
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Presigned URL as string. If error, returns None.
    """

    # Create an asynchronous S3 client
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION_NAME,
    )

    try:
        # Generate a presigned URL for the S3 object
        response = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": object_name},
            ExpiresIn=expiration,
        )
    except boto3.ClientError as e:
        logger.error(e)
        return None

    # The response contains the presigned URL
    return response


async def send_agent_to_cloud(
    agent: "CompiledStateGraph", user_id: PyObjectId, graph_id: PyObjectId
):
    """
    Serialize CompiledStateGraph and send it to S3.
    """
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION_NAME,
    )

    try:
        # Serialize the CompiledStateGraph instance
        serialized_agent = pickle.dumps(agent)

        # Upload to S3
        response = s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=f"agent_{graph_id}_user_{user_id}.pkl",
            Body=serialized_agent,
        )
    except Exception as e:
        logger.error(e)
        return None

    return response


async def fetch_blob_from_s3(url):
    """Fetch blob data from S3 using the presigned URL asynchronously."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.read()  # Returns the blob data
            else:
                raise Exception(
                    f"Failed to fetch blob: {response.status} {await response.text()}"
                )
