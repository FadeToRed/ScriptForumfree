
const WEATHER_BY_SEASON = {
  spring: [
    { label: "Soleggiato",     icon: "wx-sunny",   minT: 14, maxT: 22, weight: 2 },
    { label: "Nuvoloso",       icon: "wx-cloudy",  minT: 10, maxT: 17, weight: 2 },
    { label: "Pioggia",        icon: "wx-rainy",   minT:  8, maxT: 14, weight: 4 },
    { label: "Vento",          icon: "wx-windy",   minT:  9, maxT: 16, weight: 3 },
    { label: "Temporale",      icon: "wx-thunder", minT:  9, maxT: 15, weight: 2 },
    { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 12, maxT: 20, weight: 2 },
  ],
  summer: [
    { label: "Soleggiato",     icon: "wx-sunny",   minT: 26, maxT: 36, weight: 3 },
    { label: "Afa",            icon: "wx-hot",     minT: 30, maxT: 38, weight: 5 },
    { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 24, maxT: 32, weight: 2 },
    { label: "Temporale",      icon: "wx-thunder", minT: 22, maxT: 28, weight: 2 },
    { label: "Vento caldo",    icon: "wx-windy",   minT: 25, maxT: 33, weight: 2 },
    { label: "Grandine",       icon: "wx-hail",    minT: 18, maxT: 26, weight: 1, maxDurationH: 1 },
  ],
  autumn: [
    { label: "Nuvoloso",       icon: "wx-cloudy",  minT:  7, maxT: 16, weight: 2 },
    { label: "Pioggia",        icon: "wx-rainy",   minT:  5, maxT: 13, weight: 3 },
    { label: "Nebbia",         icon: "wx-foggy",   minT:  4, maxT: 11, weight: 5 },
    { label: "Vento",          icon: "wx-windy",   minT:  6, maxT: 14, weight: 3 },
    { label: "Soleggiato",     icon: "wx-sunny",   minT: 10, maxT: 18, weight: 1 },
    { label: "Parz. nuvoloso", icon: "wx-partly",  minT:  9, maxT: 17, weight: 2 },
    { label: "Temporale",      icon: "wx-thunder", minT:  6, maxT: 13, weight: 2 },
  ],
  winter: [
    { label: "Neve",            icon: "wx-snow",     minT: -6, maxT:  2, weight: 4, requiresCold: true },
    { label: "Nevischio",       icon: "wx-snow",     minT: -3, maxT:  4, weight: 3, requiresCold: true },
    { label: "Gelido",          icon: "wx-freezing", minT:-10, maxT: -1, weight: 2 },
    { label: "Nuvoloso",        icon: "wx-cloudy",   minT:  0, maxT:  7, weight: 2 },
    { label: "Freddo e sereno", icon: "wx-sunny",    minT: -2, maxT:  6, weight: 2 },
    { label: "Grandine",        icon: "wx-hail",     minT:  1, maxT:  8, weight: 1, maxDurationH: 1 },
    { label: "Pioggia",         icon: "wx-rainy",    minT:  2, maxT:  8, weight: 2 },
  ],
};

const TRANSITION_MAP = {
  "wx-sunny":   { "wx-rainy": "wx-cloudy", "wx-thunder": "wx-partly", "wx-snow": "wx-cloudy", "wx-foggy": "wx-partly" },
  "wx-partly":  { "wx-rainy": "wx-cloudy", "wx-thunder": "wx-cloudy", "wx-snow": "wx-cloudy" },
  "wx-cloudy":  { "wx-sunny": "wx-partly" },
  "wx-rainy":   { "wx-sunny": "wx-cloudy", "wx-snow": "wx-cloudy" },
  "wx-thunder": { "wx-sunny": "wx-cloudy", "wx-partly": "wx-cloudy" },
  "wx-snow":    { "wx-sunny": "wx-cloudy", "wx-rainy": "wx-cloudy" },
  "wx-hot":     { "wx-rainy": "wx-partly", "wx-thunder": "wx-partly" },
};

/* ================================================================
   LOGICA TEMPO / METEO
   ================================================================ */
