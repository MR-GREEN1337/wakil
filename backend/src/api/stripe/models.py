from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class StripePlan(BaseModel):
    id: str
    object: str
    active: bool
    amount: int
    currency: str
    interval: str
    interval_count: int
    livemode: bool
    metadata: Dict[str, Any]  # Assuming metadata is a dictionary
    nickname: Optional[str]  # Nickname can be None, so it's Optional
    product: str
    tiers: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list
    )  # Tiers can be a list of dictionaries or None
    tiers_mode: Optional[str]  # Tiers_mode can be None
    transform_usage: Optional[
        Dict[str, Any]
    ]  # Transform usage can be None or a dictionary
    usage_type: str

    # Additional fields from the JSON that are missing in the initial model
    aggregate_usage: Optional[str] = None  # Can be null
    billing_scheme: str
    created: int
    meter: Optional[str] = None  # Can be null
    trial_period_days: Optional[int] = None  # Can be null


class UserBilling(BaseModel):
    firstname: str
    lastname: str
    email: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    current_period_end: Optional[datetime] = None
