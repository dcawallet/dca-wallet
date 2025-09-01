import requests
import asyncio
import json
from datetime import datetime, timezone

#IMPORT API KEY FROM .env file
from dotenv import load_dotenv
import os
load_dotenv()
currencyapi_api_key = os.getenv('CURRENCY_API_URL')

# --- Preço do Bitcoin em USD via CoinGecko ---
async def fetch_btc_usd() -> float:
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": "bitcoin", "vs_currencies": "usd"}
    try:
        resp = requests.get(url, params=params)
        resp.raise_for_status()  # Raise an exception for bad status codes
        data = resp.json()
        return data["bitcoin"]["usd"]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Bitcoin price: {e}")
        return None

# --- Cotação do USD para BRL via CurrencyAPI ---
async def fetch_usd_brl() -> float:
    # 300 requests/month free tier limit
    url = "https://api.currencyapi.com/v3/latest"
    api_key = currencyapi_api_key  
    params = {"apikey": api_key, "base_currency": "USD", "currencies": "BRL"}
    resp = requests.get(url, params=params)
    data = resp.json()
    return data["data"]["BRL"]["value"]

# --- Save prices to file ---
async def save_prices_to_file(btc_price: float, usd_brl_rate: float):
    file_path = "bitcoin_price.json" # Relative to the current working directory of the process that runs this script
    current_time = datetime.now(timezone.utc).isoformat()
    
    # Read existing content if available to preserve other potential fields
    try:
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = {}

    # Update only the relevant fields
    existing_data.update({
        "price": btc_price,
        "usd_brl": usd_brl_rate,
        "last_updated": current_time
    })

    with open(file_path, 'w') as f:
        json.dump(existing_data, f, indent=4)
    #print(f"Prices saved to {file_path}: BTC=${btc_price}, USD/BRL={usd_brl_rate}")

async def price_fetching_scheduler():
    btc_price = await fetch_btc_usd()
    usd_brl_rate = await fetch_usd_brl() # Fetch initial USD/BRL rate
    
    # Store initial prices
    if btc_price is not None and usd_brl_rate is not None:
        await save_prices_to_file(btc_price, usd_brl_rate)
    
    btc_fetch_interval = 15 # seconds
    usd_brl_fetch_interval = 3 * 3600 # 3 hours in seconds

    last_btc_fetch_time = datetime.now(timezone.utc)
    last_usd_brl_fetch_time = datetime.now(timezone.utc)

    while True:
        now = datetime.now(timezone.utc)
        
        # Fetch BTC price every 15 seconds
        if (now - last_btc_fetch_time).total_seconds() >= btc_fetch_interval:
            #print("Fetching Bitcoin price...")
            new_btc_price = await fetch_btc_usd()
            if new_btc_price is not None:
                btc_price = new_btc_price
                await save_prices_to_file(btc_price, usd_brl_rate) # Save with potentially updated BTC price
            last_btc_fetch_time = now

        # Fetch USD/BRL rate every 3 hours
        if (now - last_usd_brl_fetch_time).total_seconds() >= usd_brl_fetch_interval:
            #print("Fetching USD/BRL rate...")
            new_usd_brl_rate = await fetch_usd_brl()
            if new_usd_brl_rate is not None:
                usd_brl_rate = new_usd_brl_rate
                await save_prices_to_file(btc_price, usd_brl_rate) # Save with potentially updated USD/BRL rate
            last_usd_brl_fetch_time = now

        await asyncio.sleep(1) # Check every second for due tasks

if __name__ == "__main__":
    #print("Starting price fetching scheduler...")
    asyncio.run(price_fetching_scheduler())
