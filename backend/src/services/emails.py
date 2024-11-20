"""Send email to user onboarding, and periodically"""

from typing import Dict

import resend

from src.core.settings import settings

resend.api_key = settings.RESEND_API_KEY


def send_email(to: str, subject: str, html_content: str) -> Dict:
    """Send email on user onboarding, and periodically"""
    params: resend.Emails.SendParams = {
        "from": "onboarding@resend.dev",
        "to": to,
        "subject": subject,
        "html": html_content,
    }

    email: resend.Email = resend.Emails.send(params)
    return email
