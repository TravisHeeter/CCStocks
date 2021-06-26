/****
 **
 ** Remember to JQuerify the page first!
 **
 */

if (typeof bankLevel === "undefined") {
  var bankLevel = 3
}
if (typeof hist === "undefined") {
  var hist = []
}
if (typeof tHist === "undefined") {
  var tHist = []
}
if (typeof symbols === "undefined") {
  var symbols = $(".bankGood .bankSymbol")
    .map((i, v) => $(v).clone().children().remove().end().text().trim())
    .toArray()
    .filter((s) => !s.includes(":") && !["Buy", "Sell"].includes(s))
}

if (typeof ownedStocks === "undefined") {
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

if (typeof sRef === "undefined") {
  var sRef = {}
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

    // Stats
    // this.p = hist.map((tick) => tick.stocks.o[this.name].cVal)
    // Remove consecutive duplicates, if you want the raw data, use the previous one
    this.p = hist
      .map((tick) => tick.stocks.o[this.name].cVal)
      .filter((price, i, a) => price !== a[i + 1])
    if (this.p.length) {
      this.s = this.p.reduce((sum, value) => sum + parseFloat(value, 10), 0)
      this.l = this.p.length

      // Interquartile Range - used to determine outliers
      // 1. Orders the value from low to high
      this.lowToHigh = this.p.sort((a, b) => a - b)
      // 2. Finds the half-way & quarter point
      this.half = Math.round(this.l / 2)
      this.quart = Math.round(this.half / 2)
      // 3. Figures the index of quartiles 1 and 3
      this.q1index = this.half - this.quart - 1
      this.q3index = this.half + this.quart - 1
      // 4. Finds the values at those indexes
      this.q1 = this.lowToHigh[this.q1index]
      this.q3 = this.lowToHigh[this.q2index]
      // 5. Subtracts 1 from 3 to find the range
      this.iqr = this.q3 - this.q1

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
      if (this.hp.length) {
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
        this.hr = [
          `Current Value:$${this.cVal}, Mean:$${this.a}, High:$${
            this.hi
          }, Low:$${this.lo}, Hi-Lo Range:$${financial(
            this.hi - this.lo
          )}, Standard: ${this.sd}, Span:$${financial(
            this.a - this.sd
          )} - $${financial(this.a + this.sd)}, p:${this.l}`,
          `Hi Span:$${financial(this.ha - this.hsd)} - $${financial(
            this.ha + this.hsd
          )}, HiP:${this.hl}, HM:$${this.ha}, LoHi:$${this.hlo}, HSD:${
            this.hsd
          }`
        ]
        this.sellNoteRange = this.cVal >= this.ha - this.hsd
      }

      // Stats for prices lower than average
      this.lp = this.p.filter((p) => p < this.a)
      if (this.lp.length) {
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
        this.lr = [
          `C:$${this.cVal}, M:$${this.a}, H:$${this.hi}, L:$${
            this.lo
          }, HLSpan:$${financial(this.hi - this.lo)}, SD: ${
            this.sd
          }, SDRange:$${financial(this.a - this.sd)} - $${financial(
            this.a + this.sd
          )}, p:${this.l}`,
          `Low SDRange:$${financial(this.la - this.lsd)} - ${financial(
            this.la + this.lsd
          )}, LoP:${this.ll}, LM:${this.la}, HiLo:$${this.lhi}, LSD:${this.lsd}`
        ]
        this.buyNoteRange = this.cVal < this.la + this.lsd
        this.buyAlertRange = this.cVal < this.a - this.sd
      }

      this.r = [
        `C:$${this.cVal}, M:$${this.a}, H:$${this.hi}, L:$${
          this.lo
        }, HLSpan:$${financial(this.hi - this.lo)}, SD: ${
          this.sd
        }, M+-SD:$${financial(this.a - this.sd)} - $${financial(
          this.a + this.sd
        )}, p:${this.l}`,
        `HiP:${this.hl}, HM:$${this.ha}, LoHi:$${this.hlo}, HSD:${
          this.hsd
        }, HM+-HSD:$${financial(this.ha - this.hsd)} - $${financial(
          this.ha + this.hsd
        )}`,
        `LoP:${this.ll}, LM:${this.la}, HiLo:$${this.lhi}, LSD:${
          this.lsd
        }, LM+-LSD:$${financial(this.la - this.lsd)} - ${financial(
          this.la + this.lsd
        )}`
      ]

      // Change the View/Hide Button to Stat info
      $(`#bankGood-${i}-viewHide`)
        .html(`${this.bVal}<p></p>${this.a}<p></p>${this.sd}`)
        .css("background", "black")
      // Change the font size of other info
      $(".bankGood .bankSymbol")
        .css("font", "700 12px / 12px Tahoma, Arial, sans-serif")
        .css("text-align", "left")
      //
      $(".bankGood .bankSymbol")
        .filter((i, v) => $(v).text().includes("value"))
        .map((i, v) =>
          $(v).text(
            $(v)
              .text()
              .substring($(v).text().indexOf("$"), $(v).text().length) +
              " | " +
              this.ownPrice
          )
        )
      $(".bankGood .icon").css("margin", "-16px 0 -16px 79px")
    } else {
      this.s =
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
  let buys = {}

  // Buy Note Range means the current value is within 1 sd of the low mean.
  unownedStocks
    .filter((stock) => stock.buyNoteRange)
    .every((stock, i) => {
      if (stock.buyAlertRange)
        alert(
          `BUY ${stock.name}!! It's less than 1 SD away from the mean (c:$${
            stock.cVal
          },m:$${stock.a},sd:$${stock.sd},a-sd:$${financial(
            stock.a - stock.sd
          )}), and at ${stock.pc}% of base value. Own Price: $${
            stock.oVal
          }; Report:: ${stock.lr}`
        )

      // Color the good buys blue
      $(`#bankGood-${stock.i}`).css("background", "#3836ab")

      buys[stock.name] = [
        `${i + 1}: ${stock.name} is ${stock.pc}% of base. Buying below $${rCent(
          (stock.a - stock.sd) / stock.bVal
        )}% would be rare.`,
        `  LoReport:: ${stock.lr}`
      ]
    })
  return buys
}

function getBestSell(stocks) {
  let stocksIOwn = stocks.a.filter((stock) => stock.oVal != -1)

  let sells = {}

  // sellNoteRange = cVal >= himean-hisd, so within one standard deviation of the high mean
  stocksIOwn
    .filter((stock) => stock.sellNoteRange) // only show stocks whose current value is within the high range
    .every((stock, i) => {
      if (stock.cVal > stock.ha + stock.sd)
        alert(
          `Consider selling ${
            stock.name
          }. It's over 1 HiSD away from the hiMean (c:$${stock.cVal}, m:$${
            stock.a
          }, sd:$${stock.sd}, Mean + SD:$${financial(
            stock.a + stock.sd
          )}), and at ${stock.pc}% of base value. 
          
          Own Price: $${stock.oVal}; 
          
          Report:: ${stock.hr}`
        )

      // color the background of good sells pink
      $(`#bankGood-${stock.i}`).css("background", "#8e006f")

      sells[stock.name] = [
        `${i + 1}: ${stock.name} is ${stock.pc}% of Base. Selling above ${rCent(
          (stock.a + stock.sd) / stock.bVal
        )}% is above 1 SD from mean (${rCent(
          (stock.cVal - (stock.a + stock.sd)) / stock.sd
        )}% of the sd above the sd). Own Price: $${stock.oVal}`,
        `  HiReport:: ${stock.hr}`
      ]
    })

  return sells
}

function rCent(n) {
  return Math.round(n * 100)
}

function getBests() {
  sRef = new Stocks()
  let stocks = sRef

  // Change the background colors back to black
  stocks.a.every((s, i) =>
    $(`#bankGood-${i}`).css("background", "rgba(0, 0, 0, 0.9)")
  )

  let tick = new Tick(stocks)
  let bestBuys = getBestBuy(stocks)
  let bestSells = getBestSell(stocks)
  let bests = {
    Buys: bestBuys,
    Sells: bestSells,
    Tick: tick
  }
  if (!Object.keys(bestBuys).length) delete bests.Buys
  if (!Object.keys(bestSells).length) delete bests.Sells

  return bests
}

class Tick {
  constructor(stocks = sRef, dt = new Date()) {
    this.stocks = stocks
    this.bankLevel = bankLevel
    this.dt = dt
    hist.push(this)
  }
}

function financial(x) {
  return Math.round(parseFloat(x) * 100) / 100
}

function getSymbolAndValue(s) {
  let i = typeof s === "string" ? sRef.o[s].i : s
  let v = getVal(i)
  s = typeof s === "string" ? s : symbols[s]
  if (!symbols.includes(s)) {
    console.error(`We couldn't find "${s}", please try again.`)
    return false
  } else {
    return [s, v]
  }
}

class Transaction {
  constructor(s, type) {
    let sv = getSymbolAndValue(s)
    let tick = new Tick()
    this.symbol = sv[0]
    this.dt = new Date()
    this.type = type
    this.stock = sRef.o[s]

    if (type == "b") ownedStocks[sv[0]] = sv[1]
    else delete ownedStocks[sv[0]]

    tHist.push(this)
    return this
  }
}
function bu(s) {
  return new Transaction(s, "b")
}
function se(s) {
  return new Transaction(s, "s")
}

class Report {
  constructor(stocks = sRef) {
    this.tick = new Tick(stocks)
    hist.push(this.tick)
  }
}

function sr(i) {
  if (typeof i !== "string") i = symbols[i]
  this.report = new Report()
  return this.report.tick.stocks.o[i].r
}
function b() {
  return getBests()
}
function exData() {
  let j = {}
  j.hist = hist
  j.ownedStocks = ownedStocks
  return JSON.stringify(j)
}
function imData(exportData) {
  let j = JSON.parse(exportData)
  j.hist.every((t) => new Tick(t.stocks, t.dt))
  ownedStocks = j.ownedStocks
}
