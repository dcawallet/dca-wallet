from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI", "mongodb://mongo:27018"))

db = client["dcawallet_db"]
wallets_collection = db["wallets"]
transactions_collection = db["transactions"]
