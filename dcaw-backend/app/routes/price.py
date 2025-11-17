from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.price_fetcher import fetch_btc_prices
from app.services.portfolio_calculator import calculate_portfolio_performance
from app.services.summary_storage import save_daily_summary

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

@router.get("/{timespan}", summary="Get historical portfolio performance for a given timespan")
async def get_historical_prices(
    timespan: str,
    background_tasks: BackgroundTasks,
    wallet_id: str = Query(..., description="The ID of the wallet to analyze")
):
    """
    Returns the portfolio history and performance summary for a specific wallet
    over a given timespan and triggers background saving of the daily summary.
    Supported timespans: `7d`, `30d`, `90d`, `365d`, `ALL`.
    """
    days_map = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}
    if timespan not in days_map and timespan != "ALL":
        raise HTTPException(status_code=400, detail="Invalid timespan. Supported values are: 7d, 30d, 90d, 365d, all.")

    try:
        result = await calculate_portfolio_performance(wallet_id, timespan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions from the calculator
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

    # Se o summary foi calculado com sucesso, adiciona a tarefa de salvamento
    if result and result["summary"]:
        background_tasks.add_task(save_daily_summary, wallet_id, timespan, result["summary"])

    return {
        "wallet_id": wallet_id,
        "timespan": timespan,
        **result
    }
