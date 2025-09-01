import csv
from datetime import datetime
from io import StringIO
from typing import List, Dict, Union, Optional

class CoinMarketCapCSVImporter:
    REQUIRED_HEADERS = [
        "Date (UTC-3:00)", "Token", "Type", "Price (USD)", "Amount",
        "Total value (USD)", "Fee", "Fee Currency", "Notes"
    ]
    DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

    @staticmethod
    def _clean_numeric_value(value: str) -> Optional[float]:
        """Cleans and converts a string to float, handling common CSV formats."""
        if not value or value.strip() in ["--", ""]:
            return None
        # Remove thousands separator and replace comma decimal with dot
        cleaned_value = value.replace(",", "").replace(" ", "").strip()
        try:
            return float(cleaned_value)
        except ValueError:
            return None # Or raise a more specific error

    @staticmethod
    def parse_csv(csv_content: str) -> List[Dict[str, Union[str, float, datetime, None]]]:
        """
        Parses CoinMarketCap CSV content and returns a list of dictionaries,
        each representing a transaction.
        Raises ValueError for invalid CSV format or non-BTC transactions.
        """
        f = StringIO(csv_content)
        reader = csv.reader(f)

        headers = next(reader)
        # Clean headers by stripping whitespace and removing byte order mark if present
        cleaned_headers = [h.strip().replace('\ufeff', '') for h in headers]
        
        if cleaned_headers != CoinMarketCapCSVImporter.REQUIRED_HEADERS:
            raise ValueError(f"CSV headers mismatch. Expected: {CoinMarketCapCSVImporter.REQUIRED_HEADERS}, Got: {cleaned_headers}")

        transactions_data = []
        for i, row in enumerate(reader):
            if not row: # Skip empty rows
                continue

            # Ensure row has enough columns
            if len(row) != len(CoinMarketCapCSVImporter.REQUIRED_HEADERS):
                raise ValueError(f"Row {i+2} has incorrect number of columns. Expected {len(CoinMarketCapCSVImporter.REQUIRED_HEADERS)}, got {len(row)}")

            try:
                date_str = row[0].strip()
                token = row[1].strip()
                transaction_type_str = row[2].strip().lower() # 'buy' or 'sell'
                price_usd_str = row[3].strip()
                amount_str = row[4].strip()
                total_value_usd_str = row[5].strip()
                fee_str = row[6].strip()
                fee_currency = row[7].strip() if row[7].strip() != "--" else None
                notes = row[8].strip() if row[8].strip() else None

                # Validate Token
                if token != "BTC":
                    # For a CSV with mixed tokens, we can skip non-BTC ones
                    # For strict validation, raise ValueError
                    print(f"Skipping row {i+2}: Only BTC transactions are supported. Found token: {token}")
                    continue

                # Convert types
                transaction_date = datetime.strptime(date_str, CoinMarketCapCSVImporter.DATE_FORMAT)
                price_usd = CoinMarketCapCSVImporter._clean_numeric_value(price_usd_str)
                amount = CoinMarketCapCSVImporter._clean_numeric_value(amount_str)
                total_value_usd = CoinMarketCapCSVImporter._clean_numeric_value(total_value_usd_str)
                fee = CoinMarketCapCSVImporter._clean_numeric_value(fee_str)

                if any(val is None for val in [price_usd, amount, total_value_usd]):
                    raise ValueError(f"Row {i+2}: Missing or invalid numeric data.")
                
                # Determine transaction type for the model
                if transaction_type_str == "buy":
                    final_transaction_type = "cmc_buy"
                elif transaction_type_str == "sell":
                    final_transaction_type = "cmc_sell"
                else:
                    raise ValueError(f"Row {i+2}: Invalid transaction type '{transaction_type_str}'. Expected 'buy' or 'sell'.")

                transactions_data.append({
                    "transaction_date": transaction_date,
                    "transaction_type": final_transaction_type,
                    "amount_btc": amount,
                    "price_per_btc_usd": price_usd,
                    "total_value_usd": total_value_usd,
                    "currency": "USD", # CMC exports are in USD
                    "fee": fee,
                    "fee_currency": fee_currency,
                    "notes": notes,
                    "txid": None # No txid from CMC CSV
                })
            except ValueError as e:
                raise ValueError(f"Error parsing row {i+2}: {e}")
            except Exception as e:
                raise ValueError(f"Unexpected error parsing row {i+2}: {e}")

        return transactions_data
