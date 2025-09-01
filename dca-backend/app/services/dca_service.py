import json
from datetime import datetime, timedelta
from typing import List, Optional

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import PydanticObjectId

from app.models.wallet import Wallet, DCAConfiguration
from app.models.transaction import TransactionCreate, Transaction
from app.core.config import settings

# This would ideally come from a real-time price API or a robust data source
BITCOIN_PRICE_FILE = "./bitcoin_price.json"
 

async def get_current_bitcoin_price() -> Optional[float]:
    """Reads the latest Bitcoin price from the bitcoin_price file."""
    try:
        with open(BITCOIN_PRICE_FILE, 'r') as f:
            data = json.load(f)
            price = float(data.get("price"))
            print(f"Current Bitcoin price read from file: {price}")
            return price
    except FileNotFoundError:
        print(f"Error: {BITCOIN_PRICE_FILE} not found. Cannot fetch Bitcoin price.")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {BITCOIN_PRICE_FILE}.")
        return None
    except Exception as e:
        print(f"An unexpected error occurred while reading Bitcoin price: {e}")
        return None

async def process_dca_for_wallet(wallet: Wallet, db_client: AsyncIOMotorClient):
    """Processes DCA configurations for a single wallet."""
    current_btc_price = await get_current_bitcoin_price()
    if not current_btc_price:
        print(f"Skipping DCA for wallet {wallet.id}: Could not get current Bitcoin price.")
        return

    for dca_config in wallet.dca_settings:
        if not wallet.dca_enabled:
            continue

        should_execute = False
        now = datetime.utcnow()

        # Determine if DCA purchase is due
        if dca_config.dca_frequency == "daily":
            if not dca_config.dca_last_executed or (now - dca_config.dca_last_executed) >= timedelta(days=1):
                should_execute = True
        elif dca_config.dca_frequency == "monthly":
            if not dca_config.dca_last_executed:
                should_execute = True
            else:
                # Check if it's a new month since last execution
                if (now.year > dca_config.dca_last_executed.year) or \
                   (now.year == dca_config.dca_last_executed.year and now.month > dca_config.dca_last_executed.month):
                    should_execute = True
        # Extend with other frequencies (weekly, etc.) if supported

        if should_execute:
            print(f"Executing DCA for wallet {wallet.id} with amount {dca_config.dca_amount} {dca_config.dca_currency}")
            
            btc_amount = dca_config.dca_amount / current_btc_price
            
            # Create transaction
            transaction = TransactionCreate(
                wallet_id=str(wallet.id),
                transaction_type="dca_buy",
                amount_btc=btc_amount,
                price_per_btc_usd=current_btc_price,
                total_value_usd=dca_config.dca_amount,
                currency=dca_config.dca_currency,
                origin="dca"
            )
            
            # Save transaction to DB
            new_transaction = Transaction(**transaction.dict())
            await new_transaction.insert()

            # Update wallet's btc_holdings
            wallet.btc_holdings += btc_amount
            
            # Update dca_last_executed for this specific DCA configuration
            dca_config.dca_last_executed = now
            
            # Save updated wallet
            await wallet.save()
            print(f"DCA transaction created and wallet {wallet.id} updated.")

async def run_dca_scheduler(db_client: AsyncIOMotorClient):
    """Main function to be called by the scheduler to process all active DCAs."""
    print("Running DCA scheduler...")
    wallets: List[Wallet] = await Wallet.find({"dca_enabled": True}).to_list()
    
    for wallet in wallets:
        await process_dca_for_wallet(wallet, db_client)
    print("DCA scheduler finished.")