function getSeason(month) {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function isNight(hour, season) {
  if (season === "summer")                        return hour >= 20 || hour < 5;
  if (season === "spring" || season === "autumn") return hour >= 19 || hour < 6;
  return hour >= 17 || hour < 7;
}

// Picchi termici per stagione
var TEMP_PEAKS = {
  summer: { peakHot: 16, peakCold: 5 },
  spring: { peakHot: 15, peakCold: 5 },
  autumn: { peakHot: 15, peakCold: 5 },
  winter: { peakHot: 14, peakCold: 5 },
};

function circularDist(a, b) {
  var d = Math.abs(a - b) % 24;
  return d > 12 ? 24 - d : d;
}

function dailyTempFactor(hour, season) {
  var p = TEMP_PEAKS[season];
  var distHot  = circularDist(hour, p.peakHot);
  var distCold = circularDist(hour, p.peakCold);
  return distCold / (distHot + distCold);
}

function seededRand(seed) {
  var s = (seed ^ 0xdeadbeef) >>> 0;
  return function() {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
}

function pickWeather(pool, rand, excludeHail) {
  var filtered = excludeHail ? pool.filter(function(w) { return w.icon !== "wx-hail"; }) : pool;
  var total = filtered.reduce(function(a, w) { return a + w.weight; }, 0);
  var r = rand() * total, acc = 0;
  for (var i = 0; i < filtered.length; i++) {
    acc += filtered[i].weight;
    if (r <= acc) return filtered[i];
  }
  return filtered[filtered.length - 1];
}

function getWeather(gameDate, locName, locH) {
  var season   = getSeason(gameDate.getMonth());
  var pool     = WEATHER_BY_SEASON[season];
  var doy      = Math.floor((gameDate - new Date(gameDate.getFullYear(), 0, 0)) / 86400000);
  var nameSeed = locName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
  var slotSize = (season === "spring" || season === "autumn") ? 2 : 3;
  var numSlots = Math.ceil(24 / slotSize);
  var currSlot = Math.floor(locH / slotSize);
  var prevSlot = (currSlot - 1 + numSlots) % numSlots;

  function slotSeed(slot) {
    return gameDate.getFullYear() * 100000 + doy * 100 + slot * 7 + nameSeed;
  }

  var wPrev = pickWeather(pool, seededRand(slotSeed(prevSlot)), false);
  var wCurr = pickWeather(pool, seededRand(slotSeed(currSlot)), wPrev.icon === "wx-hail");

  var randT   = seededRand(slotSeed(currSlot) + 999);
  var climOff = HXH.CLIMATE[locName] || 0;
  var tMin    = wCurr.minT + climOff;
  var tMax    = wCurr.maxT + climOff;
  var dayNoise    = (randT() - 0.5) * 3;
  var tAtHot      = tMax + dayNoise;
  var tAtCold     = tMin + dayNoise;
  var factor      = dailyTempFactor(locH, season);
  var baseTempDay = Math.round(tAtCold + factor * (tAtHot - tAtCold));

  function snowCheck(w, t) {
    if (w.requiresCold && t > 2) return pool.find(function(x) { return x.icon === "wx-rainy"; }) || w;
    return w;
  }
  wCurr = snowCheck(wCurr, baseTempDay);
  wPrev = snowCheck(wPrev, baseTempDay);

  var transIcon  = (TRANSITION_MAP[wPrev.icon] && TRANSITION_MAP[wPrev.icon][wCurr.icon])
                     ? TRANSITION_MAP[wPrev.icon][wCurr.icon] : null;
  var showTrans  = transIcon && (locH % slotSize === 0);
  var finalIcon  = showTrans ? transIcon : wCurr.icon;
  var finalLabel = showTrans
    ? ((pool.find(function(w) { return w.icon === transIcon; }) || { label: "Variabile" }).label)
    : wCurr.label;

  if (HXH.DEBUG_WEATHER) {
    var dbg = HXH.DEBUG_WEATHER, dbgNight = false;
    if (dbg.indexOf("night:") === 0) { dbgNight = true; dbg = dbg.slice(6); }
    return { label: "[DBG] " + dbg, icon: dbg, temp: baseTempDay, nightOverride: dbgNight };
  }
  return { label: finalLabel, icon: finalIcon, temp: baseTempDay };
}

function getGameTime() {
  var realElapsedMs = Date.now() - HXH.REAL_EPOCH.getTime();
  var msPerGameDay  = HXH.MINS_PER_GAME_DAY * 60 * 1000;
  var gameDate      = new Date(HXH.GAME_EPOCH.getTime() + realElapsedMs * (86400000 / msPerGameDay));
  return { gameDate: gameDate, h: gameDate.getUTCHours(), m: gameDate.getUTCMinutes() };
}

function applyOffset(h, off) { return ((h + off) % 24 + 24) % 24; }
function pad(n) { return String(n).padStart(2, "0"); }
var MONTHS = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

function detectLoc() {
  var url = window.location.href;
  for (var id in HXH.SECTION_MAP) {
    if (url.includes(id)) return HXH.SECTION_MAP[id];
  }
  return HXH.DEFAULT_LOC;
}

/* ================================================================
   COSTRUZIONE DOM
   ================================================================ */
function mk(tag, cls) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}
function mkI(cls) { var i = document.createElement("i"); i.className = cls; return i; }

function buildMoonSvg(fill, cx, cy, r, maskCx, maskCy, maskR, rotateDeg, holeStars, extraStars) {
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "moon-svg");
  svg.setAttribute("viewBox", "0 0 90 90");
  svg.setAttribute("overflow", "visible");
  var defs = document.createElementNS(ns, "defs");
  var mid  = "mm" + Math.random().toString(36).slice(2, 8);
  var mask = document.createElementNS(ns, "mask"); mask.setAttribute("id", mid);
  var g = document.createElementNS(ns, "g");
  g.setAttribute("transform", "rotate(" + rotateDeg + "," + cx + "," + cy + ")");
  var c1 = document.createElementNS(ns, "circle");
  c1.setAttribute("cx", cx); c1.setAttribute("cy", cy); c1.setAttribute("r", r); c1.setAttribute("fill", "white");
  var c2 = document.createElementNS(ns, "circle");
  c2.setAttribute("cx", maskCx); c2.setAttribute("cy", maskCy); c2.setAttribute("r", maskR); c2.setAttribute("fill", "black");
  g.appendChild(c1); g.appendChild(c2); mask.appendChild(g); defs.appendChild(mask); svg.appendChild(defs);
  var moon = document.createElementNS(ns, "circle");
  moon.setAttribute("cx", cx); moon.setAttribute("cy", cy); moon.setAttribute("r", r);
  moon.setAttribute("fill", fill); moon.setAttribute("mask", "url(#" + mid + ")");
  svg.appendChild(moon);
  var stars = (holeStars ? [[57,33,2,"white","n-star-1"],[65,42,1.4,"white","n-star-3"]] : []).concat(extraStars || []);
  for (var i = 0; i < stars.length; i++) {
    var sc = document.createElementNS(ns, "circle");
    sc.setAttribute("cx", stars[i][0]); sc.setAttribute("cy", stars[i][1]); sc.setAttribute("r", stars[i][2]);
    sc.setAttribute("fill", stars[i][3]); sc.setAttribute("class", stars[i][4]);
    svg.appendChild(sc);
  }
  return svg;
}

