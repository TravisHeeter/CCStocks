/****
 **
 ** Remember to JQuerify the page first!
 **
 */

/****
 **
 ** Instructions
 ** Step 0: JQuerify
 ** Step 1: Copy this code and paste it in the console of Cookie Clicker
 ** Step 2: Run `getBests()`
 **
 */
// 
function getBests() {
  let stocks = new Stocks()

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




////////   JQuery to make the page to look better for stats   //////////
// Change the font size of other info
$(".bankGood .bankSymbol")
  .css("font", "700 12px / 12px Tahoma, Arial, sans-serif")
  .css("text-align", "left")

// Change the position of the icons
$(".bankGood .icon").css("margin", "-16px 0 -16px 79px")

var bankLevel = parseInt(
  $("#productLevel5")
    .text()
    .substring(
      $("#productLevel5").text().indexOf(" ") + 1,
      $("#productLevel5").text().length
    ),
  10
)
if (typeof hist === "undefined") var hist = []
if (typeof tHist === "undefined") var tHist = []
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
      $(`#bankGood-${i}`).css("background", "rgb(148 251 237)")
    }
    this.pc = Math.round((this.cVal / this.bVal) * 100) // How close to base value the current prive is, expressed as a percentage
    this.i = i

    // Stats
    // this.p = hist.map((tick) => tick.stocks.o[this.name].cVal)
    // Remove consecutive duplicates, if you want the raw data, use the previous one
    let p = hist
      .map((tick) => tick.a[this.i][0])
      .filter((price) => !Number.isNaN(price))
      .filter((price, i, a) => price !== a[i + 1])

    if (p.length) {
      this.s = p.reduce((sum, value) => sum + parseFloat(value, 10), 0)
      this.l = p.length

      // Interquartile Range - used to determine outliers
      // 1. Orders the value from low to high
      this.lowToHigh = p.sort((a, b) => a - b)
      // 2. Finds the half-way & quarter points
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
      this.hi = Math.max(...p)
      this.lo = Math.min(...p)
      this.sd =
        Math.round(
          Math.sqrt(
            p
              .map((x) => Math.pow(parseFloat(x, 10) - this.a, 2))
              .reduce((a, b) => a + b) / this.l
          ) * 100
        ) / 100

      // Stats for prices higher than average
      let hp = p.filter((p) => p > this.a)
      if (hp.length) {
        this.hs = hp.reduce((sum, value) => sum + parseFloat(value, 10), 0)
        this.hl = hp.length
        this.ha = Math.round((this.hs / this.hl) * 100) / 100
        this.hlo = Math.min(...hp)
        this.hsd =
          Math.round(
            Math.sqrt(
              hp
                .map((x) => Math.pow(parseFloat(x, 10) - this.ha, 2))
                .reduce((a, b) => a + b) / hp.length
            ) * 100
          ) / 100
        this.hr = () => {
          return [
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
        }
        this.sellNoteRange = this.cVal >= this.a + this.sd
        this.sellAlertRange = this.cVal >= this.a + this.sd * 2
      }

      // Stats for prices lower than average
      let lp = p.filter((price) => price < this.a)
      if (lp.length) {
        this.ls = lp.reduce((sum, value) => sum + parseFloat(value, 10), 0)
        this.ll = lp.length
        this.la = Math.round((this.ls / this.ll) * 100) / 100
        this.lhi = Math.max(...lp)
        this.lsd =
          Math.round(
            Math.sqrt(
              lp
                .map((x) => Math.pow(parseFloat(x, 10) - this.la, 2))
                .reduce((a, b) => a + b) / lp.length
            ) * 100
          ) / 100
        this.lr = () => {
          return [
            `C:$${this.cVal}, M:$${this.a}, H:$${this.hi}, L:$${
              this.lo
            }, HLSpan:$${financial(this.hi - this.lo)}, SD: ${
              this.sd
            }, SDRange:$${financial(this.a - this.sd)} - $${financial(
              this.a + this.sd
            )}, p:${this.l}`,
            `Low SDRange:$${financial(this.la - this.lsd)} - ${financial(
              this.la + this.lsd
            )}, LoP:${this.ll}, LM:${this.la}, HiLo:$${this.lhi}, LSD:${
              this.lsd
            }`
          ]
        }
        this.buyNoteRange = this.cVal <= this.a - this.sd
        this.buyAlertRange = this.cVal <= this.a - this.sd * 2
      }

      this.r = () => {
        return [
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
      }

      makeHtmlChanges(i, this)
    } else {
      this.s =
        "There is no historical data (we're looking for the variable, `hist`)"
    }
  }
}

