from fastapi import APIRouter, HTTPException
from app.models.transaction import TransactionCreate, TransactionOut
from app.models.wallet import WalletOut # Import WalletOut to update wallet holdings
from app.db.client import transactions_collection, wallets_collection
from bson.objectid import ObjectId
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/", response_model=TransactionOut, summary="Add a new manual transaction")
async def create_transaction(transaction: TransactionCreate):
    """
    Add a new manual transaction to a wallet.
    This will also update the BTC holdings of the associated wallet.
    """
    if not ObjectId.is_valid(transaction.wallet_id):
        raise HTTPException(status_code=400, detail="Invalid Wallet ID")

    wallet = wallets_collection.find_one({"_id": ObjectId(transaction.wallet_id)})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    # Update wallet BTC holdings based on transaction type
    current_btc_holdings = wallet.get("btc_holdings", 0.0)
    if transaction.transaction_type == "manual_buy":
        new_btc_holdings = current_btc_holdings + transaction.amount_btc
    elif transaction.transaction_type == "manual_sell":
        new_btc_holdings = current_btc_holdings - transaction.amount_btc
    else:
        # For other transaction types (e.g., blockchain_in/out, dca_buy),
        # the BTC holdings might be updated differently or not at all via this endpoint.
        # For manual transactions, we only consider buy/sell for now.
        new_btc_holdings = current_btc_holdings

    # Update the wallet's btc_holdings
    wallets_collection.update_one(
        {"_id": ObjectId(transaction.wallet_id)},
        {"$set": {"btc_holdings": new_btc_holdings}}
    )

    doc = transaction.dict()
    doc["created_at"] = datetime.utcnow()
    result = transactions_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return doc

@router.get("/{wallet_id}", response_model=List[TransactionOut], summary="List transactions for a wallet")
def list_transactions_for_wallet(wallet_id: str):
    """
    Retrieve a list of all transactions for a specific wallet.
    """
    if not ObjectId.is_valid(wallet_id):
        raise HTTPException(status_code=400, detail="Invalid Wallet ID")
    
    transactions = []
    for t in transactions_collection.find({"wallet_id": wallet_id}).sort("transaction_date", -1):
        t["id"] = str(t["_id"])
        del t["_id"]
        transactions.append(TransactionOut(**t))
    return transactions
