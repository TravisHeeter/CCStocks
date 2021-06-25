/****
 **
 ** Remember to JQuerify the page first!
 **
 */

if (typeof bankLevel == "undefined") {
  var bankLevel = 2
}
if (typeof hist == "undefined") {
  var hist = []
}
if (typeof symbols == "undefined") {
  var symbols = $(".bankGood .bankSymbol")
    .map((i, v) => $(v).clone().children().remove().end().text())
    .toArray()
    .filter((s) => !s.includes(":") && !["Buy", "Sell"].includes(s))
}

if (typeof ownedStocks == "undefined") {
  var ownedStocks = {
    BTR: 3.59,
    CNM: 58.4,
    CRM: 68.06,
    EGG: 58.8,
    SLT: 4.69,
    SUG: 26.69,
    WCH: 96.9
  }
}

function getVal(i) {
  let val = $(`#bankGood-${i}-val`).text()
  // remove the dollar sign, and convert to Int
  return parseFloat(val.slice(1, val.length), 10)
}

class Stock {
  constructor(i) {
    this.cVal = getVal(i) // current value
    this.bVal = 10 * (i + 1) + bankLevel - 1 // base value
    this.name = symbols[i].trim()
    this.oVal = -1
    this.priceDel = -1
    if (ownedStocks[this.name]) {
      this.oVal = ownedStocks[this.name]
      this.priceDel = Math.round((this.cVal - this.oVal) * 100) / 100
    }
    this.pc = Math.round((this.cVal / this.bVal) * 100) // How close to base value the current prive is, expressed as a percentage
    this.i = i
    $(`#bankGood-${i}-viewHide`).text(this.bVal)

    // Stats
    this.p = hist.map((tick) => tick.stocks.o[this.name].cVal)
    if (this.p.length) {
      this.s = this.p.reduce((sum, value) => sum + parseFloat(value, 10), 0)
      this.l = this.p.length
      this.a = Math.round((this.s / this.l) * 100) / 100
      this.hi = Math.max(...this.p)
      this.lo = Math.min(...this.p)
      this.sd =
        Math.round(
          Math.sqrt(
            this.p
              .map((x) => Math.pow(parseFloat(x, 10) - this.a, 2))
              .reduce((a, b) => a + b) / this.l
          ) * 100
        ) / 100

      // Stats for prices higher than average
      this.hp = this.p.filter((p) => p > this.a)
      this.hs = this.hp.reduce((sum, value) => sum + parseFloat(value, 10), 0)
      this.hl = this.hp.length
      this.ha = Math.round((this.hs / this.hl) * 100) / 100
      this.hlo = Math.min(...this.hp)
      this.hsd =
        Math.round(
          Math.sqrt(
            this.hp
              .map((x) => Math.pow(parseFloat(x, 10) - this.ha, 2))
              .reduce((a, b) => a + b) / this.hp.length
          ) * 100
        ) / 100

      // Stats for prices lower than average
      this.lp = this.p.filter((p) => p < this.a)
      this.ls = this.lp.reduce((sum, value) => sum + parseFloat(value, 10), 0)
      this.ll = this.lp.length
      this.la = Math.round((this.ls / this.ll) * 100) / 100
      this.lhi = Math.max(...this.lp)
      this.lsd =
        Math.round(
          Math.sqrt(
            this.lp
              .map((x) => Math.pow(parseFloat(x, 10) - this.la, 2))
              .reduce((a, b) => a + b) / this.lp.length
          ) * 100
        ) / 100

      this.r = `C:$${this.cVal}, H:$${this.hi}, L:$${this.lo}, D:$${
        this.hi - this.lo
      }, p:${this.l}, M:$${this.a}, SD: ${this.sd}, M+-SD:$${
        this.a - this.sd
      } - $${this.a + this.sd} HiP:${this.hl}, HM:$${this.ha}, LoHi:$${
        this.hlo
      }, HSD:${this.hsd}, HM+-HSD:$${this.ha - this.hsd} - $${
        this.ha + this.hsd
      }, LoP:${this.ll}, LM:${this.la}, HiLo:$${this.lhi}, LSD:${
        this.lsd
      }, LM+-LSD:$${this.la - this.lsd} - ${this.la + this.lsd}`
    } else {
      this.s =
        "There is no historical data (we're looking for the variable, `hist`)"
      this.l =
        "There is no historical data (we're looking for the variable, `hist`)"
      this.a =
        "There is no historical data (we're looking for the variable, `hist`)"
      this.h =
        "There is no historical data (we're looking for the variable, `hist`)"
      this.l =
        "There is no historical data (we're looking for the variable, `hist`)"
      this.sd =
        "There is no historical data (we're looking for the variable, `hist`)"
    }
  }
}

