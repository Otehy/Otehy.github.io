/* Flyniton: mapa satelital 3D con recorrido por la ruta real, parapente animado,
   perfil de altura calculado con el relieve real y fotos por lugar. */
(function(){
  var FN = window.FN;
  var el = document.getElementById("map");
  if (!FN || !el) return;

  var NITON = [-78.543889, -1.286111];
  /* Ruta por carretera Baños - Cerro Niton, calculada sobre OpenStreetMap */
  var ROUTE = [[-78.4245,-1.3966],[-78.4251,-1.3951],[-78.4279,-1.3966],[-78.4311,-1.3964],[-78.4411,-1.4018],[-78.4458,-1.3996],[-78.4531,-1.4069],[-78.4656,-1.4072],[-78.4694,-1.4091],[-78.4731,-1.406],[-78.4758,-1.4073],[-78.4734,-1.4024],[-78.4791,-1.3926],[-78.4813,-1.3912],[-78.4815,-1.3868],[-78.487,-1.3854],[-78.4966,-1.3861],[-78.4993,-1.3845],[-78.4999,-1.3815],[-78.503,-1.3798],[-78.5067,-1.3717],[-78.5006,-1.3652],[-78.5014,-1.3627],[-78.5033,-1.3609],[-78.5075,-1.3609],[-78.5136,-1.3627],[-78.5143,-1.3594],[-78.5207,-1.355],[-78.5247,-1.3501],[-78.5284,-1.3445],[-78.5288,-1.341],[-78.5254,-1.3348],[-78.5265,-1.3311],[-78.5363,-1.3326],[-78.5377,-1.3292],[-78.5414,-1.3278],[-78.5447,-1.3302],[-78.5518,-1.326],[-78.5537,-1.3279],[-78.5548,-1.3239],[-78.5537,-1.3185],[-78.5554,-1.3147],[-78.5546,-1.3122],[-78.556,-1.3066],[-78.5523,-1.2949],[-78.5437,-1.2865]];
  var VIEWS = {
    niton:{center:[-78.5315,-1.312], zoom:12.1, pitch:74, bearing:150},
    volcan:{center:[-78.4415,-1.4671], zoom:12, pitch:68, bearing:-28},
    banos:{center:[-78.4246,-1.3966], zoom:14.2, pitch:58, bearing:205},
    todo:{center:[-78.485,-1.345], zoom:11.2, pitch:50, bearing:118}
  };
  var PINS = [
    {at:NITON, cls:"main", es:"Cerro Niton, 3.000 m", en:"Cerro Niton, 3,000 m", view:"niton", img:"img/v3/manga-s.webp", pes:"La manga de viento en nuestro despegue.", pen:"The windsock at our takeoff."},
    {at:[-78.4415,-1.4671], es:"Volcán Tungurahua", en:"Tungurahua volcano", view:"volcan", img:"img/v3/volcan-dos-velas-s.webp", pes:"Así lo ves desde el aire.", pen:"This is how you see it from the air."},
    {at:[-78.4246,-1.3966], es:"Baños, 1.820 m", en:"Baños, 1,820 m", view:"banos", img:"img/office.webp", pes:"Nuestra oficina y punto de salida, en el Pasaje Enrique Mideros y Calle Ambato.", pen:"Our office and meeting point, on Pasaje Enrique Mideros y Calle Ambato."},
    {at:[-78.5430,-1.3306], es:"Pelileo", en:"Pelileo"},
    {at:[-78.5070,-1.3150], es:"Patate", en:"Patate"}
  ];

  /* distancias en km sobre la ruta, para recorrerla y para el perfil */
  function km(a, b){
    var R = 6371, dLat = (b[1] - a[1]) * Math.PI / 180, dLon = (b[0] - a[0]) * Math.PI / 180;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  var CUM = [0];
  for (var i = 1; i < ROUTE.length; i++) CUM.push(CUM[i - 1] + km(ROUTE[i - 1], ROUTE[i]));
  var TOTAL = CUM[CUM.length - 1];
  function along(d){
    d = Math.max(0, Math.min(TOTAL, d));
    var k = 1;
    while (k < CUM.length - 1 && CUM[k] < d) k++;
    var t = (d - CUM[k - 1]) / ((CUM[k] - CUM[k - 1]) || 1), a = ROUTE[k - 1], b = ROUTE[k];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  function bearing(a, b){
    var y = Math.sin((b[0] - a[0]) * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180);
    var x = Math.cos(a[1] * Math.PI / 180) * Math.sin(b[1] * Math.PI / 180) - Math.sin(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.cos((b[0] - a[0]) * Math.PI / 180);
    return Math.atan2(y, x) * 180 / Math.PI;
  }
  function flightPoint(t){
    return [NITON[0] + (1.9 + 2.4 * Math.cos(t)) / 111.3, NITON[1] - (.9 + 1.7 * Math.sin(t)) / 110.6];
  }
  function flightArea(){ var p = []; for (var i = 0; i <= 72; i++) p.push(flightPoint(i / 72 * Math.PI * 2)); return p; }

  /* ---------- elevación real: teselas Terrarium leídas en un canvas ---------- */
  function elevations(points, z){
    var n = Math.pow(2, z), tiles = {}, keys = [];
    function tileOf(p){
      var x = (p[0] + 180) / 360 * n, lat = p[1] * Math.PI / 180;
      var y = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * n;
      return {tx: Math.floor(x), ty: Math.floor(y), px: Math.floor((x % 1) * 256), py: Math.floor((y % 1) * 256)};
    }
    var refs = points.map(function(p){ var t = tileOf(p); var k = t.tx + "/" + t.ty; if (!tiles[k]){ tiles[k] = null; keys.push(k); } t.k = k; return t; });
    return Promise.all(keys.map(function(k){
      return new Promise(function(ok, bad){
        var im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = function(){
          var c = document.createElement("canvas"); c.width = c.height = 256;
          var g = c.getContext("2d"); g.drawImage(im, 0, 0);
          tiles[k] = g.getImageData(0, 0, 256, 256).data; ok();
        };
        im.onerror = bad;
        im.src = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/" + z + "/" + k + ".png";
      });
    })).then(function(){
      return refs.map(function(t){ var d = tiles[t.k], i = (t.py * 256 + t.px) * 4; return d[i] * 256 + d[i + 1] + d[i + 2] / 256 - 32768; });
    });
  }

  function initProfile(map){
    var box = document.getElementById("profile"), svg = document.getElementById("profile-svg"), read = document.getElementById("profile-read");
    var N = 90, pts = [], dist = [];
    for (var i = 0; i < N; i++){ dist.push(TOTAL * i / (N - 1)); pts.push(along(dist[i])); }
    elevations(pts, 13).then(function(h){
      box.hidden = false;
      var dot = document.createElement("div"); dot.className = "pin-dot";
      var marker = new maplibregl.Marker({element: dot}).setLngLat(pts[0]);
      var lo = Math.min.apply(null, h), hi = Math.max.apply(null, h), cur = N - 1, svgNS = "http://www.w3.org/2000/svg";
      function draw(){
        var W = svg.clientWidth || 500, H = svg.clientHeight || 90;
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        while (svg.lastChild && svg.lastChild.nodeName !== "title") svg.removeChild(svg.lastChild);
        function x(i){ return W * i / (N - 1); }
        function y(v){ return 6 + (H - 12) * (1 - (v - lo + 40) / (hi - lo + 80)); }
        var d = "", a = "M0 " + H;
        h.forEach(function(v, i){ d += (i ? " L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); a += " L" + x(i).toFixed(1) + " " + y(v).toFixed(1); });
        a += " L" + W + " " + H + " Z";
        var area = document.createElementNS(svgNS, "path"); area.setAttribute("class", "p-area"); area.setAttribute("d", a); svg.appendChild(area);
        var line = document.createElementNS(svgNS, "path"); line.setAttribute("class", "p-line"); line.setAttribute("d", d); svg.appendChild(line);
        var c = document.createElementNS(svgNS, "line"); c.setAttribute("class", "p-cur");
        c.setAttribute("x1", x(cur)); c.setAttribute("x2", x(cur)); c.setAttribute("y1", 0); c.setAttribute("y2", H); svg.appendChild(c);
      }
      function fmt(v){ return Math.round(v / 10) * 10; }
      function set(i, showOnMap){
        cur = Math.max(0, Math.min(N - 1, i));
        read.textContent = (FN.lang === "en" ? dist[cur].toFixed(1) : dist[cur].toFixed(1).replace(".", ",")) + " km · " +
          String(fmt(h[cur])).replace(/\B(?=(\d{3})+(?!\d))/g, FN.t(".", ",")) + " m";
        if (showOnMap) marker.setLngLat(pts[cur]).addTo(map);
        draw();
      }
      function pick(e){
        var r = svg.getBoundingClientRect();
        set(Math.round((e.clientX - r.left) / r.width * (N - 1)), true);
      }
      svg.setAttribute("tabindex", "0");
      svg.addEventListener("pointermove", pick);
      svg.addEventListener("pointerdown", pick);
      svg.addEventListener("pointerleave", function(){ marker.remove(); });
      svg.addEventListener("keydown", function(e){
        if (e.key === "ArrowRight" || e.key === "ArrowLeft"){ e.preventDefault(); set(cur + (e.key === "ArrowRight" ? 2 : -2), true); }
      });
      FN.onLang(function(){
        svg.setAttribute("aria-label", FN.t("Perfil de altura de la ruta. Usa las flechas para recorrerlo.", "Elevation profile of the route. Use the arrow keys to move along it."));
        document.getElementById("profile-t").textContent = FN.t("Perfil de altura", "Elevation profile");
        set(cur, false);
      });
      window.addEventListener("resize", draw);
    }).catch(function(){ box.hidden = true; });
  }

  /* ---------- parapente animado sobre la zona de vuelo ---------- */
  function initGlider(map){
    var g = document.createElement("div");
    g.innerHTML = '<svg class="glider" viewBox="0 0 38 26" aria-hidden="true"><defs><linearGradient id="gw" x1="0" x2="1"><stop offset=".33" stop-color="#13804F"/><stop offset=".33" stop-color="#F6C51B"/><stop offset=".5" stop-color="#F6C51B"/><stop offset=".5" stop-color="#D8342B"/></linearGradient></defs><path d="M2 11 Q19 -3 36 11 Q19 5 2 11Z" fill="url(#gw)"/><path d="M4 11 L19 23 L34 11" fill="none" stroke="#fff" stroke-width="1"/><circle cx="19" cy="23" r="2.5" fill="#fff"/></svg>';
    var marker = new maplibregl.Marker({element: g.firstChild}).setLngLat(flightPoint(0)).addTo(map);
    if (FN.reduce) return;
    var visible = true, t0 = performance.now();
    if ("IntersectionObserver" in window) new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }).observe(el);
    (function tick(now){
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      marker.setLngLat(flightPoint(((now - t0) / 40000) * Math.PI * 2));
    })(t0);
  }

  /* ---------- recorrido de Baños al Niton ---------- */
  function initTour(map, go){
    var btn = document.getElementById("map-tour"), running = false, raf = 0;
    function label(){
      btn.innerHTML = running ? '<span data-l="es">Detener recorrido</span><span data-l="en">Stop the tour</span>'
                              : '<span data-l="es">Hacer el recorrido</span><span data-l="en">Take the tour</span>';
    }
    function stop(){ if (!running) return; running = false; cancelAnimationFrame(raf); label(); }
    btn.disabled = false;
    btn.addEventListener("click", function(){
      if (running){ stop(); return; }
      if (FN.reduce){ go("todo"); return; }
      running = true; label();
      el.scrollIntoView({behavior: "smooth", block: "center"});
      var dur = 16000, start = performance.now(), b = bearing(ROUTE[0], along(1.2));
      map.jumpTo({center: ROUTE[0], zoom: 13.4, pitch: 64, bearing: b});
      (function step(now){
        if (!running) return;
        var p = Math.min(1, (now - start) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var d = e * TOTAL, here = along(d), ahead = along(d + 1.2);
        var target = bearing(here, ahead), diff = ((target - b + 540) % 360) - 180;
        b += diff * .04;
        map.jumpTo({center: here, bearing: b, pitch: 64, zoom: 13.4});
        if (p < 1) raf = requestAnimationFrame(step);
        else { running = false; label(); go("niton"); }
      })(start);
    });
    ["mousedown", "touchstart", "wheel"].forEach(function(ev){ map.on(ev, stop); });
    FN.onLang(label);
  }

  function initMap(){
    var loaded = false;
    function showFallback(){
      document.getElementById("map-fallback").hidden = false;
      document.getElementById("places").hidden = true;
      document.getElementById("map-tour").hidden = true;
      document.querySelector(".legend").hidden = true;
    }
    function load(){
      if (loaded) return;
      loaded = true;
      var css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "lib/maplibre-gl.css?v=20261104";
      document.head.appendChild(css);
      var s = document.createElement("script");
      s.src = "lib/maplibre-gl.js?v=20261104";
      s.onload = function(){ FN.safe(build); };
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
          attributionControl: {compact: true}
        });
      } catch(e){ return showFallback(); }

      map.addControl(new maplibregl.NavigationControl({visualizePitch: true}), "top-right");
      map.addControl(new maplibregl.FullscreenControl(), "top-right");
      document.getElementById("map-layers").hidden = false;

      var buttons = document.querySelectorAll("#places button"), popup = null;
      function go(name){
        buttons.forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.place === name)); });
        map.flyTo(Object.assign({duration: FN.reduce ? 0 : 3200, curve: 1.2}, VIEWS[name]));
      }
      buttons.forEach(function(b){ b.addEventListener("click", function(){ go(b.dataset.place); }); });

      PINS.forEach(function(p){
        var d = document.createElement("div");
        d.className = "pin" + (p.cls ? " " + p.cls : "");
        d.innerHTML = '<span><span data-l="es">' + p.es + '</span><span data-l="en">' + p.en + '</span></span>';
        var m = new maplibregl.Marker({element: d, anchor: "bottom"}).setLngLat(p.at).addTo(map);
        if (!p.view) return;
        d.setAttribute("role", "button");
        d.setAttribute("tabindex", "0");
        function open(){
          go(p.view);
          if (popup) popup.remove();
          popup = new maplibregl.Popup({offset: 42, maxWidth: "260px", closeOnClick: false}).setLngLat(p.at)
            .setHTML('<img src="' + p.img + '" alt=""><p>' + FN.t(p.pes, p.pen) + '</p>').addTo(map);
        }
        /* el clic del marcador también llega al mapa, que cerraría la foto al instante */
        d.addEventListener("click", function(e){ e.stopPropagation(); open(); });
        d.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); open(); } });
        FN.onLang(function(){ d.setAttribute("aria-label", FN.t("Ver foto: ", "See photo: ") + FN.t(p.es, p.en)); });
      });

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
        Object.keys(T).forEach(function(s){ var n = el.querySelector(s); if (n){ n.title = T[s][FN.lang]; n.setAttribute("aria-label", T[s][FN.lang]); } });
        var dm = el.querySelector(".maplibregl-desktop-message"), mm = el.querySelector(".maplibregl-mobile-message");
        if (dm) dm.textContent = FN.t("Usa Ctrl + rueda para acercar el mapa", "Use Ctrl + scroll to zoom the map");
        if (mm) mm.textContent = FN.t("Usa dos dedos para mover el mapa", "Use two fingers to move the map");
      }
      FN.onLang(mapText);
      map.once("load", function(){
        FN.safe(function(){ initGlider(map); });
        FN.safe(function(){ initTour(map, go); });
        FN.safe(function(){ initProfile(map); });
        FN.safe(mapText);
      });
      window.__flynitonMap = map;
    }
    FN.lazy(el, load, "600px");
  }

  FN.safe(initMap);
})();
