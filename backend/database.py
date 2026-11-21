import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hirelens.db")

raw_url = os.getenv("DATABASE_URL", "").strip()

# Check if PostgreSQL URL is provided and valid (not a placeholder)
if raw_url and not raw_url.startswith("your_") and "example" not in raw_url:
    if raw_url.startswith("postgresql://"):
        DATABASE_URL = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    else:
        DATABASE_URL = raw_url
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            logger.info("Connected successfully to PostgreSQL database.")
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to local SQLite database.")
        DATABASE_URL = "sqlite:///./hirelens.db"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    logger.info("Using local SQLite database for development.")
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
