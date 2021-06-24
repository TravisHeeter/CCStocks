# CCStocks

Scripts to help with buying and selling stocks on cookie clicker.

You need to jQuerify Cookie Clicker in order to use this. You can do that using this [bookmarklet](https://mreidsma.github.io/bookmarklets/jquerify.html) (You may need to reload the page and try again if CC has been up for a while).

## Use
Copy all the code, paste it in your browser's console, press Enter. (Only tested in Chrome)

Change the bankLevel to match your Bank's level. In the future this will occur automatically.


`> getBests()`

This gives you a list of options, and alerts any really good deals.

This is based on the wiki's [Stratgey](https://cookieclicker.fandom.com/wiki/Stock_Market#Strategy) section. Each stock has a base value equal to `10 * (i + 1) + bankLevel - 1` where i is the index (0-15) of the stock. Therefore, it's generally good to buy as low as possible, and sell when the stock reaches the base value or goes higher.

This also changes the View/Hide links to say be base value of the stock. This is so you can easily reference how a stock is doing in relation to the base Value.

`> buy( symbol,value )`
ex: `buy( "CHC",4.15 )`
Keeps a record of the stocks you own. Be sure to run this when you buy something. Also creates a new tick (a record of all the prices at a dateTime to give the report more data)

`> sell( symbol,value )`
ex: `buy( "CHC",40.15 )`
Removes the stock from your owned stocks. It is important to keep track of your owned stocks so that `getBests` knows how to help. In the future this will also add to a report.

`> new Report()`
This is not finished yet. Generates a report of each stock containing the average, high, low, and more.
