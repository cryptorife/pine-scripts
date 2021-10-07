//@version=4
study("MFI Div at dVWAP StDev", overlay=true, resolution="")

// mfi Inputs
len = input(14, minval=1, title="Length")
os = input(30, minval=1, title="Oversold")
ob = input(70, minval=1, title="Overbought")
hr = input(50, minval=1, title="Bear Div Reset level")
lr = input(50, minval=1, title="Bull Div Reset level")
xbars = input(defval=14, title="Div lookback period (bars)?", type=input.integer, minval=1)

// VWAP Inputs
useVWAP = input(true, title="Use Std Dev")
devUp = input(1.51, title="Stdev above")
devDn = input(1.51, title="Stdev below")

// DIVS code
_mfi = mfi(close, len)
hb = abs(highestbars(_mfi, xbars)) // Finds bar with highest value in last X bars
lb = abs(lowestbars(_mfi, xbars)) // Finds bar with lowest value in last X bars
max = float(na)
max__mfi = float(na)
min = float(na)
min__mfi = float(na)
divbear = bool(na)
divbull = bool(na)

// If bar with lowest / highest is current bar and _mfi is oversold/overbought, use it's value
max := hb == 0 and _mfi > ob ? close : na(max[1]) ? close : max[1]
max__mfi := hb == 0 and _mfi > ob ? _mfi : na(max__mfi[1]) ? _mfi : max__mfi[1]
min := lb == 0 and _mfi < os ? close : na(min[1]) ? close : min[1]
min__mfi := lb == 0 and _mfi < os ? _mfi : na(min__mfi[1]) ? _mfi : min__mfi[1]

// Reset if _mfi crosses the Reset level
if (_mfi < hr)
    max__mfi := float(na)
if (_mfi > lr)
    min__mfi := float(na)

// Compare high of current bar being examined with previous bar's high
// If curr bar high is higher than the max bar high in the lookback window range
if close > max // we have a new high
    max := close // change variable "max" to use current bar's high value
if _mfi > max__mfi and _mfi > ob // we have a new high
    max__mfi := _mfi // change variable "max__mfi" to use current bar's _mfi value
if close < min // we have a new low
    min := close // change variable "min" to use current bar's low value
if _mfi < min__mfi and _mfi < os // we have a new low
    min__mfi := _mfi // change variable "min__mfi" to use current bar's _mfi value

// Detects divergences between price and indicator with 1 candle delay so it filters out repeating divergences
if (max[1] > max[2]) and (_mfi[1] < max__mfi) and (_mfi <= _mfi[1])
    divbear := true
if (min[1] < min[2]) and (_mfi[1] > min__mfi) and (_mfi >= _mfi[1])
    divbull := true

// VWAP Code

tickerid = tickerid(syminfo.prefix, syminfo.ticker, session.regular, adjustment.splits)
start = security(tickerid, "D", time)
newSession = iff(change(start), 1, 0)

vwapsum = 0.0
volumesum = 0.0
v2sum = 0.0
myvwap = 0.0
dev = 0.0
pos = 0
possig = 1

vwapsum := iff(newSession, hl2*volume, vwapsum[1]+hl2*volume)
volumesum := iff(newSession, volume, volumesum[1]+volume)
v2sum := iff(newSession, volume*hl2*hl2, v2sum[1]+volume*hl2*hl2)
myvwap := vwapsum/volumesum
dev := sqrt(max(v2sum/volumesum - myvwap*myvwap, 0))

U2=myvwap + devUp * dev
D2=myvwap - devDn * dev

pos := 0
if (useVWAP)
    if (high > U2 and divbear)
        pos := 1
    if (low < D2 and divbull)
        pos := -1
else
    if (divbear)
        pos := 1
    if (divbull)
        pos := -1

plotshape(pos == -1, "long", location = location.belowbar, color = color.green, style=shape.triangleup, size=size.tiny)
plotshape(pos == 1, "short", location = location.abovebar, color = color.red, style=shape.triangledown, size=size.tiny)