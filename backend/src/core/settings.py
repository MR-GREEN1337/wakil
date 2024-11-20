from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = "app_"

    # Environment
    ENVIRONMENT: str = (
        "staging"  # default to 'staging',    be overridden by .env
    )

    # MongoDB
    MONGO_DB_URL: str
    MONGO_DB_DB: str

    # OpenAI
    OPENAI_API_KEY: str

    # ANTHROPIC
    ANTHROPIC_API_KEY: str

    # Qdrant
    QDRANT_URL: str
    QDRANT_API_KEY: str

    # CORS
    ALLOWED_ORIGINS: list[str]
    SECRET_KEY: str

    # AWS S3
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION_NAME: str
    S3_BUCKET_NAME: str

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str

    # Groq
    GROQ_API_KEY: str

    # Resend
    RESEND_API_KEY: str


"""    def setup_logging(self):
        Sets up logging based on the environment.
        logging_level = (
            logging.INFO if self.ENVIRONMENT == "production" else logging.DEBUG
        )

        logging.basicConfig(
            level=logging_level,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            handlers=[logging.StreamHandler()],
        )

        logging.info(
            f"Logging is set up. Level: {logging.getLevelName(logging_level)}"
        )
        logging.info(f"Environment: {self.ENVIRONMENT}")
"""

MONGODB_MAXPOOLSIZE = 10
MONGODB_MINPOOLSIZE = 1

# Instantiate settings and set up logging
settings = AppSettings()  # type: ignore[call-arg]
"""settings.setup_logging()"""
