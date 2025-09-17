# DCA Wallet – BTC Price & Portfolio History To-Do List

1.  **Create route to get btc price to FE**
-   Create `update_prices` function and route
-   Add front end to fetch and save in session every minute
-   

2.  **Import Historical BTC Prices**
-   Get free dataset (CoinGecko, CryptoCompare, Yahoo Finance)
-   Create `btc_prices` collection in MongoDB with date and price\_usd
-   Add index on date for fast queries
-   Only price in USD per date

3.  **Update BTC Price in Real-Time**
-   Update `btc_prices` or a separate collection
-   Ensure script runs locally only, and daily

4.  **Compute Daily Portfolio Value**
-   Calculate daily BTC balance per wallet from `transactions` and add to wallet (i think thats already working, double check)
-   Join balance with BTC price by date
-   Compute daily portfolio value and save results if needed

5.  **Analytics / Visualization**
-   Generate daily and monthly performance, gains/losses
-   Feed data to frontend charts in React + TypeScript

6. ** Goose tasks **
-   Re-analyze BE routes and functions, to fix and update api_examples.md
-   Generate .goosehints for backend, and unite witrh be_documentaion to get a technical description about backend, and save in a prompt for future uses

7. ** Add multiple **