function buildWeatherIcon(cls, night) {
  var wrap = mk("div", "wx-icon " + cls);
  if (night && cls === "wx-sunny") {
    wrap.className += " wx-night";
    wrap.appendChild(buildMoonSvg("#ddeeff", 45, 45, 24, 58, 35, 20, 5, true, [
      [14,16,2.2,"white","n-star-1"],[74,12,1.8,"white","n-star-2"],
      [80,50,1.5,"white","n-star-3"],[12,70,1.6,"white","n-star-4"],[70,74,1.3,"white","n-star-5"]
    ]));
    return wrap;
  }
  if (night && cls === "wx-partly") {
    wrap.className += " wx-night has-cloud";
    var svg2 = buildMoonSvg("#ddeeff", 70, 26, 23, 81, 16, 19, 5, false, [
      [77,14,1.8,"white","n-star-2"],[83,22,1.3,"white","n-star-4"],
      [8,12,1.8,"white","n-star-1"],[25,6,1.5,"white","n-star-3"],
      [45,10,1.3,"white","n-star-5"],[6,32,1.4,"white","n-star-2"]
    ]);
    svg2.setAttribute("width", "100%"); svg2.setAttribute("height", "100%");
    wrap.appendChild(svg2);
    wrap.appendChild(mk("div", "cloud"));
    return wrap;
  }
  if (night && cls === "wx-hot") {
    wrap.className += " wx-night";
    var moonSvg = buildMoonSvg("#ddeeff", 45, 45, 24, 58, 35, 20, 5, false, [
      [14,16,2.0,"white","n-star-1"],
      [74,12,1.6,"white","n-star-2"],
      [80,52,1.4,"white","n-star-3"],
      [12,68,1.5,"white","n-star-4"],
    ]);
    wrap.appendChild(moonSvg);
    wrap.appendChild(mk("div", "wx-hot-night-aura"));
    return wrap;
  }
  if (night && cls === "wx-foggy") {
    wrap.className += " wx-night";
    wrap.appendChild(buildMoonSvg("#99ccee", 45, 45, 24, 58, 35, 20, 5, true, [
      [16,22,1.6,"rgba(180,220,255,0.8)","n-star-3"],
      [74,18,1.4,"rgba(180,220,255,0.8)","n-star-5"],
      [78,55,1.2,"rgba(180,220,255,0.7)","n-star-1"]
    ]));
    wrap.appendChild(mk("div", "fog"));
    return wrap;
  }
  if (cls === "wx-sunny") {
    var sun = mk("div", "sun"); sun.appendChild(mk("div", "rays")); wrap.appendChild(sun);
  } else if (cls === "wx-partly") {
    wrap.appendChild(mk("div", "cloud"));
    var sun = mk("div", "sun"); sun.appendChild(mk("div", "rays")); wrap.appendChild(sun);
  } else if (cls === "wx-cloudy") {
    wrap.appendChild(mk("div", "cloud"));
    wrap.appendChild(mk("div", "cloud back"));
  } else if (cls === "wx-rainy") {
    wrap.appendChild(mk("div", "cloud"));
    wrap.appendChild(mk("div", "rain"));
  } else if (cls === "wx-thunder") {
    wrap.appendChild(mk("div", "cloud"));
    var li = mk("div", "lightning");
    li.appendChild(mk("div", "bolt")); li.appendChild(mk("div", "bolt"));
    wrap.appendChild(li);
  } else if (cls === "wx-snow") {
    wrap.appendChild(mk("div", "cloud"));
    var sn = mk("div", "snow");
    for (var si = 0; si < 4; si++) {
      var sf = mk("div", "snowflake"); var sp = mk("span");
      sp.textContent = String.fromCharCode(10052); sf.appendChild(sp); sn.appendChild(sf);
    }
    wrap.appendChild(sn);
  } else if (cls === "wx-foggy") {
    wrap.appendChild(mk("div", "fog-sun"));
    wrap.appendChild(mk("div", "fog"));
  } else if (cls === "wx-windy") {
    var ns3 = "http://www.w3.org/2000/svg";
    var wsvg = document.createElementNS(ns3, "svg");
    wsvg.setAttribute("viewBox", "0 0 80 60");
    ["wx-wline-1","wx-wline-2","wx-wline-3"].forEach(function(id) {
      var u = document.createElementNS(ns3, "use");
      u.setAttribute("href", "#" + id); u.setAttribute("class", "w-line"); wsvg.appendChild(u);
    });
    [[18,22,2.2,"w-dot"],[30,34,2,"w-dot w-dot-2"],[10,10,1.8,"w-dot w-dot-3"]].forEach(function(d) {
      var c = document.createElementNS(ns3, "circle");
      c.setAttribute("cx", d[0]); c.setAttribute("cy", d[1]); c.setAttribute("r", d[2]); c.setAttribute("class", d[3]);
      wsvg.appendChild(c);
    });
    wrap.appendChild(wsvg);
  } else if (cls === "wx-hail") {
    var h = mk("div", "hail"); h.appendChild(mk("div", "hail-extra"));
    wrap.appendChild(mk("div", "cloud")); wrap.appendChild(h);
  } else if (cls === "wx-freezing") {
    var ic = mk("div", "ice-crystal"); ic.textContent = String.fromCharCode(10052); wrap.appendChild(ic);
  } else if (cls === "wx-hot") {
    wrap.className = "wx-icon icon hot";
    var sun = mk("div", "sun"); sun.appendChild(mk("div", "rays")); wrap.appendChild(sun);
  }
  return wrap;
}

