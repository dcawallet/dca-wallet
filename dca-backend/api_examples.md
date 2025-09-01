# Exemplos de Uso da API DCA Wallet Backend (cURL)

Este documento fornece exemplos detalhados de comandos `curl` para interagir com a API do DCA Wallet Backend, refletindo a estrutura de dados mais recente e as melhores práticas.

**Base URL:** `http://localhost:8000/api`

---

## Autenticação

### 1. Registrar um Novo Usuário (`POST /api/auth/register`)

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
-H "Content-Type: application/json" \
-d '{
  "username": "novo_usuario",
  "email": "novo_usuario@example.com",
  "password": "senha_segura"
}'
```

### 2. Login de Usuário e Obtenção de Token (`POST /api/auth/login`)

```bash
# Salve este token para usar nas próximas requisições.
# Exemplo de como salvar em uma variável de ambiente (Linux/macOS):
# TOKEN=$(curl -X POST "http://localhost:8000/api/auth/login" -H "Content-Type: application/json" -d '{"username": "novo_usuario", "password": "senha_segura"}' | jq -r .access_token)
# echo $TOKEN # Para verificar o token
# Para Windows (CMD):
# FOR /F "tokens=*" %i IN ('curl -X POST "http://localhost:8000/api/auth/login" -H "Content-Type: application/json" -d "{"username": "novo_usuario", "password": "senha_segura"}" ^| jq -r .access_token') DO SET TOKEN=%i
# echo %TOKEN%

curl -X POST "http://localhost:8000/api/auth/login" \
-H "Content-Type: application/json" \
-d '{
  "username": "novo_usuario",
  "password": "senha_segura"
}'
```

---

## Wallets (Carteiras)

Para as rotas de carteira, você precisará do `ACCESS_TOKEN` obtido no login.

### 1. Criar uma Carteira Básica (`POST /api/wallets/`)

```bash
# Substitua $TOKEN pelo seu token JWT real
curl -X POST "http://localhost:8000/api/wallets/" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "label": "Minha Carteira Principal",
  "currency": "USD",
  "notes": "Carteira para acompanhamento geral."
}'
```

### 2. Criar uma Carteira com Moeda Diferente (`POST /api/wallets/`)

```bash
# Note: 'currency' agora define a moeda principal da carteira, não uma moeda de precificação secundária.
# Substitua $TOKEN pelo seu token JWT real
curl -X POST "http://localhost:8000/api/wallets/" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "label": "Carteira em BRL",
  "currency": "BRL",
  "notes": "Carteira para holdings em BTC precificados em BRL."
}'
```

### 3. Criar uma Carteira Sincronizada com Blockchain (`POST /api/wallets/blockchain-sync`)

```bash
# Substitua $TOKEN pelo seu token JWT real
curl -X POST "http://localhost:8000/api/wallets/blockchain-sync" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "label": "Carteira BTC Sincronizada",
  "wallet_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "currency": "USD",
  "notes": "Carteira que buscará transações na blockchain (funcionalidade futura)."
}'
```

### 4. Listar Todas as Carteiras (`GET /api/wallets/`)

```bash
# Substitua $TOKEN pelo seu token JWT real
curl -X GET "http://localhost:8000/api/wallets/" \
-H "Authorization: Bearer $TOKEN"
```

### 5. Obter Detalhes de uma Carteira Específica (`GET /api/wallets/{wallet_id}`)

```bash
# Substitua YOUR_WALLET_ID_HERE pelo ID de uma carteira existente
# Substitua $TOKEN pelo seu token JWT real
curl -X GET "http://localhost:8000/api/wallets/YOUR_WALLET_ID_HERE" \
-H "Authorization: Bearer $TOKEN"
```

### 6. Configurar Modo DCA para uma Carteira (`PUT /api/wallets/{wallet_id}/dca`)

```bash
# Substitua YOUR_WALLET_ID_HERE pelo ID da carteira que deseja configurar
# Substitua $TOKEN pelo seu token JWT real
curl -X PUT "http://localhost:8000/api/wallets/YOUR_WALLET_ID_HERE/dca" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "dca_enabled": true,
  "dca_settings": [
    {
      "dca_amount": 50.0,
      "dca_currency": "USD",
      "dca_frequency": "monthly",
      "dca_price_range_min": 65000.0,
      "dca_price_range_max": 75000.0
    },
    {
      "dca_amount": 0.0001,
      "dca_currency": "BTC",
      "dca_frequency": "weekly",
      "dca_price_range_min": null,
      "dca_price_range_max": null
    }
  ]
}'
```

### 7. Desativar Modo DCA para uma Carteira (`PUT /api/wallets/{wallet_id}/dca`)

```bash
# Substitua YOUR_WALLET_ID_HERE pelo ID da carteira que deseja desativar o DCA
# Substitua $TOKEN pelo seu token JWT real
curl -X PUT "http://localhost:8000/api/wallets/YOUR_WALLET_ID_HERE/dca" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "dca_enabled": false,
  "dca_settings": []
}'
```

---

## Transactions (Transações)

Para as rotas de transação, você precisará do `ACCESS_TOKEN` obtido no login.

### 1. Adicionar uma Transação Manual de Compra (`POST /api/transactions/`)

```bash
# Substitua YOUR_WALLET_ID_HERE pelo ID de uma carteira existente
# Substitua $TOKEN pelo seu token JWT real
curl -X POST "http://localhost:8000/api/transactions/" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "wallet_id": "YOUR_WALLET_ID_HERE",
  "transaction_type": "manual_buy",
  "amount_btc": 0.0005,
  "price_per_btc_usd": 70000.00,
  "total_value_usd": 35.0,
  "currency": "USD",
  "notes": "Compra manual de BTC para a carteira."
}'
```

### 2. Adicionar uma Transação Manual de Venda (`POST /api/transactions/`)

```bash
# Substitua YOUR_WALLET_ID_HERE pelo ID de uma carteira existente
# Substitua $TOKEN pelo seu token JWT real
curl -X POST "http://localhost:8000/api/transactions/" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "wallet_id": "YOUR_WALLET_ID_HERE",
  "transaction_type": "manual_sell",
  "amount_btc": 0.0001,
  "price_per_btc_usd": 72000.00,
  "total_value_usd": 7.2,
  "currency": "USD",
  "notes": "Venda manual de BTC da carteira."
}'
```

### 3. Listar Transações para uma Carteira Específica (`GET /api/transactions/{wallet_id}`)

```bash
# Substitua YOUR_WALLET_ID_HERE pelo ID de uma carteira existente
# Substitua $TOKEN pelo seu token JWT real
curl -X GET "http://localhost:8000/api/transactions/YOUR_WALLET_ID_HERE" \
-H "Authorization: Bearer $TOKEN"
```

---

## User Information (Informações do Usuário)

Para as rotas de informação do usuário, você precisará do `ACCESS_TOKEN` obtido no login.

### 1. Obter Informações do Usuário Atual (`GET /api/user/me`)

```bash
# Substitua $TOKEN pelo seu token JWT real
curl -X GET "http://localhost:8000/api/user/me" \
-H "Authorization: Bearer $TOKEN"
```

### 2. Atualizar Informações do Usuário Atual (`PATCH /api/user/me`)

```bash
# Substitua $TOKEN pelo seu token JWT real
curl -X PATCH "http://localhost:8000/api/user/me" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "full_name": "Nome Completo do Usuário",
  "profile_picture": "https://example.com/new-profile.jpg",
  "country": "Brazil",
  "language": "pt-BR",
  "currencies": ["USD", "EUR", "BRL"]
}'
```

---

## Data Import (Importação de Dados)

Para as rotas de importação de dados, você precisará do `ACCESS_TOKEN` obtido no login.

### 1. Importar Transações do CoinMarketCap CSV para uma Nova Carteira (`POST /api/import/coinmarketcap`)

Este exemplo cria um arquivo CSV temporário no diretório atual e o usa para o upload.
Substitua `test_transactions_new_wallet.csv` pelo nome desejado do seu arquivo CSV.

```bash
# Crie um arquivo CSV de exemplo (test_transactions_new_wallet.csv) com o conteúdo abaixo:
# Date (UTC-3:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes
# "2025-07-04 11:45:00","BTC","buy","108054.81","0.0004821","52.10","0.05","USD","Compra via CSV 1"
# "2025-06-07 11:45:00","BTC","buy","105599.13","0.0001670","17.64","0.02","USD","Compra via CSV 2"
# "2025-05-15 10:00:00","BTC","sell","110000.00","0.0001","11.00","0.01","USD","Venda via CSV 1"