function makeHtmlChanges(i, stock) {
  // Change the View/Hide Button to Stat info
  $(`#bankGood-${i}-viewHide`)
    .html(`${stock.bVal}<p></p>${stock.a}<p></p>${stock.sd}`)
    .css("background", "black")

  // Show the ownPrice next to the current price
  // 1. Get the parent element
  let prnt = $(`#bankGood-${i}-val`).closest("div")
  // 2. Delete any child spans other than the current price
  prnt
    .find("span")
    .filter((i, v) => i > 0)
    .remove()

  // 3. If the stock is owned, put the price on display next to the current value
  if (stock.oVal != -1) {
    // 4. Save the html for later
    let html = prnt.html()
    //5. Replace the html with itself plue the owned value
    prnt.html(
      `${html}<span id="coDivide-0"> | </span><span id="ownPrice-0">$${stock.oVal}</span>`
    )
  }
}

class Stocks {
  constructor() {
    this.o = {}
    this.a = symbols
      .map((symbol, i) => {
        let stock = new Stock(i)
        this.o[symbol] = stock
        return stock
      })
      .sort(compare)
    sRef = this
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

  // Buy Note Range means the current value is within 1 sd of the low mean.
  return unownedStocks
    .filter((stock) => stock.buyNoteRange)
    .map((stock, i) => {
      if (stock.buyAlertRange)
        alert(
          `BUY ${stock.name}!! It's less than 1 SD away from the mean (c:$${
            stock.cVal
          },m:$${stock.a},sd:$${stock.sd},a-sd:$${financial(
            stock.a - stock.sd
          )}), and at ${stock.pc}% of base value. Own Price: $${
            stock.oVal
          }; Report:: ${stock.lr()}`
        )

      // Color the good buys blue
      $(`#bankGood-${stock.i}`).css("background", "#3836ab")

      return [
        `${i + 1}: ${stock.name} is ${stock.pc}% of base. Buying below $${rCent(
          (stock.a - stock.sd) / stock.bVal
        )}% would be rare.`,
        `  LoReport:: ${stock.lr()}`
      ]
    })
}

function getBestSell(stocks) {
  let stocksIOwn = stocks.a.filter((stock) => stock.oVal != -1)

  // sellNoteRange = cVal >= himean-hisd, so within one standard deviation of the high mean
  return stocksIOwn
    .filter((stock) => stock.sellNoteRange) // only show stocks whose current value is within the high range
    .map((stock, i) => {
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
          
          Report:: ${stock.hr()}`
        )

      // color the background of good sells pink
      $(`#bankGood-${stock.i}`).css("background", "#8e006f")

      return [
        `${i + 1}: ${stock.name} is ${stock.pc}% of Base. Selling above ${rCent(
          (stock.a + stock.sd) / stock.bVal
        )}% is above 1 SD from mean (${rCent(
          (stock.cVal - (stock.a + stock.sd)) / stock.sd
        )}% of the sd above the sd). Own Price: $${stock.oVal}`,
        `  HiReport:: ${stock.hr()}`
      ]
    })
}

function rCent(n) {
  return Math.round(n * 100)
}

class Tick {
  constructor(s = sRef, dt = new Date(), bl = bankLevel) {
    this.a = s.a.map((stock, i) => {
      return stock.oVal ? [stock.cVal, stock.oVal] : [stock.cVal]
    })
    this.bl = bl
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

// Does not change sRef, its assumed sRef is updated by b() because its often run right before a transaction is made
class Transaction {
  constructor(s, type) {
    let sv = getSymbolAndValue(s)
    this.symbol = sv[0]
    this.value = sv[1]

    new Tick()

    this.dt = new Date()
    this.type = type

    if (type === "b") ownedStocks[this.symbol] = this.value
    else delete ownedStocks[this.symbol]

    tHist.push(this)
    return [this, sRef]
  }
}
function bu(s) {
  return new Transaction(s, "b")
}
function se(s) {
  return new Transaction(s, "s")
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

/**
 * These last two functions can cause a lot of damage.
 * Be sure to check the result before setting it equal to hist
 * 0. Export the historical data with `> exData()` and save it somewhere else.
 * 1. > var h = removeNaNFromHist()
 * 2. Check that the intended results have occurred
 * 3. if you are satisfied, > hist = h
 */

function removeNaNFromHist() {
  return hist.filter((tick) => !Number.isNaN(tick.stocks.o.CRL.a))
}
function deletePFromHist() {
  return hist.map((tick) =>
    tick.stocks.a.every((stock) => {
      delete stock.p
      delete tick.stocks.o[stock.name].p
    })
  )
}
// The ids were accidentally removed at one point, but this shouldn't happen anymore, but just in case...
function addIdsBack() {
  $(".bankGood .bankSymbol")
    .filter((i, v) => $(v).text().includes("$"))
    .each((i, v) =>
      $(v).html(
        `<span id="bankGood-${i}-val">${$(v).text().split(" |")[0]}</span>`
      )
    )
}

// Clean hist to make it as small as possible for localStorage.
// hist should be the only thing that persists
function cleanHist() {
  return hist.map((tick) => {
    return new Tick(tick.stocks, tick.dt, tick.bankLevel)
  })
}
