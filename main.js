(function(){
  var WA = "593988030968";
  var root = document.documentElement;
  var lang = "es";
  var langHooks = [];

  function safe(fn){ try { fn(); } catch(e){ if (window.console) console.warn(e); } }
  function $(id){ return document.getElementById(id); }

  var MSG = {
    tandem:{es:"Hola Flyniton, quiero reservar un vuelo tándem en el Cerro Niton. ¿Qué disponibilidad y tarifa tienen?",
            en:"Hi Flyniton, I'd like to book a tandem paragliding flight at Cerro Niton. What availability and price do you have?"},
    school:{es:"Hola Flyniton, quiero información del curso de parapente: próximas fechas, valor y número de sesiones.",
            en:"Hi Flyniton, I'd like information about the paragliding course: next dates, price and number of sessions."}
  };
  function waUrl(text){ return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }

  /* ---------- idioma ---------- */
  var ARIA = {
    "lb-close":{es:"Cerrar",en:"Close"},
    "lb-prev":{es:"Anterior",en:"Previous"},
    "lb-next":{es:"Siguiente",en:"Next"},
    "map":{es:"Mapa satelital en 3D del Cerro Niton, Baños y el volcán Tungurahua",en:"3D satellite map of Cerro Niton, Baños and Tungurahua volcano"},
    "brand":{es:"Flyniton, inicio",en:"Flyniton, home"},
    "nav-main":{es:"Principal",en:"Main"},
    "mobile-nav":{es:"Menú móvil",en:"Mobile menu"},
    "lightbox":{es:"Galería",en:"Gallery"}
  };
  var PAGE = {
    es:{title:"Flyniton | Parapente en Baños y Pelileo, Tungurahua",desc:"Vuelos en parapente tándem desde el Cerro Niton (3.000 msnm) con vista al volcán Tungurahua, escuela de parapente y equipos importados BGD. Oficina en Baños de Agua Santa, Ecuador."},
    en:{title:"Flyniton | Paragliding in Baños and Pelileo, Tungurahua",desc:"Tandem paragliding flights from Cerro Niton (3,000 m) facing Tungurahua volcano, a paragliding school and imported BGD gear. Office in Baños de Agua Santa, Ecuador."}
  };
  var ALTS = {
    ".hero-photo":{es:"Parapente tándem con vela verde, amarilla y roja volando frente al volcán Tungurahua",en:"Tandem paraglider with a green, yellow and red wing flying in front of Tungurahua volcano"},
    ".brand img,.foot-brand img":{es:"Flyniton Cía. Ltd. Operadora de Turismo",en:"Flyniton Cía. Ltd. Tour Operator"},
    ".ph-main img":{es:"Pasajera sonriente aterrizando en tándem con su piloto",en:"Smiling passenger landing in tandem with her pilot"},
    ".ph-side img":{es:"Turistas frente a la oficina de Flyniton en Baños de Agua Santa",en:"Tourists outside the Flyniton office in Baños de Agua Santa"},
    ".school-photo img":{es:"Alumnos practicando el inflado de sus parapentes en el campo",en:"Students practising inflating their paragliders on the field"}
  };
  function applyLang(l){
    lang = l;
    root.classList.toggle("lang-en", l === "en");
    root.setAttribute("lang", l);
    document.querySelectorAll("[data-set-lang]").forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.setLang === l)); });
    document.querySelectorAll("[data-ph-es]").forEach(function(el){ el.placeholder = el.dataset[l === "en" ? "phEn" : "phEs"]; });
    document.querySelectorAll("option[data-es]").forEach(function(o){ o.textContent = o.dataset[l]; });
    document.querySelectorAll("[data-wa]").forEach(function(a){ var k = a.dataset.wa; if (MSG[k]) a.href = waUrl(MSG[k][l]); });
    Object.keys(ARIA).forEach(function(id){ var el = $(id); if (el) el.setAttribute("aria-label", ARIA[id][l]); });
    document.title = PAGE[l].title;
    var meta = document.querySelector("meta[name=description]"); if (meta) meta.content = PAGE[l].desc;
    Object.keys(ALTS).forEach(function(sel){ document.querySelectorAll(sel).forEach(function(im){ im.alt = ALTS[sel][l]; }); });
    document.querySelectorAll("#gallery button").forEach(function(b){ b.querySelector("img").alt = b.dataset[l === "en" ? "capEn" : "capEs"]; });
    langHooks.forEach(function(fn){ safe(fn); });
    try { localStorage.setItem("flyniton-lang", l); } catch(e){}
  }

  /* ---------- navegación ---------- */
  function initNav(){
    var fab = document.querySelector(".fab");
    var hero = $("inicio");
    var contactInView = false;
    function onScroll(){
      var y = window.scrollY || 0;
      fab.classList.toggle("hide", y < hero.offsetHeight * 0.7 || contactInView);
    }
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(en){ contactInView = en[0].isIntersecting; onScroll(); }, {rootMargin:"0px 0px -20% 0px"}).observe($("contacto"));
      var links = {};
      document.querySelectorAll(".nav a[href^='#']").forEach(function(a){ links[a.getAttribute("href").slice(1)] = a; });
      var spy = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.isIntersecting && links[en.target.id]){
            Object.keys(links).forEach(function(k){ links[k].removeAttribute("aria-current"); });
            links[en.target.id].setAttribute("aria-current","true");
          }
        });
      }, {rootMargin:"-45% 0px -50% 0px"});
      Object.keys(links).forEach(function(id){ var s = $(id); if (s) spy.observe(s); });
    }
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();

    var menuBtn = document.querySelector(".menu-btn");
    var mobileNav = $("mobile-nav");
    function closeMenu(){ mobileNav.hidden = true; menuBtn.setAttribute("aria-expanded","false"); }
    menuBtn.addEventListener("click", function(){
      var open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    mobileNav.addEventListener("click", function(e){ if (e.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !mobileNav.hidden){ closeMenu(); menuBtn.focus(); } });
  }

  /* ---------- cotización de equipos ---------- */
  function initGear(){
    var btns = Array.prototype.slice.call(document.querySelectorAll(".gear"));
    var send = $("gear-send"), summary = $("gear-summary"), summaryDefault = summary.innerHTML;
    function update(){
      var sel = btns.filter(function(b){ return b.getAttribute("aria-pressed") === "true"; })
                    .map(function(b){ return b.dataset[lang === "en" ? "gearEn" : "gearEs"]; });
      var text;
      if (sel.length){
        summary.textContent = (lang === "en" ? "Your quote: " : "Tu cotización: ") + sel.join(", ") + ".";
        text = lang === "en"
          ? "Hi Flyniton, I'd like a quote and catalogue for imported BGD gear: " + sel.join(", ") + ". My flying level is: "
          : "Hola Flyniton, quiero cotización y catálogo de equipos importados BGD: " + sel.join(", ") + ". Mi nivel de vuelo es: ";
      } else {
        summary.innerHTML = summaryDefault;
        text = lang === "en" ? "Hi Flyniton, I'd like the imported BGD gear catalogue." : "Hola Flyniton, quiero el catálogo de equipos importados BGD.";
      }
      send.href = waUrl(text);
    }
    btns.forEach(function(b){ b.addEventListener("click", function(){ b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); update(); }); });
    langHooks.push(update);
  }

  /* ---------- formulario a WhatsApp ---------- */
  function initForm(){
    var f = {
      name:$("f-name"), service:$("f-service"), date:$("f-date"), people:$("f-people"),
      msg:$("f-msg"), send:$("f-send"), err:$("f-name-err"), form:$("contact-form")
    };
    try { var t0 = new Date(); t0.setMinutes(t0.getMinutes() - t0.getTimezoneOffset()); f.date.min = t0.toISOString().slice(0,10); } catch(e){}
    function fmtDate(v){ var p = (v || "").split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : v; }
    function buildMessage(){
      var en = lang === "en";
      var svc = f.service.options[f.service.selectedIndex].dataset[lang];
      var lines = [];
      lines.push(en ? "Hi Flyniton! My name is " + (f.name.value.trim() || "…") + "." : "¡Hola Flyniton! Me llamo " + (f.name.value.trim() || "…") + ".");
      lines.push((en ? "I'm interested in: " : "Me interesa: ") + svc + ".");
      if (f.date.value) lines.push((en ? "Preferred date: " : "Fecha preferida: ") + fmtDate(f.date.value) + ".");
      var n = parseInt(f.people.value, 10);
      if (n > 0) lines.push((en ? "People: " : "Personas: ") + n + ".");
      if (f.msg.value.trim()) lines.push(f.msg.value.trim());
      return lines.join("\n");
    }
    function update(){ f.send.href = waUrl(buildMessage()); }
    ["input","change"].forEach(function(ev){ f.form.addEventListener(ev, function(){
      if (f.name.value.trim()){ f.err.hidden = true; f.name.removeAttribute("aria-invalid"); f.name.removeAttribute("aria-describedby"); }
      update();
    }); });
    f.send.addEventListener("click", function(e){
      if (!f.name.value.trim()){ e.preventDefault(); f.err.hidden = false; f.name.setAttribute("aria-invalid","true"); f.name.setAttribute("aria-describedby","f-name-err"); f.name.focus(); }
    });
    f.form.addEventListener("submit", function(e){ e.preventDefault(); f.send.click(); });
    f.form.addEventListener("keydown", function(e){ if (e.key === "Enter" && e.target.tagName === "INPUT"){ e.preventDefault(); f.send.click(); } });
    langHooks.push(update);
  }

  /* ---------- copiar número ---------- */
  function initCopy(){
    document.querySelectorAll("[data-copy]").forEach(function(b){
      var label = b.innerHTML, timer = null;
      b.addEventListener("click", function(){

        function done(ok){
          b.textContent = ok ? (lang === "en" ? "Copied" : "Copiado") : (lang === "en" ? "Select it" : "Selecciónalo");
          if (!ok){ var r = document.createRange(); r.selectNodeContents($("wa-num")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
          clearTimeout(timer);
          timer = setTimeout(function(){ b.innerHTML = label; }, 1800);
        }
        try { navigator.clipboard.writeText(b.dataset.copy).then(function(){ done(true); }, function(){ done(false); }); }
        catch(e){ done(false); }
      });
    });
  }

  /* ---------- visor de fotos ---------- */
  function initLightbox(){
    var items = Array.prototype.slice.call(document.querySelectorAll("#gallery button"));
    var lb = $("lightbox"), lbImg = $("lb-img"), lbCap = $("lb-cap");
    var idx = 0, lastFocus = null;
    function show(i){
      idx = (i + items.length) % items.length;
      var img = items[idx].querySelector("img");
      lbImg.src = img.src; lbImg.alt = items[idx].dataset[lang === "en" ? "capEn" : "capEs"] || "";
      lbCap.textContent = items[idx].dataset[lang === "en" ? "capEn" : "capEs"] || "";
    }
    function openLb(i){ lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = "hidden"; $("lb-close").focus(); }
    function closeLb(){ lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    items.forEach(function(b, i){ b.addEventListener("click", function(){ openLb(i); }); });
    $("lb-close").addEventListener("click", closeLb);
    $("lb-prev").addEventListener("click", function(){ show(idx - 1); });
    $("lb-next").addEventListener("click", function(){ show(idx + 1); });
    lb.addEventListener("click", function(e){ if (e.target === lb || e.target.classList.contains("stage")) closeLb(); });
    document.addEventListener("keydown", function(e){
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "Tab"){
        var f = [$("lb-close"), $("lb-prev"), $("lb-next")], at = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(at + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
  }

  /* ---------- pronóstico en vivo (Open-Meteo) ---------- */
  var NITON = [-78.543889, -1.286111];
  function initWeather(){
    var hoursEl = $("wx-hours"), daysEl = $("wx-days");
    var HOURS = [15, 16, 17, 18];
    var days = [], active = 0;
    var COMPASS = {es:["N","NE","E","SE","S","SO","O","NO"], en:["N","NE","E","SE","S","SW","W","NW"]};

    function compass(deg){ return COMPASS[lang][Math.round(deg / 45) % 8]; }
    function dayLabel(d, i){
      if (i === 0) return lang === "en" ? "Today" : "Hoy";
      if (i === 1) return lang === "en" ? "Tomorrow" : "Mañana";
      var p = d.split("-");
      return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(lang, {weekday:"long"});
    }
    /* criterio publicado por Flyniton: sureste, 15 a 30 km/h, sin lluvia */
    function inRange(h){ return h.wind >= 15 && h.wind <= 30 && h.dir >= 100 && h.dir <= 170 && h.rain < 50; }

    function render(){
      if (!days.length) return;
      daysEl.innerHTML = "";
      days.forEach(function(d, i){
        var b = document.createElement("button");
        b.type = "button"; b.textContent = dayLabel(d.date, i);
        b.setAttribute("aria-pressed", String(i === active));
        b.addEventListener("click", function(){ active = i; render(); daysEl.children[active].focus(); });
        daysEl.appendChild(b);
      });
      hoursEl.innerHTML = "";
      days[active].hours.forEach(function(h){
        var li = document.createElement("li");
        var ok = inRange(h);
        if (ok) li.className = "ok";
        /* la flecha apunta hacia donde sopla el viento */
        var arrow = '<svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(' + Math.round(h.dir + 180) + 'deg)"><path fill="currentColor" d="M12 2l7 19-7-4-7 4z"/></svg>';
        li.innerHTML =
          '<span class="wx-time">' + h.hour + ':00</span>' +
          '<span class="wx-wind">' + arrow + Math.round(h.wind) + '</span>' +
          '<span class="wx-unit">km/h ' + (lang === "en" ? "from " : "del ") + compass(h.dir) + '</span>' +
          '<span class="wx-sub">' + (lang === "en" ? "Gusts " : "Ráfagas ") + Math.round(h.gust) + ' km/h<br>' +
          (lang === "en" ? "Cloud " : "Nubes ") + Math.round(h.cloud) + '%<br>' +
          (lang === "en" ? "Rain " : "Lluvia ") + Math.round(h.rain) + '%</span>' +
          (ok ? '<span class="wx-flag">' + (lang === "en" ? "Within our usual wind" : "Dentro de nuestro viento habitual") + '</span>' : '');
        hoursEl.appendChild(li);
      });
    }
    function fail(){
      hoursEl.innerHTML = '<li class="wx-msg">' + (lang === "en"
        ? 'The forecast didn\'t load. Message us on <a href="https://wa.me/' + WA + '">WhatsApp</a> to ask how the day looks.'
        : 'El pronóstico no cargó. Escríbenos por <a href="https://wa.me/' + WA + '">WhatsApp</a> y te contamos cómo está el día.') + '</li>';
    }
    var failed = false;
    langHooks.push(function(){ if (failed) fail(); else render(); });

    function load(){
      var url = "https://api.open-meteo.com/v1/forecast?latitude=" + NITON[1] + "&longitude=" + NITON[0] +
        "&hourly=temperature_2m,precipitation_probability,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
        "&timezone=America%2FGuayaquil&forecast_days=4&wind_speed_unit=kmh";
      fetch(url).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(function(j){
        var byDay = {}, order = [], t = j.hourly;
        t.time.forEach(function(iso, i){
          var date = iso.slice(0,10), hour = +iso.slice(11,13);
          if (HOURS.indexOf(hour) < 0) return;
          if (!byDay[date]){ byDay[date] = []; order.push(date); }
          byDay[date].push({hour:hour, wind:t.wind_speed_10m[i], dir:t.wind_direction_10m[i], gust:t.wind_gusts_10m[i], cloud:t.cloud_cover[i], rain:t.precipitation_probability[i] || 0});
        });
        days = order.map(function(d){ return {date:d, hours:byDay[d]}; });
        if (!days.length) throw new Error("sin datos");
        render();
      }).catch(function(){ failed = true; fail(); });
    }
    if ("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(en){ if (en[0].isIntersecting){ io.disconnect(); load(); } }, {rootMargin:"400px"});
      io.observe($("wx"));
    } else load();
  }

  /* ---------- mapa real: satélite, relieve 3D y ruta ---------- */
  /* Ruta por carretera Baños - Cerro Niton, calculada sobre OpenStreetMap */
  var ROUTE = [[-78.4245,-1.3966],[-78.4251,-1.3951],[-78.4279,-1.3966],[-78.4311,-1.3964],[-78.4411,-1.4018],[-78.4458,-1.3996],[-78.4531,-1.4069],[-78.4656,-1.4072],[-78.4694,-1.4091],[-78.4731,-1.406],[-78.4758,-1.4073],[-78.4734,-1.4024],[-78.4791,-1.3926],[-78.4813,-1.3912],[-78.4815,-1.3868],[-78.487,-1.3854],[-78.4966,-1.3861],[-78.4993,-1.3845],[-78.4999,-1.3815],[-78.503,-1.3798],[-78.5067,-1.3717],[-78.5006,-1.3652],[-78.5014,-1.3627],[-78.5033,-1.3609],[-78.5075,-1.3609],[-78.5136,-1.3627],[-78.5143,-1.3594],[-78.5207,-1.355],[-78.5247,-1.3501],[-78.5284,-1.3445],[-78.5288,-1.341],[-78.5254,-1.3348],[-78.5265,-1.3311],[-78.5363,-1.3326],[-78.5377,-1.3292],[-78.5414,-1.3278],[-78.5447,-1.3302],[-78.5518,-1.326],[-78.5537,-1.3279],[-78.5548,-1.3239],[-78.5537,-1.3185],[-78.5554,-1.3147],[-78.5546,-1.3122],[-78.556,-1.3066],[-78.5523,-1.2949],[-78.5437,-1.2865]];
  var VIEWS = {
    niton:{center:[-78.5315,-1.312], zoom:12.1, pitch:74, bearing:150},
    volcan:{center:[-78.4415,-1.4671], zoom:12, pitch:68, bearing:-28},
    banos:{center:[-78.4246,-1.3966], zoom:14.2, pitch:58, bearing:205},
    todo:{center:[-78.485,-1.345], zoom:11.2, pitch:50, bearing:118}
  };
  function flightArea(){
    var pts = [];
    for (var i = 0; i <= 72; i++){
      var t = i / 72 * Math.PI * 2;
      pts.push([NITON[0] + (1.9 + 2.4 * Math.cos(t)) / 111.3, NITON[1] - (.9 + 1.7 * Math.sin(t)) / 110.6]);
    }
    return pts;
  }
  function initMap(){
    var el = $("map"), loaded = false;
    function showFallback(){ $("map-fallback").hidden = false; $("places").hidden = true; document.querySelector(".legend").hidden = true; }
    function load(){
      if (loaded) return;
      loaded = true;
      var css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "lib/maplibre-gl.css?v=20261101";
      document.head.appendChild(css);
      var s = document.createElement("script");
      s.src = "lib/maplibre-gl.js?v=20261101";
      s.onload = function(){ safe(build); };
      s.onerror = showFallback;
      document.head.appendChild(s);
    }
    function build(){
      if (!window.maplibregl) return showFallback();
      var map;
      try {
        map = new maplibregl.Map({
          container: el,
          style: {
            version: 8,
            sources: {
              sat: {type:"raster", tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize:256, maxzoom:18, attribution:"© Esri, Maxar, Earthstar Geographics"},
              osm: {type:"raster", tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize:256, maxzoom:19, attribution:"© OpenStreetMap"},
              dem: {type:"raster-dem", tiles:["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], tileSize:256, maxzoom:14, encoding:"terrarium", attribution:"Terrain Tiles (AWS Open Data)"},
              route: {type:"geojson", data:{type:"Feature", properties:{}, geometry:{type:"LineString", coordinates:ROUTE}}},
              area: {type:"geojson", data:{type:"Feature", properties:{}, geometry:{type:"LineString", coordinates:flightArea()}}}
            },
            layers: [
              {id:"sat", type:"raster", source:"sat", paint:{"raster-saturation":.08, "raster-contrast":.06}},
              {id:"osm", type:"raster", source:"osm", layout:{visibility:"none"}},
              {id:"route-casing", type:"line", source:"route", layout:{"line-join":"round","line-cap":"round"}, paint:{"line-color":"#10233F","line-width":6,"line-opacity":.55}},
              {id:"route", type:"line", source:"route", layout:{"line-join":"round","line-cap":"round"}, paint:{"line-color":"#ffffff","line-width":3}},
              {id:"area", type:"line", source:"area", layout:{"line-join":"round"}, paint:{"line-color":"#F6C51B","line-width":3.5,"line-dasharray":[2,1.4]}}
            ],
            terrain: {source:"dem", exaggeration:1.25},
            sky: {"sky-color":"#6F9FD6","horizon-color":"#DDE9F5","fog-color":"#DDE9F5","sky-horizon-blend":.55,"horizon-fog-blend":.5,"fog-ground-blend":.55,"atmosphere-blend":0}
          },
          center: VIEWS.niton.center, zoom: VIEWS.niton.zoom, pitch: VIEWS.niton.pitch, bearing: VIEWS.niton.bearing,
          maxPitch: 80, minZoom: 8, maxZoom: 17,
          cooperativeGestures: true,
          attributionControl: {compact:true},
          locale: mapLocale()
        });
      } catch(e){ return showFallback(); }

      map.addControl(new maplibregl.NavigationControl({visualizePitch:true}), "top-right");
      map.addControl(new maplibregl.FullscreenControl(), "top-right");
      $("map-layers").hidden = false;

      var PINS = [
        {at:NITON, cls:"main", es:"Cerro Niton, 3.000 m", en:"Cerro Niton, 3,000 m", view:"niton"},
        {at:[-78.4415,-1.4671], es:"Volcán Tungurahua", en:"Tungurahua volcano", view:"volcan"},
        {at:[-78.4246,-1.3966], es:"Baños, 1.820 m", en:"Baños, 1,820 m", view:"banos"},
        {at:[-78.5430,-1.3306], es:"Pelileo", en:"Pelileo"},
        {at:[-78.5070,-1.3150], es:"Patate", en:"Patate"}
      ];
      PINS.forEach(function(p){
        var d = document.createElement("div");
        d.className = "pin" + (p.cls ? " " + p.cls : "");
        d.innerHTML = '<span><span data-l="es">' + p.es + '</span><span data-l="en">' + p.en + '</span></span>';
        if (p.view) d.addEventListener("click", function(){ go(p.view); });
        new maplibregl.Marker({element:d, anchor:"bottom"}).setLngLat(p.at).addTo(map);
      });

      var buttons = document.querySelectorAll("#places button");
      function go(name){
        buttons.forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.place === name)); });
        map.flyTo(Object.assign({duration:3200, curve:1.2}, VIEWS[name]));
      }
      buttons.forEach(function(b){ b.addEventListener("click", function(){ go(b.dataset.place); }); });

      document.querySelectorAll("#map-layers button").forEach(function(b){
        b.addEventListener("click", function(){
          var sat = b.dataset.layer === "sat";
          map.setLayoutProperty("sat", "visibility", sat ? "visible" : "none");
          map.setLayoutProperty("osm", "visibility", sat ? "none" : "visible");
          document.querySelectorAll("#map-layers button").forEach(function(o){ o.setAttribute("aria-pressed", String(o === b)); });
        });
      });
      function mapText(){
        var T = {
          ".maplibregl-ctrl-zoom-in":{es:"Acercar",en:"Zoom in"},
          ".maplibregl-ctrl-zoom-out":{es:"Alejar",en:"Zoom out"},
          ".maplibregl-ctrl-compass":{es:"Restablecer orientación",en:"Reset bearing"},
          ".maplibregl-ctrl-fullscreen":{es:"Pantalla completa",en:"Enter fullscreen"}
        };
        Object.keys(T).forEach(function(s){ var n = el.querySelector(s); if (n){ n.title = T[s][lang]; n.setAttribute("aria-label", T[s][lang]); } });
        var d = el.querySelector(".maplibregl-desktop-message"), m = el.querySelector(".maplibregl-mobile-message");
        if (d) d.textContent = lang === "en" ? "Use Ctrl + scroll to zoom the map" : "Usa Ctrl + rueda para acercar el mapa";
        if (m) m.textContent = lang === "en" ? "Use two fingers to move the map" : "Usa dos dedos para mover el mapa";
      }
      mapText();
      langHooks.push(mapText);
      window.__flynitonMap = map;
    }
    function mapLocale(){
      return lang === "en" ? {} : {
        "CooperativeGesturesHandler.WindowsHelpText":"Usa Ctrl + rueda para acercar el mapa",
        "CooperativeGesturesHandler.MacHelpText":"Usa ⌘ + rueda para acercar el mapa",
        "CooperativeGesturesHandler.MobileHelpText":"Usa dos dedos para mover el mapa",
        "NavigationControl.ZoomIn":"Acercar","NavigationControl.ZoomOut":"Alejar","NavigationControl.ResetBearing":"Restablecer orientación",
        "FullscreenControl.Enter":"Pantalla completa","FullscreenControl.Exit":"Salir de pantalla completa"
      };
    }
    if ("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(en){ if (en[0].isIntersecting){ io.disconnect(); load(); } }, {rootMargin:"600px"});
      io.observe(el);
    } else load();
  }

  /* ---------- inicio ---------- */
  document.querySelectorAll("[data-set-lang]").forEach(function(b){ b.addEventListener("click", function(){ applyLang(b.dataset.setLang); }); });
  safe(initNav);
  safe(initGear);
  safe(initForm);
  safe(initCopy);
  safe(initLightbox);
  safe(initWeather);
  safe(function(){ $("yr").textContent = new Date().getFullYear(); });
  var start = "es";
  try {
    var saved = localStorage.getItem("flyniton-lang");
    if (saved === "es" || saved === "en") start = saved;
    else if (navigator.language && !/^es\b/i.test(navigator.language)) start = "en";
  } catch(e){ if (navigator.language && !/^es\b/i.test(navigator.language)) start = "en"; }
  applyLang(start);
  safe(initMap);
})();