/* ================================================================
   STATO
   ================================================================ */
var _state = { icon: null, night: null };

/* ================================================================
   INIT — costruisce la struttura DOM una volta sola
   ================================================================ */
function initWidget() {
  var bar = document.getElementById("hxh-bar");
  if (!bar) return;

  var trigger     = mk("div", "hxh-trigger");
  var triggerIcon = mk("div", "hxh-trigger-icon");
  triggerIcon.appendChild(mkI("fa-solid fa-cloud-sun"));
  var triggerLabel = mk("span", "hxh-trigger-label");
  triggerLabel.textContent = "Meteo";
  triggerIcon.appendChild(triggerLabel);
  trigger.appendChild(triggerIcon);
  trigger.onmouseenter = function() { bar.className = "hxh-open"; };

  var card = mk("div", "hxh-card");
  card.appendChild(mk("div", "hxh-corners"));

  var head = mk("div", "hxh-head");
  head.appendChild(mkI("fa-solid fa-location-dot"));
  head.appendChild(mk("span", "hxh-head-name"));
  var closeBtn = mk("button", "hxh-close");
  closeBtn.appendChild(mkI("fa-solid fa-xmark"));
  closeBtn.onclick = function(e) { e.stopPropagation(); bar.className = ""; };
  head.appendChild(closeBtn);
  card.appendChild(head);

  var timeBlock = mk("div", "hxh-time-block");
  var timeLabel = mk("div", "hxh-time-label");
  timeLabel.textContent = "Ora locale";
  timeBlock.appendChild(timeLabel);
  timeBlock.appendChild(mk("div", "hxh-time-display"));
  card.appendChild(timeBlock);

  var dateBlock = mk("div", "hxh-date-block");
  dateBlock.appendChild(mkI("fa-regular fa-calendar"));
  dateBlock.appendChild(mk("span", "hxh-date-text"));
  card.appendChild(dateBlock);

  var wBlock = mk("div", "hxh-weather-block");
  var wRow   = mk("div", "hxh-weather-row");
  wRow.appendChild(mk("div", "hxh-weather-icon-wrap"));
  var wInfo = mk("div");
  wInfo.appendChild(mk("div", "hxh-weather-label"));
  wInfo.appendChild(mk("div", "hxh-weather-temp"));
  wRow.appendChild(wInfo);
  wBlock.appendChild(wRow);
  card.appendChild(wBlock);

  var footer = mk("div", "hxh-footer-deco");
  footer.appendChild(mk("div", "hxh-footer-line"));
  var diamond = mk("span", "hxh-footer-diamond");
  diamond.textContent = "\u25C6 \u25C6 \u25C6";
  footer.appendChild(diamond);
  footer.appendChild(mk("div", "hxh-footer-line"));
  card.appendChild(footer);

  bar.appendChild(trigger);
  bar.appendChild(card);

  updateWidget();
}

/* ================================================================
   UPDATE — aggiorna solo i nodi che cambiano
   ================================================================ */
function updateWidget() {
  var bar = document.getElementById("hxh-bar");
  if (!bar) return;

  var gt      = getGameTime();
  var loc     = detectLoc();
  var locH    = applyOffset(gt.h, loc.offset);
  var weather = getWeather(gt.gameDate, loc.name, locH);
  var season  = getSeason(gt.gameDate.getMonth());
  var night   = (weather.nightOverride !== undefined) ? weather.nightOverride : isNight(locH, season);

  var el;
  el = bar.querySelector(".hxh-head-name");   if (el) el.textContent = loc.name;
  el = bar.querySelector(".hxh-time-display"); if (el) el.textContent = pad(locH) + ":" + pad(gt.m);
  el = bar.querySelector(".hxh-date-text");    if (el) el.textContent = gt.gameDate.getUTCDate() + " " + MONTHS[gt.gameDate.getUTCMonth()] + " " + gt.gameDate.getUTCFullYear();
  el = bar.querySelector(".hxh-weather-label"); if (el) el.textContent = weather.label;
  el = bar.querySelector(".hxh-weather-temp");  if (el) el.textContent = (weather.temp > 0 ? "+" : "") + weather.temp + "\u00b0C";

  if (weather.icon !== _state.icon || night !== _state.night) {
    el = bar.querySelector(".hxh-weather-icon-wrap");
    if (el) {
      el.innerHTML = "";
      el.appendChild(buildWeatherIcon(weather.icon, night));
    }
    _state.icon  = weather.icon;
    _state.night = night;
  }
}

/* ================================================================
   AVVIO E TIMER
   ================================================================ */
initWidget();

