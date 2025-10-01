# DCA Wallet Backend Documentation 🟠

This document contains **technical documentation for the backend** of the DCA Wallet project, built with **FastAPI** and **MongoDB**.

---

## 📦 Backend Project Structure

```
.
├── api_examples.md
├── app
│   ├── core
│   │   ├── config.py          # Environment variables and application configuration
│   │   └── security.py        # Security, JWT handling
│   ├── db
│   │   ├── client.py          # MongoDB client instance
│   │   ├── connection.py      # Database connection setup
│   │   └── repositories.py    # Database operations abstraction
│   ├── main.py                # FastAPI entrypoint
│   ├── models
│   │   ├── models.py          # Shared base models
│   │   ├── transaction.py     # Transaction schema/model
│   │   └── wallet.py          # Wallet schema/model
│   ├── price_fetcher.py       # Bitcoin price fetcher (CoinGecko, etc.)
│   ├── routes
│   │   ├── auth.py            # Authentication routes
│   │   ├── imports.py         # CSV import routes
│   │   ├── transaction.py     # Transaction routes
│   │   ├── user.py            # User routes
│   │   └── wallet.py          # Wallet routes
│   └── services
│       ├── csv_importer.py    # CSV parsing and import service
│       ├── dca_service.py     # DCA strategy logic
├── bitcoin_price.json         # Cached BTC price reference
├── Dockerfile
├── documentation.md
└── requirements.txt           # Python dependencies
```

---

## ⚙️ Environment Variables (.env)

The backend requires a `.env` file inside `dca-backend/` with the following variables:

```
MONGO_URI='mongodb://localhost:27018/'
DATABASE_NAME='dcawallet_db'
JWT_SECRET_KEY='supersecretjwtkey'
JWT_ALGORITHM='HS256'
ACCESS_TOKEN_EXPIRE_MINUTES='30'
```

> Note: Use the internal service name (`mongo`) and default port (`27017`) when connecting from within Docker Compose.

---

## 🚀 Running Backend Locally

1. **Start MongoDB via Docker**

   ```bash
   docker-compose up mongo
   ```

2. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run FastAPI with auto-reload**

   ```bash
   uvicorn app.main:app --reload
   ```

Access the API docs at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧩 Key Components

* **Authentication**: JWT-based, handled in `app/core/security.py` and `routes/auth.py`.
* **Database**: MongoDB connection handled by `db/client.py` and `db/connection.py`.
* **DCA Service**: Logic for automated DCA transactions implemented in `services/dca_service.py`.
* **CSV Importer**: Load transactions from external files in `services/csv_importer.py`.
* **Price Fetcher**: Fetches and caches Bitcoin price in `bitcoin_price.json` using `price_fetcher.py`.

---

## 🐳 Docker Notes (Backend Only)

* The backend container is mounted with `./dca-backend:/app` to enable hot-reload.
* MongoDB persists data via the `mongo-data` volume.
* To connect from **host → MongoDB container**, use:

  ```
  mongodb://localhost:27018/
  ```
* To connect from **backend container → MongoDB container**, use:

  ```
  mongodb://mongo:27017/
  ```

---

## 📑 API Examples

See `api_examples.md` for request/response samples of the main endpoints.
