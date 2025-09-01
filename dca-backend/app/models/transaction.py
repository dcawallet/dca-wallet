from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from beanie import Document # Import Document from beanie

class TransactionBase(BaseModel):
    wallet_id: str
    transaction_type: Literal[
        "manual_buy", "manual_sell", "dca_buy", "blockchain_in", "blockchain_out",
        "cmc_buy", "cmc_sell" # Added for CoinMarketCap import
    ]
    amount_btc: float
    price_per_btc_usd: float # New: Price (USD) from CSV
    total_value_usd: float   # Changed from amount_currency: Total value (USD) from CSV
    currency: str = "USD"    # Fixed to USD for CMC imports, can be flexible for others
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    fee: Optional[float] = None # New: Fee from CSV
    fee_currency: Optional[str] = None # New: Fee Currency from CSV
    notes: Optional[str] = None
    txid: Optional[str] = None # For blockchain transactions
    origin: Optional[Literal["dca", "manual"]] = None # New: To mark transactions originating from DCA

class Transaction(TransactionBase, Document):
    class Settings:
        name = "transactions"

class TransactionCreate(TransactionBase):
    pass

class TransactionOut(TransactionBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
