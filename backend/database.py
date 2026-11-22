import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hirelens.db")

raw_url = os.getenv("DATABASE_URL", "").strip()
environment = os.getenv("ENVIRONMENT", "development").lower()

# Check if PostgreSQL URL is provided and valid (not a placeholder)
if raw_url and not raw_url.startswith("your_") and "example" not in raw_url:
    # Render and cloud providers often prefix with postgres://; SQLAlchemy requires postgresql+psycopg2://
    if raw_url.startswith("postgres://"):
        DATABASE_URL = raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif raw_url.startswith("postgresql://"):
        DATABASE_URL = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    else:
        DATABASE_URL = raw_url

    logger.info("Attempting connection to production PostgreSQL database...")
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300
        )
        # Test connection immediately
        with engine.connect() as conn:
            logger.info("Connected successfully to PostgreSQL database.")
    except Exception as e:
        logger.error(f"FATAL: Failed to connect to PostgreSQL at {DATABASE_URL[:25]}... Error: {e}")
        # In production, do NOT silently fall back to ephemeral SQLite!
        if environment == "production" or os.getenv("RENDER"):
            raise RuntimeError(
                f"Production PostgreSQL connection failed. Ensure your Render PostgreSQL database is active and DATABASE_URL is set correctly. Error: {e}"
            )
        # In local dev only, warn and allow fallback
        logger.warning("Falling back to local SQLite database for local development only.")
        DATABASE_URL = "sqlite:///./hirelens.db"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    logger.info("No production DATABASE_URL provided. Using local SQLite database (hirelens.db).")
    DATABASE_URL = "sqlite:///./hirelens.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
