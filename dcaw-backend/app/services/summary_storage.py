import logging
from datetime import datetime, timezone
from app.db.connection import db

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_summary_exists(wallet_id: str, timespan: str, date_str: str) -> bool:
    """Verifica se um summary para uma carteira, timespan e data específicos já existe."""
    daily_summaries_collection = db.db["daily_summaries"]
    count = await daily_summaries_collection.count_documents({
        "wallet_id": wallet_id,
        "timespan": timespan,
        "date": date_str
    })
    return count > 0

async def save_daily_summary(wallet_id: str, timespan: str, summary_data: dict):
    """Salva o summary diário, mas apenas se ele ainda não existir para o dia atual."""
    today_utc = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    try:
        exists = await check_summary_exists(wallet_id, timespan, today_utc)
        if exists:
            logger.info(f"Summary for wallet {wallet_id} ({timespan}) on {today_utc} already exists. Skipping.")
            return

        daily_summaries_collection = db.db["daily_summaries"]
        document = {
            "wallet_id": wallet_id,
            "timespan": timespan,
            "date": today_utc,
            "summary": summary_data,
            "created_at": datetime.now(timezone.utc)
        }

        await daily_summaries_collection.insert_one(document)
        logger.info(f"Successfully saved daily summary for wallet {wallet_id} ({timespan}).")

    except Exception as e:
        logger.error(f"Failed to save daily summary for wallet {wallet_id} ({timespan}): {e}")
