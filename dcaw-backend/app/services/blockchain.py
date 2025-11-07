import requests
from fastapi import HTTPException, status
import re

# Blockstream Esplora API endpoint
BLOCKSTREAM_API_URL = "https://blockstream.info/api"

def validate_btc_address(address: str) -> bool:
    """
    Validate a Bitcoin address using a simple regex.
    This is a basic check and doesn't verify the checksum.
    """
    # Regex for P2PKH, P2SH, and Bech32 addresses
    return re.match(r"^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$", address) is not None

async def fetch_transactions_from_blockchain(address: str) -> list:
    """
    Fetch confirmed transaction history for a Bitcoin address from Blockstream Esplora.
    """
    if not validate_btc_address(address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Bitcoin address: {address}",
        )
    
    try:
        response = requests.get(f"{BLOCKSTREAM_API_URL}/address/{address}/txs")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return [] # No transactions found, not an error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch data from blockchain explorer: {e}",
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error connecting to blockchain explorer: {e}",
        )