var _lastNight = null;
setInterval(function() {
  var gt     = getGameTime();
  var loc    = detectLoc();
  var locH   = applyOffset(gt.h, loc.offset);
  var season = getSeason(gt.gameDate.getMonth());
  var night  = isNight(locH, season);

  var el = document.querySelector(".hxh-time-display");
  if (el) el.textContent = pad(locH) + ":" + pad(gt.m);

  if (_lastNight !== null && night !== _lastNight) updateWidget();
  _lastNight = night;
}, 10000);

setInterval(updateWidget, 60 * 1000);

/* ================================================================
   STILI
   ================================================================ */
(function() {
  var s = document.createElement('style');
  s.textContent = '';
  s.textContent += '#hxh-bar { position: fixed; top: 150px; left: 12px; z-index: 9; font-family: \'Montserrat\', Georgia, serif; }\n';
  s.textContent += '.hxh-trigger { display: inline-flex; cursor: pointer; }\n';
  s.textContent += '.hxh-trigger-icon { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px 7px 10px; border-radius: 20px; background: linear-gradient(135deg, #0e2a2a, #0B486B); border: 1px solid #3B8686; box-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 0 8px rgba(59,134,134,0.3); animation: hxh-pulse 2.5s ease-in-out infinite; }\n';
  s.textContent += '.hxh-trigger-icon i { font-size: 15px; color: #79BD9A; flex-shrink: 0; }\n';
  s.textContent += '.hxh-trigger-label { font-family: \'Montserrat\', serif; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #CFF09E; white-space: nowrap; }\n';
  s.textContent += '@keyframes hxh-pulse { 0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 0 6px rgba(59,134,134,0.3); } 50% { box-shadow: 0 2px 16px rgba(0,0,0,0.5), 0 0 18px rgba(59,134,134,0.7), 0 0 30px rgba(121,189,154,0.25); } }\n';
  s.textContent += '.hxh-card { display: none; width: 190px; border-radius: 6px; overflow: hidden; background: linear-gradient(160deg, #0e2a2a 0%, #0B2533 60%, #0e1f2e 100%); border: 1px solid #3B8686; box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(143,190,186,0.12); }\n';
  s.textContent += '#hxh-bar.hxh-open .hxh-trigger { display: none; }\n';
  s.textContent += '#hxh-bar.hxh-open .hxh-card { display: block; animation: hxh-in 0.3s ease forwards; }\n';
  s.textContent += '.hxh-card::before { content: \'\'; position: absolute; inset: 0; background-image: radial-gradient(ellipse at 80% 0%, rgba(59,134,134,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 100%, rgba(11,72,107,0.2) 0%, transparent 60%); pointer-events: none; z-index: 0; }\n';
  s.textContent += '.hxh-card > * { position: relative; z-index: 1; }\n';
  s.textContent += '.hxh-corners { position: absolute; inset: 0; pointer-events: none; z-index: 3; }\n';
  s.textContent += '.hxh-corners::before, .hxh-corners::after { content: \'\'; position: absolute; width: 9px; height: 9px; border-color: #79BD9A; border-style: solid; opacity: 0.55; }\n';
  s.textContent += '.hxh-corners::before { top: 4px; left: 4px; border-width: 1px 0 0 1px; }\n';
  s.textContent += '.hxh-corners::after { top: 4px; right: 4px; border-width: 1px 1px 0 0; }\n';
  s.textContent += '.hxh-head { padding: 9px 13px 8px; border-bottom: 1px solid rgba(59,134,134,0.4); display: flex; align-items: center; gap: 7px; background: rgba(11,72,107,0.35); }\n';
  s.textContent += '.hxh-head i { font-size: 10px; color: #79BD9A; flex-shrink: 0; vertical-align: middle; }\n';
  s.textContent += '.hxh-head-name { font-family: \'Montserrat\', serif; font-size: 9px; letter-spacing: 2.2px; text-transform: uppercase; color: #CFF09E; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }\n';
  s.textContent += '.hxh-close { margin-left: auto; background: none; border: none; cursor: pointer; padding: 0; color: #3B8686; line-height: 1; transition: color 0.2s; }\n';
  s.textContent += '.hxh-close:hover { color: #CFF09E; }\n';
  s.textContent += '.hxh-close i { font-size: 11px; }\n';
  s.textContent += '.hxh-time-block { padding: 11px 13px 9px; border-bottom: 1px solid rgba(59,134,134,0.25); }\n';
  s.textContent += '.hxh-time-label { font-family: \'Montserrat\', serif; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #3B8686; margin-bottom: 3px; }\n';
  s.textContent += '.hxh-time-display { font-family: \'Courier New\', monospace; font-size: 28px; font-weight: bold; color: #E2F7C4; letter-spacing: 3px; line-height: 1; animation: hxh-glow 3.5s ease-in-out infinite; }\n';
  s.textContent += '.hxh-date-block { padding: 7px 13px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(59,134,134,0.25); background: rgba(11,72,107,0.15); }\n';
  s.textContent += '.hxh-date-block i { font-size: 10px; color: #3B8686; width: 11px; text-align: center; flex-shrink: 0; }\n';
  s.textContent += '.hxh-date-text { font-size: 13px; color: #8FBEBA; letter-spacing: 0.3px; }\n';
  s.textContent += '.hxh-weather-block { padding: 10px 13px 12px; }\n';
  s.textContent += '.hxh-weather-row { display: flex; align-items: center; gap: 10px; }\n';
  s.textContent += '.hxh-weather-icon-wrap { width: 60px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }\n';
  s.textContent += '.hxh-weather-label { font-size: 14px; color: #CFF09E; font-style: italic; line-height: 1.2; margin-left: -10px; }\n';
  s.textContent += '.hxh-weather-temp { font-family: \'Montserrat\', serif; font-size: 10.5px; color: #79BD9A; letter-spacing: 0.8px; margin-top: 1px; margin-left: -16px; }\n';
  s.textContent += '.hxh-footer-deco { border-top: 1px solid rgba(59,134,134,0.3); padding: 5px 13px 6px; display: flex; align-items: center; gap: 6px; background: rgba(11,72,107,0.2); }\n';
  s.textContent += '.hxh-footer-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(121,189,154,0.4), transparent); }\n';
  s.textContent += '.hxh-footer-diamond { font-size: 6px; color: #3B8686; letter-spacing: 3px; }\n';
  s.textContent += '@keyframes hxh-glow { 0%, 100% { text-shadow: 0 0 8px rgba(226,247,196,0.2); } 50% { text-shadow: 0 0 18px rgba(226,247,196,0.5); } }\n';
  s.textContent += '@keyframes hxh-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }\n';
  s.textContent += '.wx-icon { position: relative; display: inline-block; width: 10em; height: 8em; font-size: 4.2px; color: #b0bec5; }\n';
  s.textContent += '.cloud { position: absolute; z-index: 1; top: 50%; left: 50%; width: 3.6875em; height: 3.6875em; margin: -1.84375em; background: currentColor; border-radius: 50%; box-shadow: -2.1875em 0.6875em 0 -0.6875em, 2.0625em 0.9375em 0 -0.9375em, 0 0 0 0.375em #fff, -2.1875em 0.6875em 0 -0.3125em #fff, 2.0625em 0.9375em 0 -0.5625em #fff; }\n';
  s.textContent += '.cloud::after { content: ""; position: absolute; bottom: 0; left: -0.5em; display: block; width: 4.5625em; height: 1em; background: currentColor; box-shadow: 0 0.4375em 0 -0.0625em #fff; }\n';
  s.textContent += '.cloud.back { z-index: 0; background: #fff; box-shadow: -2.1875em 0.6875em 0 -0.6875em #fff, 2.0625em 0.9375em 0 -0.9375em #fff, 0 0 0 0.375em #fff, -2.1875em 0.6875em 0 -0.3125em #fff, 2.0625em 0.9375em 0 -0.5625em #fff; opacity:1; transform: scale(0.5) translate(7.5em, -3em); animation: cloud-drift 4s linear infinite; }\n';
  s.textContent += '.cloud.back::after { background: #fff; }\n';
  s.textContent += '.sun { position: absolute; top: 50%; left: 50%; width: 2.5em; height: 2.5em; margin: -1.25em; background: currentColor; border-radius: 50%; box-shadow: 0 0 0 0.375em #fff; animation: wx-spin 12s linear infinite; }\n';
  s.textContent += '.rays { position: absolute; top: -2em; left: 50%; display: block; width: 0.375em; height: 1.125em; margin-left: -0.1875em; background: #fff; border-radius: 0.25em; box-shadow: 0 5.375em #fff; }\n';
  s.textContent += '.rays::before, .rays::after { content: ""; position: absolute; top: 0; left: 0; width: 0.375em; height: 1.125em; background: #fff; border-radius: 0.25em; box-shadow: 0 5.375em #fff; }\n';
  s.textContent += '.rays::before { transform: rotate(60deg); transform-origin: 50% 3.25em; }\n';
  s.textContent += '.rays::after { transform: rotate(120deg); transform-origin: 50% 3.25em; }\n';
  s.textContent += '.cloud + .sun { margin: -2em 1em; }\n';
  s.textContent += '.rain, .lightning, .hail { position: absolute; z-index: 2; top: 50%; left: 50%; margin: 3.8em 0 0 -1em; }\n';
  s.textContent += '.snow { position: absolute; z-index: 2; top: 50%; left: 50%; margin: 2.6em 0 0 -1em; }\n';
  s.textContent += '.fog, .wind-lines { position: absolute; z-index: 2; top: 50%; left: 50%; transform: translate(-50%, -50%); }\n';
  s.textContent += '.rain::after { content: ""; position: absolute; z-index: 2; top: 50%; left: 50%; width: 1.125em; height: 1.125em; margin: -1em 0 0 -0.25em; background: #6cf; border-radius: 100% 0 60% 50% / 60% 0 100% 50%; box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 rgba(255,255,255,0.2); transform: rotate(-28deg); animation: wx-rain 2.5s linear infinite; }\n';
  s.textContent += '.bolt { position: absolute; top: 50%; left: 50%; margin: -0.25em 0 0 -0.125em; color: #fff; opacity: 0.3; animation: wx-lightning 2s linear infinite; }\n';
  s.textContent += '.bolt:nth-child(2) { width: 1em; height: 0em; margin: -1.75em 0 0 -1.875em; transform: translate(2.5em,2.25em); opacity: 0.2; animation: wx-lightning 1.5s linear infinite; }\n';
  s.textContent += '.bolt::before, .bolt::after { content: ""; position: absolute; z-index: 2; top: 50%; left: 50%; margin: -1.625em 0 0 -1.0125em; border-top: 1.25em solid transparent; border-right: 0.75em solid; border-bottom: 0.75em solid; border-left: 0.5em solid transparent; transform: skewX(-10deg); }\n';
  s.textContent += '.bolt::after { margin: -0.25em 0 0 -0.25em; border-top: 0.75em solid; border-right: 0.5em solid transparent; border-bottom: 1.25em solid transparent; border-left: 0.75em solid; }\n';
  s.textContent += '.bolt:nth-child(2)::before { margin: -0.75em 0 0 -0.5em; border-top: 1.1em solid transparent; border-right: 0.65em solid; border-bottom: 0.65em solid; border-left: 0.45em solid transparent }\n';
  s.textContent += '.bolt:nth-child(2)::after { margin: -0.125em 0 0 -0.125em; border-top: 0.65em solid; border-right: 0.45em solid transparent; border-bottom: 1.1em solid transparent; border-left: 0.65em solid }\n';
  s.textContent += '.snowflake { position: absolute; top: 0; color: #fff !important; line-height: 1; animation: wx-snowfall linear infinite; }\n';
  s.textContent += '.snowflake span { display: block; color: #fff !important; animation: wx-spin linear infinite; }\n';
  s.textContent += '.snowflake:nth-child(1) { left: -0.8em; font-size: 1.4em; opacity: 0.9;  animation-duration: 2.2s; animation-delay: 0s; }\n';
  s.textContent += '.snowflake:nth-child(2) { left:  0.4em; font-size: 1.0em; opacity: 0.7;  animation-duration: 2.7s; animation-delay: 0.7s; }\n';
  s.textContent += '.snowflake:nth-child(3) { left:  1.4em; font-size: 1.2em; opacity: 0.8;  animation-duration: 2.0s; animation-delay: 1.4s; }\n';
  s.textContent += '.snowflake:nth-child(4) { left: -0.1em; font-size: 0.8em; opacity: 0.55; animation-duration: 2.5s; animation-delay: 0.35s; }\n';
  s.textContent += '.snowflake:nth-child(1) span { animation-duration: 6s; }\n';
  s.textContent += '.snowflake:nth-child(2) span { animation-duration: 9s; animation-direction: reverse; }\n';
  s.textContent += '.snowflake:nth-child(3) span { animation-duration: 7s; }\n';
  s.textContent += '.snowflake:nth-child(4) span { animation-duration: 11s; animation-direction: reverse; }\n';
  s.textContent += '.hail::before { content: ""; position: absolute; top: 0; left: 0.3em; width: 0.85em; height: 0.85em; background: #aef; border-radius: 50%; animation: wx-hail 1s ease-in infinite 0s; }\n';
  s.textContent += '.hail::after { content: ""; position: absolute; top: 0; left: 1.5em; width: 0.75em; height: 0.75em; background: #aef; border-radius: 50%; animation: wx-hail 1s ease-in infinite 0.35s; }\n';
  s.textContent += '.hail-extra { position: absolute; top: 0; left: -0.1em; width: 0.65em; height: 0.65em; background: rgba(174,238,255,0.7); border-radius: 50%; animation: wx-hail 1s ease-in infinite 0.65s; }\n';
  s.textContent += '.wx-foggy .fog-sun { position: absolute; top: 50%; left: 50%; width: 5em; height: 5em; margin: -2.5em 0 0 -2.5em; background: radial-gradient(circle, rgba(255,220,100,0.9) 0%, rgba(255,180,50,0.6) 60%, rgba(255,150,30,0.2) 100%); border-radius: 50%; box-shadow: 0 0 1.5em rgba(255,200,80,0.4); }\n';
  s.textContent += '.fog::before { content: ""; position: absolute; top: 50%; left: 50%; width: 7em; height: 0.55em; margin: -0.2em 0 0 -3.8em; background: rgba(220,220,220,0.92); border-radius: 0.3em; box-shadow: 0.3em 1.3em 0 0.05em rgba(220,220,220,0.82); animation: wx-fog 3s ease-in-out infinite; }\n';
  s.textContent += '.fog::after { content: ""; position: absolute; top: 50%; left: 50%; width: 5.5em; height: 0.55em; margin: 1.1em 0 0 -2.7em; background: rgba(210,210,210,0.78); border-radius: 0.3em; box-shadow: -0.4em 1.3em 0 0.03em rgba(210,210,210,0.65); animation: wx-fog 3s ease-in-out infinite 1.5s; }\n';
  s.textContent += '.wx-windy svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 8em; height: 6em; overflow: visible; }\n';
  s.textContent += '.wx-windy .w-line { fill: none; stroke: rgba(255,255,255,0.85); stroke-width: 2.8; stroke-linecap: round; }\n';
  s.textContent += '.wx-windy .w-line:nth-child(2) { stroke: rgba(255,255,255,0.7); }\n';
  s.textContent += '.wx-windy .w-line:nth-child(3) { stroke: rgba(255,255,255,0.55); }\n';
  s.textContent += '.wx-windy .w-line:nth-child(1) { animation: wx-wind-draw 2.8s ease-in-out infinite 0.4s; }\n';
  s.textContent += '.wx-windy .w-line:nth-child(2) { animation: wx-wind-draw 2.8s ease-in-out infinite 0s; }\n';
  s.textContent += '.wx-windy .w-line:nth-child(3) { animation: wx-wind-draw 2.8s ease-in-out infinite 0.8s; }\n';
  s.textContent += '.wx-windy .w-dot { fill: rgba(255,255,255,0.75); animation: wx-wind-dot 1.4s ease-in-out infinite; }\n';
  s.textContent += '.wx-windy .w-dot-2 { animation-delay: 0.45s; }\n';
  s.textContent += '.wx-windy .w-dot-3 { animation-delay: 0.9s; }\n';
  s.textContent += '.wx-night .moon-svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 10em; height: 10em; overflow: visible; z-index: 0; }\n';
  s.textContent += '.wx-night.has-cloud .moon-svg { width: 100%; height: 100%; }\n';
  s.textContent += '.n-star-1 { animation: wx-star 2.8s ease-in-out infinite; }\n';
  s.textContent += '.n-star-2 { animation: wx-star 2.8s ease-in-out infinite 1s; }\n';
  s.textContent += '.n-star-3 { animation: wx-star 2.8s ease-in-out infinite 2s; }\n';
  s.textContent += '.n-star-4 { animation: wx-star 2.8s ease-in-out infinite 1.5s; }\n';
  s.textContent += '.n-star-5 { animation: wx-star 2.8s ease-in-out infinite 0.5s; }\n';
  s.textContent += '.ice-crystal { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #adf; font-size: 6em; line-height: 1; text-shadow: 0 0 0.15em rgba(170,220,255,1), 0 0 0.4em rgba(170,220,255,0.6); animation: wx-spin-center 14s linear infinite; }\n';
  s.textContent += '.ice-crystal::before { content: "\\2744"; position: absolute; font-size: 0.4em; top: 0.3em; left: -0.8em; opacity: 0.55; animation: wx-spin 8s linear infinite reverse; }\n';
  s.textContent += '.ice-crystal::after { content: "\\2744"; position: absolute; font-size: 0.35em; top: 1.6em; left: 2em; opacity: 0.4; animation: wx-spin 6s linear infinite; }\n';
  s.textContent += '.wx-hot-night-aura { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 6em; height: 6em; border-radius: 50%; background: radial-gradient(circle, transparent 35%, rgba(255,120,0,0.22) 60%, rgba(255,80,0,0.10) 80%, transparent 100%); animation: hot-night-pulse 3s ease-in-out infinite; z-index: 1; pointer-events: none; }\n';
  s.textContent += '@keyframes hot-night-pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; } 50% { transform: translate(-50%,-50%) scale(1.35); opacity: 1.0; } }\n';
  s.textContent += '.icon.hot, .wx-hot { color: #f93; }\n';
  s.textContent += '.wx-hot .sun, .icon.hot .sun { background: #f93; box-shadow: 0 0 0 0.375em #fff; animation: wx-spin 12s linear infinite, wx-hot-pulse 2.5s ease-in-out infinite; }\n';
  s.textContent += '@keyframes wx-spin { 100% { transform: rotate(360deg); } }\n';
  s.textContent += '@keyframes wx-spin-center { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }\n';
  s.textContent += '@keyframes cloud-drift { 0% { opacity:0; } 50% { opacity:0.7; } 100% { opacity:0; transform: scale(0.5) translate(-240%,-4em); } }\n';
  s.textContent += '@keyframes wx-rain { 0% { background:#6cf; box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 #6cf; } 25% { box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em #6cf, -1.375em -0.125em 0 rgba(255,255,255,0.2); } 50% { background:rgba(255,255,255,0.3); box-shadow: 0.625em 0.875em 0 -0.125em #6cf, -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 rgba(255,255,255,0.2); } 100% { box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 #6cf; } }\n';
  s.textContent += '@keyframes wx-lightning { 45% { color:#fff; background:#fff; opacity:0.2; } 50% { color:#0cf; background:#0cf; opacity:1; } 55% { color:#fff; background:#fff; opacity:0.2; } }\n';
  s.textContent += '@keyframes wx-snowfall { 0% { transform:translateY(0); opacity:0; } 15% { opacity:1; } 85% { opacity:0.9; } 100% { transform:translateY(2.2em); opacity:0; } }\n';
  s.textContent += '@keyframes wx-hail { 0% { transform:translateY(0); opacity:1; } 80% { opacity:0.8; } 100% { transform:translateY(2em); opacity:0; } }\n';
  s.textContent += '@keyframes wx-fog { 0%,100% { transform:translateX(0); opacity:0.7; } 50% { transform:translateX(0.5em); opacity:0.4; } }\n';
  s.textContent += '@keyframes wx-wind-draw { 0% { transform:translateX(-12px); opacity:0; } 20% { opacity:1; } 80% { opacity:1; } 100% { transform:translateX(12px); opacity:0; } }\n';
  s.textContent += '@keyframes wx-wind-dot { 0% { transform:translateX(-10px); opacity:0; } 20% { opacity:0.85; } 80% { opacity:0.85; } 100% { transform:translateX(14px); opacity:0; } }\n';
  s.textContent += '@keyframes wx-star { 0%,100% { opacity:1; } 50% { opacity:0.2; } }\n';
  s.textContent += '@keyframes wx-hot-pulse { 0%,100% { box-shadow:0 0 0 0.375em #fff, 0 0 0 0.9em rgba(255,153,0,0.2); } 50% { box-shadow:0 0 0 0.375em #fff, 0 0 0 1.4em rgba(255,153,0,0.3); } }\n';
  document.head.appendChild(s);
})();
