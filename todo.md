# DCA Wallet – BTC Price & Portfolio History To-Do List

DONE ✅
1.  **Create route to get btc price to FE**
-   Create `update_prices` function and route
-   Add front end to fetch and save in session every minute
-   

DONE ✅
2.  **Import Historical BTC Prices**
-   Get free dataset (CoinGecko)
-   Fetch every time user logins
-   Save in session

DONE ✅
4.  **Compute Daily Portfolio Value**
-   Calculate daily BTC balance per wallet from `transactions` and add to wallet - 
-   Join balance with BTC price by date
-   Compute daily portfolio value and save results if needed

DONE ✅
5.  **Analytics / Visualization**
-   Generate daily and monthly performance, gains/losses
-   Feed data to frontend charts in React + TypeScript

PS 4,5 :
this is working only on frontend:
(frontend gets transactions and btc price from backend, and show on dashboard, need to create logic to calculate the final json on backend, and send it dfone to front end (NM 7), and in the future save the hints? from it and add to some good data to train with ML (NM 8 ))


6. ** Goose tasks **
-   Re-analyze BE routes and functions, to fix and update api_examples.md
-   Generate .goosehints for backend, and unite witrh be_documentaion to get a technical description about backend, and save in a prompt for future uses

7. ** Change dashboard logic to calculate charts in backend **
-   

8. ** Save in mongo vailuable chart info to use with ML later  **
-   