# Exemplo de criação do arquivo CSV no terminal (Linux/macOS):
cat <<EOF > test_transactions_new_wallet.csv
Date (UTC-3:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes
"2025-07-04 11:45:00","BTC","buy","108054.81","0.0004821","52.10","0.05","USD","Compra via CSV 1"
"2025-06-07 11:45:00","BTC","buy","105599.13","0.0001670","17.64","0.02","USD","Compra via CSV 2"
"2025-05-15 10:00:00","BTC","sell","110000.00","0.0001","11.00","0.01","USD","Venda via CSV 1"
EOF

# Substitua $TOKEN pelo seu token JWT real
curl -X POST "http://localhost:8000/api/import/coinmarketcap" \
-H "Authorization: Bearer $TOKEN" \
-F "file=@test_transactions_new_wallet.csv;type=text/csv" \
-F "new_wallet_label=Carteira Importada CMC"
```

### 2. Importar Transações do CoinMarketCap CSV para uma Carteira Existente (`POST /api/import/coinmarketcap`)

Este exemplo adiciona transações a uma carteira BTC já existente. Certifique-se de substituir `YOUR_WALLET_ID_HERE` pelo ID da sua carteira.

```bash
# Reutilize o arquivo CSV de exemplo criado anteriormente, ou crie um novo:
# Date (UTC-3:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes
# "2025-07-01 09:00:00","BTC","buy","107000.00","0.0003","32.10","0.03","USD","Compra via CSV para existente"

# Exemplo de criação de outro arquivo CSV no terminal (Linux/macOS):
cat <<EOF > additional_transactions.csv
Date (UTC-3:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes
"2025-07-01 09:00:00","BTC","buy","107000.00","0.0003","32.10","0.03","USD","Compra via CSV para existente"
EOF

# Substitua YOUR_WALLET_ID_HERE pelo ID de uma carteira existente (BTC)
# Substitua $TOKEN pelo seu token JWT real
curl -X POST "http://localhost:8000/api/import/coinmarketcap" \
-H "Authorization: Bearer $TOKEN" \
-F "file=@additional_transactions.csv;type=text/csv" \
-F "wallet_id=YOUR_WALLET_ID_HERE"
```
