
from database import engine

try:
    with engine.connect() as connection:
        print("PostgreSQL connected successfully!")
except Exception as error:
    print("Database connection failed!")
    print(error)
