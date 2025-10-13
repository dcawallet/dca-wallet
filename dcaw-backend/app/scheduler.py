import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.db.connection import db
from app.services.portfolio_calculator import calculate_portfolio_performance
from app.services.summary_storage import save_daily_summary

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def scheduled_summary_job():
    """
    Job agendado para calcular e salvar os summaries diários para todas as carteiras.
    """
    logger.info("Starting scheduled daily summary job...")
    wallets_collection = db.db["wallets"]
    timespans = ["7d", "30d", "90d", "365d"]
    
    try:
        # Itera sobre todas as carteiras existentes
        async for wallet in wallets_collection.find({}, {"_id": 1}):
            wallet_id = str(wallet["_id"])
            logger.info(f"Processing wallet: {wallet_id}")
            
            # Para cada carteira, calcula e salva o summary para cada timespan
            for timespan in timespans:
                try:
                    result = await calculate_portfolio_performance(wallet_id, timespan)
                    if result and result["summary"]:
                        await save_daily_summary(wallet_id, timespan, result["summary"])
                except Exception as e:
                    logger.error(f"Failed to process {timespan} for wallet {wallet_id}: {e}")
        
        logger.info("Scheduled daily summary job finished successfully.")

    except Exception as e:
        logger.error(f"An error occurred during the scheduled summary job: {e}")

def init_scheduler():
    """Inicializa e inicia o scheduler."""
    scheduler = AsyncIOScheduler(timezone="UTC")
    
    # Agenda o job para rodar todos os dias às 23:59 UTC
    scheduler.add_job(
        scheduled_summary_job,
        trigger=CronTrigger(hour=23, minute=59),
        id="daily_summary_job",
        name="Daily Portfolio Summary Job",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler initialized and started.")
