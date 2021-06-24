/****
 **
 ** Remember to JQuerify the page first!
 **
 */

if (typeof bankLevel == "undefined") {
  let bankLevel = 2;
}
if (typeof hist == "undefined") {
  let hist = [];
}
if (typeof symbols == "undefined") {
  let symbols = getSymbols();
}
if (typeof ownedStocks == "undefined") {
  let ownedStocks = {
    CHC: 7.15,
    CKI: 74.31,
    VNL: 4.41,
    HNY: 15
  };
}

function getSymbols() {
  return $(".bankGood .bankSymbol")
    .map((i, v) => $(v).clone().children().remove().end().text())
    .toArray()
    .filter((s) => !s.includes(":") && !["Buy", "Sell"].includes(s));
}

function getVal(s) {
  return parseInt($(s).text().slice(1, $(s).text().length), 10);
}

class Stock {
  constructor(i) {
    let bankLevel = 2;
    this.cVal = getVal(`#bankGood-${i}-val`);
    this.bVal = 10 * (i + 1) + bankLevel - 1;
    this.pc = Math.round((this.cVal / this.bVal) * 100);
    this.i = i;
    this.name = symbols[i];
  }
}

class Stocks {
  constructor() {
    this.a = symbols.map((symbol, i) => new Stock(i)).sort(compare);
    this.o = {};

    // build the object
    this.a.every((stock) => (this.o[stock.name] = stock));
  }
}

class Tran {
  constructor(s, v) {
    this.symbol = s;
    this.value = v;
    this.dt = new Date();
  }
}

function compare(a, b) {
  if (a.percent < b.percent) {
    return -1;
  }
  if (a.percent > b.percent) {
    return 1;
  }
  return 0;
}

function getBestBuy(stockList) {
  let unownedStocks = stockList.sortedArray.filter(
    (stock) => stock.ownPrice == -1
  );
  return unownedStocks
    .filter((stock) => stock.pc < 80)
    .map((stock, i) => {
      if (stock.pc < 50)
        alert(
          `${stock.name} is a great buy at ${stock.pc}% of the base cost (Current Value: ${stock.cVal} / Base Value: ${stock.bVal}).`
        );
      return `${i + 1}: ${stock.name} at ${stock.pc}%`;
    });
}

function getBestSell(stockList) {
  let ownedArray = Object.keys(stockList.ownedStocks).map(
    (key) => stockList.o[key]
  );
  return ownedArray
    .sort(compare)
    .filter((stock) => stock.pc > 90)
    .map((stock, i) => {
      if (stock.pc >= 100)
        alert(
          `${stock.name} is at ${stock.pc}. Own Price: $${
            stock.ownPrice
          }; Current Price $${stock.cVal}; Gain: $${
            stock.priceDel
          };  (${Math.round(
            (stock.priceDel / stock.ownPrice) * 100
          )}% of own price)`
        );
      return `${i + 1}: ${stock.name} is at ${
        stock.pc
      }% of Base Value. Own Price: $${stock.ownPrice}; Current Price $${
        stock.cVal
      }; Gain: $${stock.priceDel}, (${Math.round(
        (stock.priceDel / stock.ownPrice) * 100
      )}% of own price)`;
    });
}

function getBests() {
  let stockList = getStocks();
  let bestBuys = getBestBuy(stockList);
  console.log(bestBuys);
  let bestSells = getBestSell(stockList);

  let bestArray = [];
  bestArray = bestSells.length
    ? bestArray.concat([" >>>>> BEST SELLS <<<<< "]).concat(bestSells)
    : [" <<< No Good Sells >>> "];

  if (bestBuys.length)
    return bestArray.concat([" >>>>> BEST BUYS <<<<< "]).concat(bestBuys);
  else return bestArray.concat([" <<< No Good Buys >>> "]);
}

class Tick {
  constructor() {
    this.stockList = getStocks();
    this.dt = new Date();
  }
}

function financial(x) {
  return Number.parseFloat(x).toFixed(2);
}

function buy(s, v) {
  new Tick();
  window.ownedStocks[s] = v;
}
function sell(s) {
  new Tick();
  delete window.ownedStocks[s];
}
