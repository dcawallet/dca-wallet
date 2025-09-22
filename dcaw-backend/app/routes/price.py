from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter()

@router.get("/bitcoin_price", summary="Retrieve current Bitcoin price data")
async def get_bitcoin_price():
    """
    Fetches the latest Bitcoin price data (USD, BRL, and calculated USD/BRL rates)
    from the cached `bitcoin_price.json` file.
    """
    file_path = "/home/joaobizzo/Documents/code/dcawallet/dca-wallet/dca-backend/bitcoin_price.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Bitcoin price data not found.")
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error decoding Bitcoin price data.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
