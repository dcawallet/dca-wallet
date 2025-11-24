from datetime import datetime, timedelta
import requests
from fastapi import HTTPException
from app.db.connection import db
from app.price_fetcher import get_coingecko_headers

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

async def calculate_portfolio_performance(wallet_id: str, timespan: str):
    """
    Calculates portfolio history and performance summary for a specific wallet and timespan.
    """
    days_map = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}
    if timespan == "ALL":
        transaction_collection = db.db["transactions"]
        first_transaction = await transaction_collection.find({"wallet_id": wallet_id}).sort("transaction_date", 1).limit(1).to_list(length=1)
        if not first_transaction:
            raise ValueError("No transactions found for this wallet.")
        first_transaction_date = first_transaction[0]["transaction_date"]
        
        days = (datetime.utcnow() - first_transaction_date).days
        days = days + 1 if days > 0 else 1
        
        start_date = first_transaction_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime.utcnow()
    elif timespan not in days_map:
        raise ValueError("Invalid timespan.")
    else:
        days = days_map[timespan]
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

    prices_usd = await fetch_coingecko_market_chart(days, "usd")
    if not prices_usd:
        raise HTTPException(status_code=503, detail="Failed to fetch complete price data.")

    transaction_collection = db.db["transactions"]
    all_transactions = await transaction_collection.find({
        "wallet_id": wallet_id,
        "transaction_date": {"$lte": end_date}
    }).sort("transaction_date", 1).to_list(length=None)

    portfolio_history = []
    daily_btc_balance = 0
    total_invested_usd = 0

    initial_transactions = [t for t in all_transactions if t["transaction_date"] < start_date]
    for trans in initial_transactions:
        if "buy" in trans["transaction_type"] or "in" in trans["transaction_type"]:
            daily_btc_balance += trans["amount_btc"]
            total_invested_usd += trans["amount_btc"] * trans["price_per_btc_usd"]
        elif "sell" in trans["transaction_type"] or "out" in trans["transaction_type"]:
            daily_btc_balance -= trans["amount_btc"]
            total_invested_usd -= trans["amount_btc"] * trans["price_per_btc_usd"]

    price_map = {datetime.fromtimestamp(p[0] / 1000).strftime('%Y-%m-%d'): p[1] for p in prices_usd}

    transactions_in_timespan = [t for t in all_transactions if t["transaction_date"] >= start_date]
    transactions_by_day = {}
    
    contributions_during_period = 0
    
    for t in transactions_in_timespan:
        day_str = t["transaction_date"].strftime('%Y-%m-%d')
        if day_str not in transactions_by_day:
            transactions_by_day[day_str] = []
        
        direction = "buy" if "buy" in t["transaction_type"] or "in" in t["transaction_type"] else "sell"
        
        transaction_value = t["amount_btc"] * t["price_per_btc_usd"]
        if direction == "buy":
            contributions_during_period += transaction_value
            total_invested_usd += transaction_value
        else:
            contributions_during_period -= transaction_value
            total_invested_usd -= transaction_value
        
        transactions_by_day[day_str].append({
            "transaction_type": t["transaction_type"],
            "direction": direction,
            "amount_btc": t["amount_btc"],
            "price_per_btc_usd": t["price_per_btc_usd"],
            "currency": t["currency"],
            "transaction_date": t["transaction_date"].isoformat()
        })

    current_day = start_date
    while current_day <= end_date:
        day_str = current_day.strftime('%Y-%m-%d')
        
        day_transactions_for_balance = [t for t in transactions_in_timespan if t["transaction_date"].strftime('%Y-%m-%d') == day_str]
        for trans in day_transactions_for_balance:
            if "buy" in trans["transaction_type"] or "in" in trans["transaction_type"]:
                daily_btc_balance += trans["amount_btc"]
            elif "sell" in trans["transaction_type"] or "out" in trans["transaction_type"]:
                daily_btc_balance -= trans["amount_btc"]

        btc_price_usd = price_map.get(day_str, 0)
        portfolio_value_usd = daily_btc_balance * btc_price_usd
        
        portfolio_history.append({
            "date": day_str,
            "btc_price_usd": btc_price_usd,
            "btc_balance": daily_btc_balance,
            "portfolio_value_usd": portfolio_value_usd,
            "transactions": transactions_by_day.get(day_str, [])
        })
        current_day += timedelta(days=1)

    if not portfolio_history:
        return {"portfolio_history": [], "summary": {}}

    final_btc_balance = daily_btc_balance
    final_value_usd = final_btc_balance * btc_price_usd
    total_invested = total_invested_usd

    profit_loss_usd = final_value_usd - total_invested
    profit_loss_percent = (profit_loss_usd / total_invested * 100) if total_invested != 0 else 0

    appreciation_usd = profit_loss_usd
    appreciation_percent = profit_loss_percent

    btc_price_start = prices_usd[0][1] if prices_usd else 0
    btc_price_end = prices_usd[-1][1] if prices_usd else 0
    btc_price_change_percent = ((btc_price_end - btc_price_start) / btc_price_start * 100) if btc_price_start != 0 else 0

    portfolio_values = [p["portfolio_value_usd"] for p in portfolio_history]
    
    summary = {
        "appreciation_usd": appreciation_usd,
        "appreciation_percent": appreciation_percent,
        "profit_loss_usd": profit_loss_usd,
        "profit_loss_percent": profit_loss_percent,
        
        "total_invested_usd": total_invested,
        "final_value_usd": final_value_usd,
        
        "final_btc_balance": final_btc_balance,
        "average_buy_price_usd": total_invested / final_btc_balance if final_btc_balance > 0 else 0,
        "current_btc_price_usd": btc_price_usd,
        "btc_price_start": btc_price_start,
        "btc_price_end": btc_price_end,
        "btc_price_change_percent": btc_price_change_percent,
        
        "max_value_usd": max(portfolio_values) if portfolio_values else 0,
        "min_value_usd": min(portfolio_values) if portfolio_values else 0,
        "average_value_usd": sum(portfolio_values) / len(portfolio_values) if portfolio_values else 0,
        
        "contributions_during_period_usd": contributions_during_period
    }

    return {
        "portfolio_history": portfolio_history, 
        "summary": summary, 
        "transactions": transactions_by_day
    }
