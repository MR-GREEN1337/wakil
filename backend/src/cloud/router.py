import os
import uuid

import boto3
from fastapi import APIRouter, Depends, File, UploadFile
from loguru import logger

from src.api.fields import PyObjectId
from src.cloud.utils import create_presigned_url
from src.core.settings import settings
from src.security.oauth import get_current_user

router = APIRouter(prefix="/cloud", tags=["Cloud"])


@router.post(
    "/user-image-upload", description="Upload User image to AWS S3 Bucket"
)
async def upload_image(
    file: UploadFile = File(...),
    user_id: PyObjectId = Depends(get_current_user),
):
    try:
        # Connect to AWS S3
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME,
        )

        s3_client.upload_fileobj(
            file.file, settings.S3_BUCKET_NAME, file.filename
        )

        # Generate Presigned URL of the uploaded image
        # image_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION_NAME}.amazonaws.com/{file.filename}"
        presigned_image_url = create_presigned_url(
            bucket_name=settings.S3_BUCKET_NAME, object_name=file.filename
        )

        return {"url": presigned_image_url}

    except Exception as e:
        print(e)
        return {"error": str(e)}


@router.post(
    "/file-upload", description="Upload blob (.pdf, .docx or text) to S3"
)
async def upload_file(
    file: UploadFile = File(...),
    user_id: PyObjectId = Depends(get_current_user),
):
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME,
        )

        # Generate a new file name with UUID
        name, extension = os.path.splitext(file.filename)
        filename = f"{name}_{uuid.uuid4().hex}{extension}"

        s3_client.upload_fileobj(file.file, settings.S3_BUCKET_NAME, filename)

        presigned_file_url = create_presigned_url(
            bucket_name=settings.S3_BUCKET_NAME, object_name=filename
        )

        return {"url": presigned_file_url}

    except Exception as e:
        logger.error("Error uploading file to S3")
        return {"error": str(e)}


@router.delete("/file-delete", description="Delete file from S3")
async def delete_file(
    filename: str,
    user_id: PyObjectId = Depends(get_current_user),
):
    file_name = filename.rsplit("/", 1)[-1].split("?", 1)[0]
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME,
        )
        s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=file_name)

        return {"message": "File deleted successfully"}

    except Exception as e:
        logger.error("Error deleting file from S3")
        return {"error": str(e)}
