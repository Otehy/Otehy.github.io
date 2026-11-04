/* Flyniton: condiciones en vivo del Cerro Niton (Open-Meteo).
   Brújula, gráfico de viento de 12:00 a 19:00, datos de la hora elegida y arco del sol. */
(function(){
  var FN = window.FN;
  var board = document.getElementById("wx");
  if (!FN || !board) return;
  var NITON = [-78.543889, -1.286111];
  var HOURS = [12, 13, 14, 15, 16, 17, 18, 19];
  var SVGNS = "http://www.w3.org/2000/svg";
  var days = [], day = 0, hour = 15, failed = false;
  var daysEl = document.getElementById("wx-days"), chart = document.getElementById("wx-chart");
  var hoursEl = document.createElement("div");
  hoursEl.className = "wx-hours";
  hoursEl.setAttribute("role", "group");
  chart.parentNode.appendChild(hoursEl);

  var COMPASS = {es:["N","NE","E","SE","S","SO","O","NO"], en:["N","NE","E","SE","S","SW","W","NW"]};
  function compass(deg){ return COMPASS[FN.lang][Math.round(deg / 45) % 8]; }
  /* criterio publicado por Flyniton: sureste, 15 a 30 km/h, sin lluvia */
  function inRange(h){ return h.wind >= 15 && h.wind <= 30 && h.dir >= 100 && h.dir <= 170 && h.rain < 50; }
  function el(tag, attrs){ var n = document.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function pt(b, r){ var a = b * Math.PI / 180; return [120 + r * Math.sin(a), 120 - r * Math.cos(a)]; }
  function dayLabel(d, i){
    if (i === 0) return FN.t("Hoy", "Today");
    if (i === 1) return FN.t("Mañana", "Tomorrow");
    var p = d.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(FN.lang, {weekday: "long"});
  }

  /* brújula fija: marcas y sector sureste */
  (function(){
    var ticks = document.getElementById("wx-ticks");
    for (var b = 0; b < 360; b += 22.5){
      var a = pt(b, 104), c = pt(b, b % 90 === 0 ? 88 : 96);
      ticks.appendChild(el("line", {x1: a[0], y1: a[1], x2: c[0], y2: c[1]}));
    }
    var s = pt(100, 104), e = pt(170, 104);
    document.getElementById("wx-sector").setAttribute("d", "M120 120 L" + s[0] + " " + s[1] + " A104 104 0 0 1 " + e[0] + " " + e[1] + " Z");
  })();

  function selected(){
    var d = days[day];
    for (var i = 0; i < d.hours.length; i++) if (d.hours[i].hour === hour) return d.hours[i];
    return d.hours[0];
  }

  function renderDays(){
    daysEl.innerHTML = "";
    days.forEach(function(d, i){
      var b = document.createElement("button");
      b.type = "button"; b.textContent = dayLabel(d.date, i);
      b.setAttribute("aria-pressed", String(i === day));
      b.addEventListener("click", function(){ day = i; renderAll(); daysEl.children[i].focus(); });
      daysEl.appendChild(b);
    });
  }

  function renderChart(){
    var d = days[day], W = chart.clientWidth || 640, H = chart.clientHeight || 220;
    var L = 34, R = 10, T = 12, B = 8;
    var top = 40;
    d.hours.forEach(function(h){ top = Math.max(top, Math.ceil(h.gust / 10) * 10); });
    function x(i){ return L + (W - L - R) * i / (d.hours.length - 1); }
    function y(v){ return T + (H - T - B) * (1 - v / top); }
    chart.setAttribute("viewBox", "0 0 " + W + " " + H);
    chart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    while (chart.lastChild && chart.lastChild.nodeName !== "title") chart.removeChild(chart.lastChild);
    var defs = el("defs", {}), g = el("linearGradient", {id: "wx-grad", x1: 0, y1: 0, x2: 0, y2: 1});
    g.appendChild(el("stop", {offset: "0", "stop-color": "#fff", "stop-opacity": ".28"}));
    g.appendChild(el("stop", {offset: "1", "stop-color": "#fff", "stop-opacity": "0"}));
    defs.appendChild(g); chart.appendChild(defs);
    chart.appendChild(el("rect", {"class": "band", x: L, y: y(30), width: W - L - R, height: y(15) - y(30)}));
    for (var v = 0; v <= top; v += 10){
      chart.appendChild(el("line", {"class": "grid", x1: L, x2: W - R, y1: y(v), y2: y(v)}));
      var t = el("text", {"class": "ax", x: L - 6, y: y(v) + 4, "text-anchor": "end"}); t.textContent = v; chart.appendChild(t);
    }
    var line = "", gust = "", area = "M" + x(0) + " " + y(0);
    d.hours.forEach(function(h, i){
      line += (i ? " L" : "M") + x(i) + " " + y(h.wind);
      gust += (i ? " L" : "M") + x(i) + " " + y(h.gust);
      area += " L" + x(i) + " " + y(h.wind);
    });
    area += " L" + x(d.hours.length - 1) + " " + y(0) + " Z";
    chart.appendChild(el("path", {"class": "area", d: area}));
    chart.appendChild(el("path", {"class": "gust", d: gust}));
    var ln = el("path", {"class": "line", d: line});
    chart.appendChild(ln);
    var si = 0;
    d.hours.forEach(function(h, i){ if (h.hour === hour) si = i; });
    chart.appendChild(el("line", {"class": "cursor", x1: x(si), x2: x(si), y1: T, y2: H - B}));
    d.hours.forEach(function(h, i){
      chart.appendChild(el("circle", {cx: x(i), cy: y(h.wind), r: i === si ? 7 : 4.5, fill: inRange(h) ? "#3FBF83" : "#10233F", stroke: "#fff", "stroke-width": 2.5}));
    });
    if (!FN.reduce && ln.getTotalLength){
      var len = ln.getTotalLength();
      ln.style.strokeDasharray = len; ln.style.strokeDashoffset = len;
      ln.getBoundingClientRect();
      ln.style.transition = "stroke-dashoffset 1.1s ease-out";
      ln.style.strokeDashoffset = 0;
    }
    /* botones de hora: accesibles con teclado, debajo del gráfico */
    hoursEl.style.gridTemplateColumns = "repeat(" + d.hours.length + ",1fr)";
    hoursEl.style.paddingLeft = L + "px";
    hoursEl.setAttribute("aria-label", FN.t("Hora", "Hour"));
    hoursEl.innerHTML = "";
    d.hours.forEach(function(h){
      var b = document.createElement("button");
      b.type = "button"; b.textContent = W > 480 ? h.hour + ":00" : h.hour + "h";
      if (inRange(h)) b.className = "ok";
      b.setAttribute("aria-pressed", String(h.hour === hour));
      b.addEventListener("click", function(){ hour = h.hour; renderAll(); hoursEl.querySelector("[aria-pressed=true]").focus(); });
      hoursEl.appendChild(b);
    });
  }

  function renderNow(){
    var h = selected(), d = days[day];
    document.getElementById("wx-needle").style.transform = "rotate(" + Math.round(h.dir) + "deg)";
    var now = document.getElementById("wx-now");
    now.querySelector(".wx-speed").textContent = Math.round(h.wind);
    now.querySelector(".wx-from").textContent = FN.t("del ", "from ") + compass(h.dir) + FN.t(", a las ", ", at ") + h.hour + ":00" +
      (inRange(h) ? FN.t(". Dentro de nuestro viento habitual", ". Within our usual wind") : "");
    var st = document.getElementById("wx-stats");
    st.querySelector("[data-k=temp]").textContent = Math.round(h.temp) + " °C";
    st.querySelector("[data-k=cloud]").textContent = Math.round(h.cloud) + " %";
    st.querySelector("[data-k=rain]").textContent = Math.round(h.rain) + " %";
    st.querySelector("[data-k=gust]").textContent = Math.round(h.gust) + " km/h";
    var sun = document.getElementById("wx-sun");
    sun.querySelector("[data-k=rise]").textContent = d.rise.slice(11, 16);
    sun.querySelector("[data-k=set]").textContent = d.set.slice(11, 16);
    function hrs(s){ return +s.slice(11, 13) + +s.slice(14, 16) / 60; }
    var t = Math.max(0, Math.min(1, (h.hour - hrs(d.rise)) / (hrs(d.set) - hrs(d.rise))));
    var dot = document.getElementById("wx-sundot");
    dot.setAttribute("cx", (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 160 + t * t * 300);
    dot.setAttribute("cy", (1 - t) * (1 - t) * 80 + 2 * (1 - t) * t * -20 + t * t * 80);
    document.getElementById("wx-west").textContent = FN.t("O", "W");
    document.getElementById("wx-compass-t").textContent = FN.t("Brújula de viento: ", "Wind compass: ") + compass(h.dir) + ", " + Math.round(h.wind) + " km/h";
    document.getElementById("wx-chart-t").textContent = FN.t("Viento por hora, de 12:00 a 19:00", "Wind by hour, 12:00 to 19:00");
  }

  function renderAll(){ if (days.length){ renderDays(); renderChart(); renderNow(); } }

  var loading = false;
  function showLoading(){
    var m = document.getElementById("wx-msg");
    m.hidden = false;
    m.textContent = FN.t("Cargando el pronóstico…", "Loading the forecast…");
  }

  function fail(){
    failed = true;
    board.querySelector(".wx-dial").hidden = true;
    board.querySelector(".wx-main").hidden = true;
    var m = document.getElementById("wx-msg");
    m.hidden = false;
    m.innerHTML = FN.t('El pronóstico no cargó. Escríbenos por <a href="https://wa.me/' + FN.wa + '" target="_blank" rel="noopener">WhatsApp</a> y te contamos cómo está el día.',
                       'The forecast didn\'t load. Message us on <a href="https://wa.me/' + FN.wa + '" target="_blank" rel="noopener">WhatsApp</a> to ask how the day looks.');
  }

  /* una petición con tiempo límite; las redes móviles a veces se cuelgan en el primer intento */
  function get(url, ms){
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function(){ if (ctl) ctl.abort(); }, ms);
    return fetch(url, ctl ? {signal: ctl.signal} : {}).then(function(r){
      clearTimeout(timer);
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }, function(e){ clearTimeout(timer); throw e; });
  }

  function load(){
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + NITON[1] + "&longitude=" + NITON[0] +
      "&hourly=temperature_2m,precipitation_probability,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
      "&daily=sunrise,sunset&timezone=America%2FGuayaquil&forecast_days=4&wind_speed_unit=kmh";
    loading = true; showLoading();
    get(url, 6000).catch(function(){ return get(url, 6000); }).then(function(j){
      var t = j.hourly, byDay = {}, order = [];
      t.time.forEach(function(iso, i){
        var date = iso.slice(0, 10), hr = +iso.slice(11, 13);
        if (HOURS.indexOf(hr) < 0) return;
        if (!byDay[date]){ byDay[date] = []; order.push(date); }
        byDay[date].push({hour: hr, wind: t.wind_speed_10m[i], dir: t.wind_direction_10m[i], gust: t.wind_gusts_10m[i],
          cloud: t.cloud_cover[i], rain: t.precipitation_probability[i] || 0, temp: t.temperature_2m[i]});
      });
      days = order.map(function(d){
        var k = j.daily.time.indexOf(d);
        return {date: d, hours: byDay[d], rise: j.daily.sunrise[k] || d + "T06:00", set: j.daily.sunset[k] || d + "T18:15"};
      }).filter(function(d){ return d.hours.length === HOURS.length; });
      if (!days.length) throw new Error("sin datos");
      loading = false;
      document.getElementById("wx-msg").hidden = true;
      renderAll();
    }).catch(function(){ loading = false; fail(); });
  }

  FN.onLang(function(){ if (failed) fail(); else if (loading) showLoading(); else renderAll(); });
  var rt;
  window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(function(){ if (days.length) renderChart(); }, 200); });
  FN.lazy(board, load, "500px");
})();
