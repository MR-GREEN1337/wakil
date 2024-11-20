import logging
import random

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError

from src.api.fields import PyObjectId
from src.api.models import User, UserData
from src.db.client import MongoDBClient

from .hashing import Hash
from .jwttoken import create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Initialize logger
logger = logging.getLogger(__name__)


async def get_user_by_id(id: PyObjectId) -> User | None:
    client = MongoDBClient()
    user_data = await client.get(User, id)  # type: ignore[arg-type]
    if user_data is None:
        return None
    result = User(**user_data)

    return result


@router.post("/register")
async def create_user(request: UserData):
    try:
        # Validate request data
        user_data = request.model_dump()

        # Generate random image URI
        random_number = random.randint(1, 11)
        filename = f"/placeholder{random_number}.png"
        user_data |= {"image_uri": filename}

        # Hash password
        hashed_pass = Hash().bcrypt(password=user_data["password"])
        user_data["password"] = hashed_pass

        user_data |= {
            "stripe_customer_id": None,
            "stripe_subscription_id": None,
            "subscription_plan": None,
            "subscription_status": None,
            "current_period_end": None,
            "trial_end": None,
        }

        # Insert user into database
        client = MongoDBClient()
        inserted_result = await client.insert(User, user_data)

        # Return created user
        created_user = await get_user_by_id(inserted_result.inserted_id)
        return JSONResponse(
            content=jsonable_encoder(created_user.model_dump()),
            status_code=status.HTTP_201_CREATED,
        )

    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors()
        )

    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user",
        )


"""# CAPTCHA validation function
RECAPTCHA_SECRET_KEY="6LePz0MqAAAAAKGsA4I7W6QeLNlrRZCOdSYf6PMz"
async def validate_captcha(recaptcha_token: str) -> bool:
    response = requests.post(
        "https://www.google.com/recaptcha/api/siteverify",
        data={
            "secret": RECAPTCHA_SECRET_KEY,
            "response": recaptcha_token,
        },
    )
    result = response.json()

    if not result.get("success"):
        return False
    return True
"""


@router.post("/login")
async def login(request: OAuth2PasswordRequestForm = Depends()):
    # Proceed with the login logic
    client = MongoDBClient()
    user = await client.get_by_email(User, request.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user found with this {request.username} email",
        )

    hash = Hash()
    if not hash.verify(hashed=user["password"], normal=request.password):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wrong Username or password",
        )

    # Create JWT access token after successful authentication
    access_token = create_access_token(data={"sub": str(user["id"])})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify-token/{token}")
async def verify_user_token(token: str):
    _ = await verify_token(token=token)
    return {"message": "Token is valid"}


@router.get(
    "/check-email/{email}",
    description="Check if user's email already exists in db prior to registering",
)
async def verify_email(email: str):
    client = MongoDBClient()
    count = await client.count_documents(User, {"email": email})
    if count > 0:
        return Response(status_code=status.HTTP_409_CONFLICT)
    return Response(status_code=status.HTTP_200_OK)
