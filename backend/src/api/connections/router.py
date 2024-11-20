from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from src.core.settings import settings

router = APIRouter(prefix="/connections", tags=["connections"])


SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
]


def create_flow():
    return Flow.from_client_secrets_file(
        "path/to/your/client_secrets.json",
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )


@router.get("/auth/google")
async def google_auth(request: Request):
    flow = create_flow()
    authorization_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(authorization_url)


@router.get("/auth/google/callback")
async def google_auth_callback(request: Request):
    flow = create_flow()
    flow.fetch_token(code=request.query_params.get("code"))
    credentials = flow.credentials

    # Store credentials securely (e.g., in a database)
    # For simplicity, we'll just return them here
    return {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
    }


def get_drive_service(credentials):
    return build("drive", "v3", credentials=credentials)


def get_gmail_service(credentials):
    return build("gmail", "v1", credentials=credentials)


@router.get("/google/drive/files")
async def list_drive_files(request: Request):
    # Retrieve credentials (you'll need to implement secure storage and retrieval)
    credentials = Credentials(token="user_access_token")
    drive_service = get_drive_service(credentials)

    try:
        results = (
            drive_service.files()
            .list(pageSize=10, fields="nextPageToken, files(id, name)")
            .execute()
        )
        files = results.get("files", [])
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google/gmail/messages")
async def list_gmail_messages(request: Request):
    # Retrieve credentials (you'll need to implement secure storage and retrieval)
    credentials = Credentials(token="user_access_token")
    gmail_service = get_gmail_service(credentials)

    try:
        results = (
            gmail_service.users()
            .messages()
            .list(userId="me", maxResults=10)
            .execute()
        )
        messages = results.get("messages", [])
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
