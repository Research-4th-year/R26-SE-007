import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+asyncmy://root:122400@localhost:3306/warehouse")

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def fetch_all(query: str, params: dict = {}) -> list[dict]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(query), params)
        rows = result.fetchall()
        cols = result.keys()
        return [dict(zip(cols, row)) for row in rows]


async def ping_db() -> bool:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False