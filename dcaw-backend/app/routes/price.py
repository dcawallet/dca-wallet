from fastapi import APIRouter, HTTPException
import requests
from datetime import datetime

from app.db.connection import db
from app.price_fetcher import fetch_btc_prices, get_coingecko_headers

router = APIRouter()

@router.get("/now", summary="Get the current Bitcoin price")
async def get_current_btc_price():
    """
    Fetches the current real-time price of Bitcoin in USD and BRL.
    """
    prices = await fetch_btc_prices()
    if not prices:
        raise HTTPException(status_code=503, detail="Could not fetch current prices from the external API.")
    return prices

# @router.get("/24h", summary="Get Bitcoin prices for the last 24 hours [DISABLED]")
# async def get_24h_prices():
#     """
#     NOTE: This route is temporarily disabled.
#     Returns the last 144 Bitcoin price records (approx. 24 hours) stored in the local MongoDB.
#     """
#     raise HTTPException(
#         status_code=501,
#         detail="This endpoint is temporarily disabled and will be implemented in a future version."
#     )
#     # price_collection = db.db["last_24h_price"]
#     # prices = await price_collection.find({}, {"_id": 0}).sort("timestamp", -1).to_list(length=144)
#     # if not prices:
#     #     raise HTTPException(
#     #         status_code=404,
#     #         detail="No price data found for the last 24 hours. The background worker may still be populating the data."
#     #     )
#     # formatted_prices = {
#     #     "prices_usd": [[int(p["timestamp"].timestamp() * 1000), p["btc_usd_price"]] for p in prices],
#     #     "prices_brl": [[int(p["timestamp"].timestamp() * 1000), p["btc_brl_price"]] for p in prices]
#     # }
#     # return formatted_prices

async def fetch_coingecko_market_chart(days: int, currency: str) -> list:
    """Fetches historical market data from CoinGecko for a given number of days."""
    url = f"https://api.coingecko.com/api/v3/coins/bitcoin/market_chart"
    params = {"vs_currency": currency, "days": str(days)}
    headers = get_coingecko_headers()
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json().get("prices", [])
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Error fetching data from CoinGecko: {e}")

@router.get("/{timespan}", summary="Get historical Bitcoin prices for a given timespan")
async def get_historical_prices(timespan: str):
    """
    Returns historical Bitcoin prices (USD and BRL) for a specified timespan.
    Supported timespans: `7d`, `30d`, `90d`, `365d`.
    """
    days_map = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "365d": 365
    }
    
    if timespan not in days_map:
        raise HTTPException(status_code=400, detail="Invalid timespan. Supported values are: 7d, 30d, 90d, 365d.")
    
    days = days_map[timespan]
    
    prices_usd = await fetch_coingecko_market_chart(days, "usd")
    prices_brl = await fetch_coingecko_market_chart(days, "brl")
    
    if not prices_usd or not prices_brl:
        raise HTTPException(status_code=503, detail="Failed to fetch complete data from CoinGecko.")

    return {
        "prices_usd": prices_usd,
        "prices_brl": prices_brl
    }
