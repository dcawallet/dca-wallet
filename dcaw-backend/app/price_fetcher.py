import requests
import asyncio
import json
from datetime import datetime, timezone

#IMPORT API KEY FROM .env file
from dotenv import load_dotenv
import os
load_dotenv()


# --- Preço do Bitcoin em USD e BRL via CoinGecko ---
async def fetch_btc_prices() -> dict:
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": "bitcoin", "vs_currencies": "usd,brl"}
    try:
        resp = requests.get(url, params=params)
        resp.raise_for_status()  # Raise an exception for bad status codes
        data = resp.json()
        return {
            "btc_usd_price": data["bitcoin"]["usd"],
            "btc_brl_price": data["bitcoin"]["brl"]
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Bitcoin prices: {e}")
        return None


# --- Salvar preços no arquivo ---
async def save_prices_to_file(btc_usd_price: float, btc_brl_price: float):
    file_path = "bitcoin_price.json" # Caminho absoluto
    current_time = datetime.now(timezone.utc).isoformat()

    # Calcular usd_brl_calculated
    usd_brl_calculated = btc_brl_price / btc_usd_price if btc_usd_price else 0

    # Read existing content if available to preserve other potential fields
    try:
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = {}

    # Update only the relevant fields
    existing_data.update({
        "btc_usd_price": btc_usd_price,
        "btc_brl_price": btc_brl_price,
        "last_updated": current_time,
        
        "usd_brl_calculated": usd_brl_calculated
    })

    with open(file_path, 'w') as f:
        json.dump(existing_data, f, indent=4)
    print(f"Prices saved to {file_path}")

async def price_fetching_scheduler():
    btc_prices = await fetch_btc_prices()

    if btc_prices is not None:
        await save_prices_to_file(btc_prices["btc_usd_price"], btc_prices["btc_brl_price"])

    btc_fetch_interval = 60 # seconds
    usd_brl_fetch_interval = 3 * 3600 # 3 hours in seconds

    last_btc_fetch_time = datetime.now(timezone.utc)
    last_usd_brl_fetch_time = datetime.now(timezone.utc)

    while True:
        now = datetime.now(timezone.utc)

        # Fetch BTC prices every 60 seconds
        if (now - last_btc_fetch_time).total_seconds() >= btc_fetch_interval:
            print("Fetching Bitcoin prices...")
            new_btc_prices = await fetch_btc_prices()
            if new_btc_prices:
                btc_prices = new_btc_prices
                await save_prices_to_file(btc_prices["btc_usd_price"], btc_prices["btc_brl_price"])
            last_btc_fetch_time = now


        await asyncio.sleep(1) # Check every second for due tasks

if __name__ == "__main__":
    print("Starting price fetching scheduler...")
    asyncio.run(price_fetching_scheduler())
