# DCA Wallet 🟠

A **watch-only**, **self-hosted**, and minimalist wallet to track your Bitcoin savings with a focus on DCA (Dollar-Cost Averaging) strategies, maintaining privacy and security — without sharing data with third parties.

> ⚠️ This project is under active development. Contributions are welcome!

---

## 🛠️ Development Requirements

Before getting started, make sure you have the following software installed:

* **Docker** and **Docker Compose**
  [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

* **Node.js** version **24.x.x**
  [https://nodejs.org/en/download](https://nodejs.org/en/download)

* **Python 3.11+**
  It is recommended to create a virtual environment with `venv` or `virtualenv`

---

## 📦 Project Structure

```shell
.
├── .github/
├── dca-backend # FastAPI + MongoDB
│ ├── app/
│ ├── Dockerfile
│ └── requirements.txt
│
├── dca-frontend # React + Vite (dev and app separated)
│ ├── dev/ # frontend source code, Node.js will run here
│ ├── app/ # production build (generated automatically with `npm run build`)
│ ├── Dockerfile
│ └── nginx.conf
│
├── docker-compose.yml
├── docs/
├── LICENSE
└── README.md
```

---

## 🚀 Running with Docker (production)

This command starts the **entire stack** (built frontend + backend + MongoDB):

```bash
docker-compose up --build
```

Access the services:

* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

> The backend has hot-reload enabled, so changes to Python code will be reflected automatically.

---

# 🧪 Local Development Environment

This guide explains how to set up the local environment to work with the application's **backend** and **frontend**. You can run one of the services (backend or frontend) via Docker and run the other manually, depending on your needs.

---

## 🚀 Option 1: Modify **Backend and Frontend**

If you want to work on both at the same time, start only **MongoDB** with Docker:

```bash
docker-compose up mongo
```

Then, run backend and frontend manually (details below).

---

## 🚀 Option 2: Modify only the **Frontend**

1. **Run Backend via Docker**

   ```bash
   docker-compose up backend mongo
   ```

   > The backend is configured with `--reload` by default.

2. **Run Frontend manually (Vite)**

   ```bash
   cd dca-frontend/dev
   npm install
   npm run dev
   ```

   > Access [http://localhost:3000](http://localhost:3000) — Vite will handle live reload.

---

## 🚀 Option 3: Modify only the **Backend**

1. **Run Frontend via Docker**

   ```bash
   docker-compose up frontend mongo
   ```

2. **Run Backend manually (FastAPI)**
   Navigate to the backend folder:

   ```bash
   cd dca-wallet/dca-backend
   ```

   Create and activate a Python virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

   Install the py libraries :

   ```bash
   pip install -r requirements.txt
   ```

   Start the server with auto-reload:

   ```bash
   uvicorn app.main:app --reload
   ```

---

## 🐳 Notes on Docker

* The frontend uses a Vite build strategy → `dca-frontend/app`
* The backend is mounted with a volume (`./dca-backend:/app`) and reflects changes automatically
* MongoDB persists data locally via the `mongo-data` volume

---

## 📄 License

This project is distributed under the MIT license.

---

## 🤝 Contributing

Soon we will add:

* Contribution guide (`CONTRIBUTING.md`)
* Issue and pull request templates
* Roadmap in GitHub Projects

In the meantime, feel free to open **issues** or submit **pull requests**!

---

## 📍 Project Roadmap

* Full DCA simulator
* Integration with wallets via xpub
* Chart exporting
* "Educational" mode for beginners

---
