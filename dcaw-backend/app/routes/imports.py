from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Optional, List
from app.core.security import get_current_user
from app.models.models import User
from app.models.wallet import WalletCreate, WalletOut
from app.models.transaction import TransactionCreate, TransactionOut
from app.db.connection import db
from app.services.csv_importer import CoinMarketCapCSVImporter
from datetime import datetime
from bson import ObjectId

import_router = APIRouter()

@import_router.post(
    "/coinmarketcap",
    response_model=List[TransactionOut],
    summary="Import CoinMarketCap CSV transactions",
    description="Upload a CoinMarketCap CSV file to create a new BTC wallet or add transactions to an existing one. Only BTC transactions are supported."
)
async def import_coinmarketcap_csv(
    file: UploadFile = File(..., description="CoinMarketCap CSV export file containing BTC transactions."),
    new_wallet_label: Optional[str] = Form(None, description="Provide a label if creating a new wallet. Required if wallet_id is not provided."),
    wallet_id: Optional[str] = Form(None, description="ID of an existing BTC wallet to add transactions to. Required if new_wallet_label is not provided."),
    current_user: User = Depends(get_current_user)
):
    """
    Handles the upload of a CoinMarketCap CSV file.
    Transactions can be imported into a new BTC wallet or an existing one.
    Validates CSV format and ensures only BTC transactions are processed.
    Automatically updates wallet BTC holdings.
    """
    if not new_wallet_label and not wallet_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'new_wallet_label' to create a new wallet or 'wallet_id' to use an existing wallet must be provided."
        )
    
    if new_wallet_label and wallet_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create a new wallet and specify an existing wallet ID at the same time. Choose one."
        )

    # Read CSV content
    csv_content = (await file.read()).decode("utf-8")

    try:
        parsed_transactions_data = CoinMarketCapCSVImporter.parse_csv(csv_content)
        if not parsed_transactions_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid BTC transactions found in the CSV file or CSV is empty after parsing."
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV parsing error: {e}"
        )

    target_wallet = None
    if wallet_id:
        if not ObjectId.is_valid(wallet_id):
            raise HTTPException(status_code=400, detail="Invalid Wallet ID format.")
        
        # Add user_id to the query to ensure ownership
        target_wallet = await db.db.wallets.find_one({"_id": ObjectId(wallet_id), "user_id": str(current_user.id)})
        if not target_wallet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found or does not belong to the current user.")
        
        # Ensure it's a BTC-focused wallet, if possible, or create a default if not specified
        if target_wallet.get("currency") != "USD": # Assuming CoinMarketCap CSV is USD-centric
             print(f"Warning: Wallet {wallet_id} is not primarily USD. Transactions will still be recorded in USD context.")

    else: # new_wallet_label is provided
        # Create a new BTC wallet for the user
        new_wallet_data = WalletCreate(
            label=new_wallet_label,
            currency="USD",
            btc_holdings=0.0, # Initial holdings will be calculated from imported transactions
            addresses=[], # CSV import doesn't provide addresses directly
            dca_enabled=False,
            dca_settings=[], # Initialize empty DCA settings
            is_blockchain_synced=False,
            wallet_address=None,
            synced_transactions=[],
            current_btc_balance=0.0,
            user_id=str(current_user.id) # Assign wallet to the current user
        )
        insert_result = await db.db.wallets.insert_one(new_wallet_data.dict(exclude_unset=True))
        target_wallet = await db.db.wallets.find_one({"_id": insert_result.inserted_id})
        if not target_wallet:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create new wallet.")
        target_wallet["id"] = str(target_wallet["_id"])
        print(f"New wallet created with ID: {target_wallet['id']}")


    wallet_obj_id = target_wallet["_id"]
    wallet_pydantic_id = str(wallet_obj_id)
    
    imported_transactions_out = []
    current_btc_holdings_for_wallet = target_wallet.get("btc_holdings", 0.0)

    for trans_data in parsed_transactions_data:
        # Assign wallet_id to each transaction
        trans_data["wallet_id"] = wallet_pydantic_id
        transaction = TransactionCreate(**trans_data)
        
        # Insert transaction into database
        insert_result = await db.db.transactions.insert_one(transaction.dict())
        inserted_transaction = await db.db.transactions.find_one({"_id": insert_result.inserted_id})
        
        # Convert _id to id for response
        inserted_transaction["id"] = str(inserted_transaction["_id"])
        del inserted_transaction["_id"]
        
        imported_transactions_out.append(TransactionOut(**inserted_transaction))

        # Update BTC holdings in memory for the current import
        if transaction.transaction_type == "cmc_buy":
            current_btc_holdings_for_wallet += transaction.amount_btc
        elif transaction.transaction_type == "cmc_sell":
            current_btc_holdings_for_wallet -= transaction.amount_btc
    
    # Update the wallet's total BTC holdings in the database
    await db.db.wallets.update_one(
        {"_id": wallet_obj_id},
        {"$set": {"btc_holdings": current_btc_holdings_for_wallet}}
    )

    return imported_transactions_out
