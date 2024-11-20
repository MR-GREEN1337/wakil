import logging
from datetime import datetime
from typing import List

import stripe
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.errors import PyMongoError

from src.api.fields import PyObjectId
from src.api.models import User
from src.api.stripe.crud import get_user_from_id
from src.api.stripe.models import StripePlan, UserBilling
from src.core.settings import settings
from src.db.client import MongoDBClient
from src.security.oauth import get_current_user
from src.services.email_constants import (
    onboarding_html_content,
    onboarding_subject,
)
from src.services.emails import send_email

router = APIRouter(prefix="/stripe", tags=["stripe"])

# Feed stripe Class its api key,make it alive!
stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)


@router.post("/create-checkout-session", description="Create checkout session")
async def create_checkout_session(request: Request):
    data = await request.json()
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[
                {
                    "price": data[
                        "priceId"
                    ],  # Price ID from the Stripe dashboard
                    "quantity": 1,
                }
            ],
            success_url=f"{data['successUrl']}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=data["cancelUrl"],
            metadata={
                "app_email": data[
                    "user_email"
                ],  # Custom metadata to link Stripe data to your user
            },
        )
        return {"sessionId": checkout_session["id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/cancel-subscription", description="Cancel user subscription")
async def cancel_subscription(
    user_id: PyObjectId = Depends(get_current_user),
):
    """
    Cancels a user's subscription.

    Args:
    user_id (PyObjectId): The ID of the user to cancel subscription for.

    Returns:
    dict: A message indicating whether the subscription was canceled successfully.

    Raises:
    HTTPException: If the user ID is invalid, subscription not found, or cancellation fails.
    """

    try:
        # Fetch the user's profile from the database
        profile = await get_user_from_id(ObjectId(user_id))
        profile = User(**profile)  # Cast from dict to pydantic class
        # print(profile)
        # print(profile.stripe_subscription_id)
        if not profile or not profile.stripe_subscription_id:
            logger.info(f"Subscription not found for user with ID {user_id}")
            raise HTTPException(
                status_code=404, detail="Subscription not found"
            )

        # Cancel the subscription on Stripe
        try:
            stripe.Subscription.cancel(profile.stripe_subscription_id)
            profile.stripe_subscription_id = None
            profile.stripe_customer_id = None
            profile.subscription_plan = None
            profile.subscription_status = "canceled"
            # profile.current_period_end = None
            # profile.trial_end = None

            # Update user profile in database
            client = MongoDBClient()
            user_collection = client.get_collection(User)
            await user_collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": profile.model_dump()}
            )

            logger.info(
                f"Subscription canceled successfully for user with ID {user_id}"
            )
            return {"message": "Subscription canceled successfully"}
        except stripe.error.CardError as e:
            logger.error(
                f"Card error while canceling subscription for user with ID {user_id}: {str(e)}"
            )
            raise HTTPException(status_code=402, detail=str(e))
        except stripe.error.RateLimitError as e:
            logger.error(
                f"Rate limit error while canceling subscription for user with ID {user_id}: {str(e)}"
            )
            raise HTTPException(status_code=429, detail=str(e))
        except stripe.error.InvalidRequestError as e:
            logger.error(
                f"Invalid request error while canceling subscription for user with ID {user_id}: {str(e)}"
            )
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error while canceling subscription for user with ID {user_id}: {str(e)}"
            )
            raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.error(
            f"Error while canceling subscription for user with ID {user_id}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handles Stripe webhook events.

    Args:
    request (Request): The incoming request.

    Returns:
    dict: A message indicating whether the event was handled successfully.

    Raises:
    HTTPException: If the payload is invalid, signature is invalid, or event handling fails.
    """

    # print(await request.body())

    try:
        # Extract payload and signature from request
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        # Verify event signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            logger.error("Invalid payload")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature")
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Handle event types
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]

            # Extract relevant data
            customer_email = session["metadata"]["app_email"]
            subscription_id = session.get("subscription")
            customer_id = session["customer"]

            # Retrieve the subscription
            subscription = stripe.Subscription.retrieve(subscription_id)

            # Extract subscription details
            current_period_end = datetime.fromtimestamp(
                subscription["current_period_end"]
            )
            subscription_status = subscription["status"]

            # Retrieve the product associated with the subscription item
            product_id = subscription["plan"]["product"]
            product = stripe.Product.retrieve(product_id)

            # Extract product details
            product_name = product["name"]

            # Fetch profile from the database using email
            user_collection = MongoDBClient().get_collection(User)
            # print("users collection", user_collection)
            profile = await user_collection.find_one({"email": customer_email})

            # print("ante user profile", profile)

            if profile:
                # Update profile with Stripe details
                profile["stripe_customer_id"] = customer_id
                profile["stripe_subscription_id"] = subscription_id
                profile["subscription_plan"] = product_name
                profile["subscription_status"] = subscription_status
                profile["current_period_end"] = current_period_end
                profile["updated_at"] = datetime.now()

                # print("past user profile", profile)
                # Update profile in database
                await user_collection.update_one(
                    {"email": customer_email}, {"$set": profile}
                )

                # Send onboardingemail to user
                user_name = profile["firstname"] + " " + profile["lastname"]
                html_content = onboarding_html_content.format(
                    user_name=user_name
                )
                send_email(
                    to=customer_email,
                    subject=onboarding_subject,
                    html_content=html_content,
                )
            else:
                logger.error("Profile not found")
                raise HTTPException(
                    status_code=404, detail="Profile not found"
                )

        # Additional event types can be handled here
        else:
            logger.info(f"Unhandled event type: {event['type']}")

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error handling Stripe webhook event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/list_plans",
    description="List plans of SaaS",
    response_model=List[StripePlan],
)
async def list_plans() -> List[StripePlan]:
    try:
        """        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")"""
        plans = stripe.Plan.list()
        print(plans)
        return [StripePlan(**plan) for plan in plans]
    except stripe.StripeError:
        raise HTTPException(
            status_code=500, detail="Error fetching plans from Stripe"
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/billing",
    description="Retrieve user billing information",
    response_model=UserBilling,
)
async def user_billing(
    user_id: PyObjectId = Depends(get_current_user),
) -> UserBilling:
    try:
        client = MongoDBClient()
        result = await client.get(User, ObjectId(user_id))
        # print(result)
        if result is None:
            raise HTTPException(status_code=404, detail="User not found")
        return UserBilling(**result)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database error")
