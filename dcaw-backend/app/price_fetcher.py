import asyncio
from datetime import datetime, timezone, timedelta
import requests
from dotenv import load_dotenv
import os

from app.db.connection import db

load_dotenv()

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
MAX_RECORDS = 144

# --- CoinGecko API Functions ---

def get_coingecko_headers() -> dict:
    """Returns headers for CoinGecko API, including the API key if available."""
    headers = {"accept": "application/json"}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    return headers

async def fetch_btc_prices() -> dict:
    """Fetches the current BTC price in USD and BRL from CoinGecko."""
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": "bitcoin", "vs_currencies": "usd,brl"}
    headers = get_coingecko_headers()
    
    try:
        loop = asyncio.get_running_loop()
        resp = await loop.run_in_executor(None, lambda: requests.get(url, params=params, headers=headers))
        resp.raise_for_status()
        data = resp.json()
        
        btc_usd = data["bitcoin"]["usd"]
        btc_brl = data["bitcoin"]["brl"]
        usd_brl_calculated = btc_brl / btc_usd if btc_usd else 0
        
        return {
            "btc_usd_price": btc_usd,
            "btc_brl_price": btc_brl,
            "usd_brl_calculated": round(usd_brl_calculated, 4),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching current Bitcoin prices: {e}")
        return None

# --- Database Functions ---

async def initialize_price_collection():
    """
    Ensures the capped collection for prices exists.
    Population is no longer done here; it happens organically via the scheduler.
    """
    database = db.db
    collection_name = "last_24h_price"
    
    if collection_name not in await database.list_collection_names():
        await database.create_collection(collection_name, capped=True, size=1000000, max=MAX_RECORDS)
        print(f"Created capped collection '{collection_name}'.")

async def save_price_to_db(price_data: dict):
    price_collection = db.db["last_24h_price"]
    document = {
        "timestamp": datetime.fromisoformat(price_data["last_updated"]),
        "btc_usd_price": price_data["btc_usd_price"],
        "btc_brl_price": price_data["btc_brl_price"]
    }
    await price_collection.insert_one(document)
    print(f"Saved new price record to DB at {price_data['last_updated']}.")

# --- Main Scheduler ---
async def price_fetching_scheduler():
    print("Initializing price fetching scheduler...")
    await asyncio.sleep(5) 
    await initialize_price_collection()
    
    fetch_interval = 60
    save_interval = 600
    last_fetch_time = datetime.now(timezone.utc) - timedelta(seconds=fetch_interval)
    last_save_time = datetime.now(timezone.utc) - timedelta(seconds=save_interval)

    while True:
        now = datetime.now(timezone.utc)
        if (now - last_fetch_time).total_seconds() >= fetch_interval:
            print("Fetching Bitcoin prices...")
            last_fetch_time = now
            btc_prices = await fetch_btc_prices()

            if btc_prices and (now - last_save_time).total_seconds() >= save_interval:
                print("10-minute interval reached. Saving price to database...")
                await save_price_to_db(btc_prices)
                last_save_time = now
        await asyncio.sleep(5)
