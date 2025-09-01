from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.wallet import Wallet
from app.models.transaction import Transaction

import os


MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27018/")
print(f"DEBUG: MONGO_URI from env: {MONGO_URI}")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dcawallet")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_db():
    db.client = AsyncIOMotorClient(MONGO_URI)
    db.db = db.client[DATABASE_NAME]
    
    await init_beanie(database=db.db, document_models=[Wallet, Transaction])
    print(f"Conectado ao MongoDB e Beanie inicializado: {MONGO_URI} - Banco de dados: {DATABASE_NAME}")

async def close_db():
    if db.client:
        db.client.close()
        print("Conexão com MongoDB fechada.")


async def get_database_client() -> AsyncIOMotorClient:
    """Returns the MongoDB client instance."""
    return db.client
