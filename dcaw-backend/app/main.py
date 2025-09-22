from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import asyncio
from app.db.connection import connect_db, close_db, get_database_client
from app.services.dca_service import run_dca_scheduler
from app.routes.auth import auth_router
from app.routes.wallet import router as wallet_router
from app.routes.transaction import router as transaction_router
from app.price_fetcher import price_fetching_scheduler
from app.routes.user import user_router
from app.routes.imports import import_router # Import the new import router
from app.routes.price import router as price_router # Import the new price router

print("Running DCA Wallet Backend Swagger on: http://localhost:8000/docs")
load_dotenv() # Carrega as variáveis de ambiente do .env


app = FastAPI(
    title="DCA Wallet Backend",
    description="API for managing DCA Wallets, transactions, and user authentication.",
    version="0.1.0",
    on_startup=[connect_db],
    on_shutdown=[close_db],
)

async def start_dca_scheduler():
    """Starts the DCA background scheduler."""
    db_client = await get_database_client()
    while True:
        await run_dca_scheduler(db_client)
        await asyncio.sleep(600)  #10 minutes interval

@app.on_event("startup")
async def startup_event():
    # The connect_db function is already in the on_startup list of FastAPI
    # We create the task here to ensure the DB is connected first
    asyncio.create_task(start_dca_scheduler())
    asyncio.create_task(price_fetching_scheduler())


app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(wallet_router, prefix="/api/wallets", tags=["Wallets"])
app.include_router(transaction_router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(user_router, prefix="/api/user", tags=["User Information"])
app.include_router(import_router, prefix="/api/import", tags=["Data Import"]) # Include the new import router
app.include_router(price_router, prefix="/api/price", tags=["Price Data"]) # Include the new price router

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to DCA Wallet API!"}