class Stocks {
  constructor() {
    this.a = symbols.map((symbol, i) => new Stock(i)).sort(compare)
    this.o = {}

    // build the object
    this.a.every((stock) => (this.o[stock.name] = stock))
  }
}

class Tran {
  constructor(s, v) {
    this.symbol = s
    this.value = v
    this.dt = new Date()
  }
}

function compare(a, b) {
  if (a.percent < b.percent) {
    return -1
  }
  if (a.percent > b.percent) {
    return 1
  }
  return 0
}

function getBestBuy(stocks) {
  let unownedStocks = stocks.a.filter((stock) => stock.oVal == -1)
  return unownedStocks
    .filter((stock) => stock.pc < 80)
    .map((stock, i) => {
      if (stock.c < stock.a - stock.lsd)
        alert(
          `${stock.name} is less than 1 LSD away from the average (This is rare). PC: ${stock.pc}, C: ${stock.cVal}, M: ${stock.a}, SD: ${stock.sd}, LM: ${stock.la}, LSD: ${stock.lsd}, all-time lo: ${stock.lo}`
        )
      return `${i + 1}: ${stock.name} at ${stock.pc}%`
    })
}

function getBestSell(stocks) {
  let stocksIOwn = stocks.a.filter((stock) => stock.oVal != -1)
  return stocksIOwn
    .filter((stock) => stock.pc > 90) // don't show stocks whose percent of baseval isn't at least 90
    .map((stock, i) => {
      if (stock.pc >= 100)
        alert(
          `${stock.name} is at ${stock.pc}% of base value. Own Price: $${stock.oVal}; Current Price $${stock.cVal}; H: $${stock.hi}, L: $${stock.lo}, M: $${this.a}, SD: ${this.sd}, HiM: ${this.ha}, HiSD: ${stock.hsd}, all-time hi: ${stock.hi}`
        )
      return `${i + 1}: ${stock.name} is at ${
        stock.pc
      }% of Base Value. Own Price: $${stock.oVal}; Current Price $${
        stock.cVal
      }; Gain: $${stock.priceDel}, (${Math.round(
        (stock.priceDel / stock.oVal) * 100
      )}% of own price)`
    })
}

function getBests() {
  let stocks = new Stocks()
  new Tick(stocks)
  let bestBuys = getBestBuy(stocks)
  let bestSells = getBestSell(stocks)

  let bestArray = []
  bestArray = bestSells.length
    ? bestArray.concat([" >>>>> BEST SELLS <<<<< "]).concat(bestSells)
    : [" <<< No Good Sells >>> "]

  if (bestBuys.length)
    return bestArray.concat([" >>>>> BEST BUYS <<<<< "]).concat(bestBuys)
  else return bestArray.concat([" <<< No Good Buys >>> "])
}

class Tick {
  constructor(stocks = new Stocks()) {
    this.stocks = stocks
    this.dt = new Date()
    hist.push(this)
  }
}

function financial(x) {
  return Number.parseFloat(x).toFixed(2)
}

function buy(s, v) {
  new Tick()
  window.ownedStocks[s] = v
}
function sell(s) {
  new Tick()
  delete window.ownedStocks[s]
}

class Report {
  constructor(stocks = new Stocks()) {
    hist.push(new Tick())
    this.stocks = stocks
  }
}

class SR {
  constructor(sym) {
    this.report = new Report()
    return this.report.stocks.filter((e) => e.name == sym)
  }
}
