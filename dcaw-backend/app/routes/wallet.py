from fastapi import APIRouter, HTTPException, Body, status, Depends
from app.models.wallet import WalletCreate, WalletOut, DCAConfiguration
from app.models.models import User # Import User model to use with get_current_user
from app.core.security import get_current_user # Import security dependency
from app.db.connection import db # Use db from connection instead of direct wallets_collection
from bson.objectid import ObjectId
from datetime import datetime
from typing import List, Optional

router = APIRouter()

@router.post("/", response_model=WalletOut, summary="Create a new wallet")
async def create_wallet(
    wallet: WalletCreate,
    current_user: User = Depends(get_current_user) # Protect endpoint
):
    """
    Create a new wallet with specified details for the authenticated user.
    """
    doc = wallet.dict(exclude_unset=True)
    doc["created_at"] = datetime.utcnow()
    doc["user_id"] = str(current_user.id) # Assign wallet to the current user
    
    # Ensure no price-related fields are saved, as per new standard
    doc.pop("usd_price", None)
    doc.pop("other_currency", None)
    doc.pop("other_currency_price", None)

    # If DCA is enabled but no settings provided, initialize empty list
    if doc.get("dca_enabled") and not doc.get("dca_settings"):
        doc["dca_settings"] = []

    result = await db.db.wallets.insert_one(doc)
    created_wallet = await db.db.wallets.find_one({"_id": result.inserted_id})
    if not created_wallet:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create wallet.")
    
    created_wallet["id"] = str(created_wallet["_id"])
    del created_wallet["_id"]
    return WalletOut(**created_wallet)

@router.get("/", response_model=List[WalletOut], summary="List all wallets for the current user")
async def list_wallets(current_user: User = Depends(get_current_user)): # Protect endpoint
    """
    Retrieve a list of all wallets belonging to the currently authenticated user.
    """
    wallets = []
    # Filter wallets by user_id
    for w in await db.db.wallets.find({"user_id": str(current_user.id)}).to_list(length=1000): # to_list for async
        w["id"] = str(w["_id"])
        del w["_id"]
        wallets.append(WalletOut(**w))
    return wallets

@router.get("/{wallet_id}", response_model=WalletOut, summary="Get a wallet by ID for the current user")
async def get_wallet(wallet_id: str, current_user: User = Depends(get_current_user)): # Protect endpoint
    """
    Retrieve a single wallet by its ID, ensuring it belongs to the authenticated user.
    """
    if not ObjectId.is_valid(wallet_id):
        raise HTTPException(status_code=400, detail="Invalid Wallet ID")
    
    # Add user_id to the query to ensure ownership
    wallet = await db.db.wallets.find_one({"_id": ObjectId(wallet_id), "user_id": str(current_user.id)})
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found or does not belong to the current user.")
    
    wallet["id"] = str(wallet["_id"])
    del wallet["_id"]
    return WalletOut(**wallet)

@router.put("/{wallet_id}/dca", response_model=WalletOut, summary="Configure DCA mode for a wallet")
async def configure_dca(
    wallet_id: str,
    dca_enabled: bool = Body(...),
    dca_settings: Optional[List[DCAConfiguration]] = Body(None),
    current_user: User = Depends(get_current_user) # Protect endpoint
):
    """
    Enable or disable DCA mode for a wallet and set its parameters.
    If dca_enabled is true, dca_settings should be provided.
    If dca_enabled is false, dca_settings will be cleared.
    """
    if not ObjectId.is_valid(wallet_id):
        raise HTTPException(status_code=400, detail="Invalid Wallet ID")

    # Check wallet ownership
    existing_wallet = await db.db.wallets.find_one({"_id": ObjectId(wallet_id), "user_id": str(current_user.id)})
    if not existing_wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found or does not belong to the current user.")

    update_fields = {"dca_enabled": dca_enabled}

    if dca_enabled:
        if dca_settings is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="dca_settings must be provided when dca_enabled is true."
            )
        update_fields["dca_settings"] = [s.dict() for s in dca_settings]
    else:
        update_fields["dca_settings"] = [] # Clear settings when DCA is disabled

    updated_wallet = await db.db.wallets.find_one_and_update(
        {"_id": ObjectId(wallet_id)},
        {"$set": update_fields},
        return_document=True
    )

    if not updated_wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found.") # Should not happen due to prior check
    
    updated_wallet["id"] = str(updated_wallet["_id"])
    del updated_wallet["_id"]
    return WalletOut(**updated_wallet)

@router.post("/blockchain-sync", response_model=WalletOut, summary="Create a blockchain-synced wallet")
async def create_blockchain_synced_wallet(
    label: str = Body(...),
    wallet_address: str = Body(...),
    currency: str = Body("USD"),
    notes: Optional[str] = Body(None),
    current_user: User = Depends(get_current_user) # Protect endpoint
):
    """
    Create a new wallet for the authenticated user by fetching data from the blockchain for a given address.
    """
    # Placeholder for blockchain data fetching
    synced_transactions = []
    current_btc_balance = 0.0

    wallet_data = {
        "label": label,
        "addresses": [wallet_address],
        "currency": currency,
        "notes": notes,
        "btc_holdings": current_btc_balance,
        "is_blockchain_synced": True,
        "wallet_address": wallet_address,
        "synced_transactions": synced_transactions,
        "current_btc_balance": current_btc_balance,
        "dca_enabled": False,
        "dca_settings": [], # Initialize empty DCA settings for blockchain-synced wallets
        "user_id": str(current_user.id) # Assign wallet to the current user
    }

    doc = WalletCreate(**wallet_data).dict(exclude_unset=True)
    doc["created_at"] = datetime.utcnow()
    result = await db.db.wallets.insert_one(doc)
    created_wallet = await db.db.wallets.find_one({"_id": result.inserted_id})
    if not created_wallet:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create blockchain-synced wallet.")
    
    created_wallet["id"] = str(created_wallet["_id"])
    del created_wallet["_id"]
    return WalletOut(**created_wallet)
