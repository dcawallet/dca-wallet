from fastapi import APIRouter, HTTPException, Query
import requests
from datetime import datetime, timedelta
from bson import ObjectId

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

@router.get("/{timespan}", summary="Get historical portfolio performance for a given timespan")
async def get_historical_prices(
    timespan: str,
    wallet_id: str = Query(..., description="The ID of the wallet to analyze")
):
    """
    Returns the portfolio history and performance summary for a specific wallet
    over a given timespan.
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
    
    # 1. Fetch historical BTC prices in USD
    prices_usd = await fetch_coingecko_market_chart(days, "usd")
    if not prices_usd:
        raise HTTPException(status_code=503, detail="Failed to fetch complete price data from CoinGecko.")

    # 2. Fetch transactions for the wallet
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    transaction_collection = db.db["transactions"]
    transactions = await transaction_collection.find({
        "wallet_id": wallet_id,
        "transaction_date": {"$lte": end_date}
    }).sort("transaction_date", 1).to_list(length=None)

    # 3. Calculate daily portfolio value
    portfolio_history = []
    daily_btc_balance = 0
    
    # Calculate initial balance before the timespan
    initial_transactions = [t for t in transactions if t["transaction_date"] < start_date]
    for trans in initial_transactions:
        if "buy" in trans["transaction_type"]:
            daily_btc_balance += trans["amount_btc"]
        elif "sell" in trans["transaction_type"]:
            daily_btc_balance -= trans["amount_btc"]

    price_map = {datetime.fromtimestamp(p[0] / 1000).strftime('%Y-%m-%d'): p[1] for p in prices_usd}
    
    current_day = start_date
    while current_day <= end_date:
        day_str = current_day.strftime('%Y-%m-%d')
        
        # Sum transactions for the current day
        day_transactions = [t for t in transactions if t["transaction_date"].strftime('%Y-%m-%d') == day_str]
        for trans in day_transactions:
            if "buy" in trans["transaction_type"]:
                daily_btc_balance += trans["amount_btc"]
            elif "sell" in trans["transaction_type"]:
                daily_btc_balance -= trans["amount_btc"]
        
        btc_price_usd = price_map.get(day_str, 0)
        portfolio_value_usd = daily_btc_balance * btc_price_usd
        
        portfolio_history.append({
            "date": day_str,
            "btc_price_usd": btc_price_usd,
            "btc_balance": daily_btc_balance,
            "portfolio_value_usd": portfolio_value_usd
        })
        current_day += timedelta(days=1)

    # 4. Calculate summary metrics
    if not portfolio_history:
        summary = {}
    else:
        initial_value_usd = portfolio_history[0]["portfolio_value_usd"]
        final_value_usd = portfolio_history[-1]["portfolio_value_usd"]
        absolute_change_usd = final_value_usd - initial_value_usd
        percent_change = (absolute_change_usd / initial_value_usd * 100) if initial_value_usd != 0 else 0
        
        btc_price_start = prices_usd[0][1]
        btc_price_end = prices_usd[-1][1]
        btc_price_change_percent = ((btc_price_end - btc_price_start) / btc_price_start * 100) if btc_price_start != 0 else 0

        portfolio_values = [p["portfolio_value_usd"] for p in portfolio_history]
        max_value_usd = max(portfolio_values)
        min_value_usd = min(portfolio_values)
        average_value_usd = sum(portfolio_values) / len(portfolio_values)

        summary = {
            "initial_value_usd": initial_value_usd,
            "final_value_usd": final_value_usd,
            "absolute_change_usd": absolute_change_usd,
            "percent_change": percent_change,
            "btc_price_start": btc_price_start,
            "btc_price_end": btc_price_end,
            "btc_price_change_percent": btc_price_change_percent,
            "max_value_usd": max_value_usd,
            "min_value_usd": min_value_usd,
            "average_value_usd": average_value_usd
        }

    return {
        "wallet_id": wallet_id,
        "timespan": timespan,
        "portfolio_history": portfolio_history,
        "summary": summary
    }
