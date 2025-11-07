from fastapi import APIRouter, HTTPException, Body, status, Depends
from app.models.wallet import WalletCreate, WalletOut, DCAConfiguration
from app.models.models import User # Import User model to use with get_current_user
from app.core.security import get_current_user # Import security dependency
from app.price_fetcher import fetch_btc_historical_price
from app.services.blockchain import fetch_transactions_from_blockchain
from app.db.connection import db
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
    # Check if a wallet with this address already exists for the user
    existing_wallet = await db.db.wallets.find_one({
        "wallet_address": wallet_address,
        "user_id": str(current_user.id)
    })
    
    if existing_wallet:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A wallet with this address already exists. Use the reload endpoint to update."
        )

    # Fetch transactions from the blockchain
    transactions_data = await fetch_transactions_from_blockchain(wallet_address)
    
    # Process transactions to calculate balance and format for storage
    synced_transactions_for_wallet = []
    current_btc_balance = 0
    
    for tx in transactions_data:
        is_incoming = any(vout["scriptpubkey_address"] == wallet_address for vout in tx["vout"])
        
        amount = 0
        if is_incoming:
            amount = sum(vout["value"] for vout in tx["vout"] if vout["scriptpubkey_address"] == wallet_address)
        else:
            amount = -sum(vin["prevout"]["value"] for vin in tx["vin"] if vin["prevout"]["scriptpubkey_address"] == wallet_address)

        current_btc_balance += amount
        
        synced_transactions_for_wallet.append({
            "txid": tx["txid"],
            "amount": amount / 10**8,
            "timestamp": datetime.fromtimestamp(tx["status"]["block_time"]),
            "is_incoming": is_incoming,
        })
    
    current_btc_balance_btc = current_btc_balance / 10**8
    
    # Create new wallet
    wallet_data = {
        "label": label,
        "addresses": [wallet_address],
        "currency": currency,
        "notes": notes,
        "btc_holdings": current_btc_balance_btc,
        "is_blockchain_synced": True,
        "wallet_address": wallet_address,
        "synced_transactions": synced_transactions_for_wallet,
        "current_btc_balance": current_btc_balance_btc,
        "dca_enabled": False,
        "dca_settings": [],
    }

    doc = WalletCreate(**wallet_data).dict(exclude_unset=True)
    doc["created_at"] = datetime.utcnow()
    doc["user_id"] = str(current_user.id)
    result = await db.db.wallets.insert_one(doc)
    created_wallet_doc = await db.db.wallets.find_one({"_id": result.inserted_id})
    
    if not created_wallet_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create blockchain-synced wallet."
        )
    
    wallet_id = str(created_wallet_doc["_id"])

    # Now, create the transaction documents
    for tx_data in transactions_data:
        # Check for duplicates in the transactions collection
        if not await db.db.transactions.find_one({"txid": tx_data["txid"]}):
            is_incoming = any(vout["scriptpubkey_address"] == wallet_address for vout in tx_data["vout"])
            
            amount = 0
            if is_incoming:
                amount = sum(vout["value"] for vout in tx_data["vout"] if vout["scriptpubkey_address"] == wallet_address)
            else:
                amount = -sum(vin["prevout"]["value"] for vin in tx_data["vin"] if vin["prevout"]["scriptpubkey_address"] == wallet_address)

            transaction_date = datetime.fromtimestamp(tx_data["status"]["block_time"])
            price_at_transaction_date = await fetch_btc_historical_price(transaction_date)
            
            new_transaction_doc = {
                "wallet_id": wallet_id,
                "transaction_type": "blockchain_in" if is_incoming else "blockchain_out",
                "amount_btc": amount / 10**8,
                "price_per_btc_usd": price_at_transaction_date,
                "total_value_usd": (amount / 10**8) * price_at_transaction_date,
                "transaction_date": transaction_date,
                "txid": tx_data["txid"],
            }
            await db.db.transactions.insert_one(new_transaction_doc)
            
    created_wallet_doc["id"] = wallet_id
    del created_wallet_doc["_id"]
    return WalletOut(**created_wallet_doc)


@router.post("/reload-synced", summary="Reload and update synced wallets")
async def reload_synced_wallets(
    addresses: List[str] = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """
    Reload and update one or more blockchain-synced wallets with new transactions.
    """
    reloaded_wallets = []
    
    for address in addresses:
        wallet = await db.db.wallets.find_one({
            "wallet_address": address,
            "user_id": str(current_user.id),
            "is_blockchain_synced": True
        })
        
        if not wallet:
            continue
            
        transactions_data = await fetch_transactions_from_blockchain(address)
        
        existing_tx_ids_in_wallet = {tx["txid"] for tx in wallet.get("synced_transactions", [])}
        
        new_transactions_to_sync = []
        new_btc_balance = wallet.get("btc_holdings", 0.0) * 10**8
        
        for tx in transactions_data:
            if tx["txid"] not in existing_tx_ids_in_wallet:
                # Check for txid existence in the main transactions collection to prevent duplicates
                existing_transaction = await db.db.transactions.find_one({"txid": tx["txid"]})
                if existing_transaction:
                    continue

                is_incoming = any(vout["scriptpubkey_address"] == address for vout in tx["vout"])
                
                amount = 0
                if is_incoming:
                    amount = sum(vout["value"] for vout in tx["vout"] if vout["scriptpubkey_address"] == address)
                else:
                    amount = -sum(vin["prevout"]["value"] for vin in tx["vin"] if vin["prevout"]["scriptpubkey_address"] == address)

                new_btc_balance += amount
                
                # Fetch historical price for the transaction date
                transaction_date = datetime.fromtimestamp(tx["status"]["block_time"])
                price_at_transaction_date = await fetch_btc_historical_price(transaction_date)
                
                # Create a new transaction document
                new_transaction_doc = {
                    "wallet_id": str(wallet["_id"]),
                    "transaction_type": "blockchain_in" if is_incoming else "blockchain_out",
                    "amount_btc": amount / 10**8,
                    "price_per_btc_usd": price_at_transaction_date,
                    "total_value_usd": (amount / 10**8) * price_at_transaction_date,
                    "transaction_date": transaction_date,
                    "txid": tx["txid"],
                }
                
                # Insert into the transactions collection
                await db.db.transactions.insert_one(new_transaction_doc)
                
                # Append to the list for wallet's synced_transactions
                new_transactions_to_sync.append({
                    "txid": tx["txid"],
                    "amount": amount / 10**8,
                    "timestamp": datetime.fromtimestamp(tx["status"]["block_time"]),
                    "is_incoming": is_incoming,
                })

        if new_transactions_to_sync:
            await db.db.wallets.update_one(
                {"_id": wallet["_id"]},
                {
                    "$push": {"synced_transactions": {"$each": new_transactions_to_sync}},
                    "$set": {"btc_holdings": new_btc_balance / 10**8}
                }
            )
        
        reloaded_wallet = await db.db.wallets.find_one({"_id": wallet["_id"]})
        reloaded_wallet["id"] = str(reloaded_wallet["_id"])
        del reloaded_wallet["_id"]
        reloaded_wallets.append(WalletOut(**reloaded_wallet))
        
    return reloaded_wallets
