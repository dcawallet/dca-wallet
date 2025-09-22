from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from beanie import Document # Import Document from beanie

# New DCA Configuration Model
class DCAConfiguration(BaseModel):
    dca_amount: float
    dca_currency: str # e.g., "USD", "BRL"
    dca_frequency: str # e.g., "daily", "weekly", "monthly"
    dca_last_executed: Optional[datetime] = None # New: Timestamp of last DCA execution
    dca_price_range_min: Optional[float] = None
    dca_price_range_max: Optional[float] = None

class WalletBase(BaseModel):
    label: str
    addresses: List[str] = Field(default_factory=list) # Initialize as empty list
    currency: str = "USD" # Primary currency of the wallet
    notes: Optional[str] = None
    btc_holdings: float = 0.0

    # DCA fields (restructured)
    dca_enabled: bool = False
    dca_settings: List[DCAConfiguration] = Field(default_factory=list)

    # Blockchain-Synced Wallet fields (unchanged)
    is_blockchain_synced: bool = False
    wallet_address: Optional[str] = None
    synced_transactions: List[dict] = Field(default_factory=list)
    current_btc_balance: float = 0.0

class Wallet(WalletBase, Document):
    class Settings:
        name = "wallets"

class WalletCreate(WalletBase):
    pass

class WalletOut(WalletBase):
    id: str
    created_at: Optional[datetime] = None # Still Optional for backward compatibility
