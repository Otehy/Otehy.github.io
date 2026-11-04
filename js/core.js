/* Flyniton: lo común a todas las páginas. Expone window.FN para los demás scripts. */
(function(){
  var WA = "593988030968";
  var root = document.documentElement;
  var page = root.dataset.page || "home";
  var hooks = [];
  /* Windows trae "reducir movimiento" activado en muchos equipos: si lo respetáramos para todo,
     media audiencia vería una web quieta. Aquí todo el movimiento es suave, con pausa o
     iniciado por el visitante, así que no se apaga. Si se agrega algo intrusivo, usar FN.prefersReduce. */
  var prefersReduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var reduce = false;

  function safe(fn){ try { fn(); } catch(e){ if (window.console) console.warn(e); } }
  function $(id){ return document.getElementById(id); }
  function waUrl(text){ return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }
  /* corre fn una vez cuando el elemento se acerca a la pantalla */
  function lazy(el, fn, margin){
    if (!el) return;
    if (!("IntersectionObserver" in window)) return safe(fn);
    var io = new IntersectionObserver(function(en){
      if (en[0].isIntersecting){ io.disconnect(); safe(fn); }
    }, {rootMargin: margin || "400px"});
    io.observe(el);
  }

  var FN = window.FN = {
    lang: "es", reduce: reduce, prefersReduce: prefersReduce, page: page, wa: WA, waUrl: waUrl, safe: safe, lazy: lazy,
    onLang: function(fn){ hooks.push(fn); safe(fn); },
    t: function(es, en){ return FN.lang === "en" ? en : es; }
  };

  var MSG = {
    tandem:{es:"Hola Flyniton, quiero reservar un vuelo tándem en el Cerro Niton. ¿Qué disponibilidad y tarifa tienen?",
            en:"Hi Flyniton, I'd like to book a tandem paragliding flight at Cerro Niton. What availability and price do you have?"},
    school:{es:"Hola Flyniton, quiero información del curso de la Escuela de Parapente Tungurahua: próximas fechas, valor y número de sesiones.",
            en:"Hi Flyniton, I'd like information about the Escuela de Parapente Tungurahua course: next dates, price and number of sessions."}
  };
  var PAGE = {
    home:{
      es:{title:"Flyniton | Parapente en Baños y Pelileo, Tungurahua", desc:"Vuelos en parapente tándem desde el Cerro Niton (3.000 msnm) con vista al volcán Tungurahua, Escuela de Parapente Tungurahua (APPI) y equipos importados BGD. Oficina en Baños de Agua Santa, Ecuador."},
      en:{title:"Flyniton | Paragliding in Baños and Pelileo, Tungurahua", desc:"Tandem paragliding flights from Cerro Niton (3,000 m) facing Tungurahua volcano, the APPI paragliding school Escuela de Parapente Tungurahua, and imported BGD gear. Office in Baños de Agua Santa, Ecuador."}
    },
    school:{
      es:{title:"Escuela de Parapente Tungurahua | Escuela APPI en Baños, Ecuador", desc:"Aprende a volar parapente con la Escuela de Parapente Tungurahua, escuela APPI n.º 2714 desde 2013, dirigida por Edgar Paul Soria C., Master Instructor APPI. Baños de Agua Santa, Ecuador."},
      en:{title:"Escuela de Parapente Tungurahua | APPI paragliding school in Baños, Ecuador", desc:"Learn to paraglide with Escuela de Parapente Tungurahua, APPI school no. 2714 since 2013, run by Edgar Paul Soria C., APPI Master Instructor. Baños de Agua Santa, Ecuador."}
    }
  };
  var ARIA = {
    "brand":{es:"Flyniton, inicio",en:"Flyniton, home"},
    "nav-main":{es:"Principal",en:"Main"},
    "mobile-nav":{es:"Menú móvil",en:"Mobile menu"},
    "lightbox":{es:"Galería",en:"Gallery"},
    "lb-close":{es:"Cerrar",en:"Close"},
    "lb-prev":{es:"Anterior",en:"Previous"},
    "lb-next":{es:"Siguiente",en:"Next"}
  };

  function applyLang(l){
    FN.lang = l;
    root.classList.toggle("lang-en", l === "en");
    root.setAttribute("lang", l);
    document.querySelectorAll("[data-set-lang]").forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.setLang === l)); });
    document.querySelectorAll("[data-ph-es]").forEach(function(el){ el.placeholder = el.dataset[l === "en" ? "phEn" : "phEs"]; });
    document.querySelectorAll("option[data-es]").forEach(function(o){ o.textContent = o.dataset[l]; });
    document.querySelectorAll("[data-alt-es]").forEach(function(im){ im.alt = im.dataset[l === "en" ? "altEn" : "altEs"]; });
    document.querySelectorAll("[data-aria-es]").forEach(function(el){ el.setAttribute("aria-label", el.dataset[l === "en" ? "ariaEn" : "ariaEs"]); });
    document.querySelectorAll("[data-wa]").forEach(function(a){ var k = a.dataset.wa; if (MSG[k]) a.href = waUrl(MSG[k][l]); });
    Object.keys(ARIA).forEach(function(id){ var el = $(id); if (el) el.setAttribute("aria-label", ARIA[id][l]); });
    var p = PAGE[page] && PAGE[page][l];
    if (p){
      document.title = p.title;
      var meta = document.querySelector("meta[name=description]"); if (meta) meta.content = p.desc;
    }
    hooks.forEach(function(fn){ safe(fn); });
    try { localStorage.setItem("flyniton-lang", l); } catch(e){}
  }

  /* ---------- barra, menú y botón flotante ---------- */
  function initNav(){
    var top = $("top"), fab = document.querySelector(".fab"), first = document.querySelector("main > section");
    var contact = $("contacto"), contactInView = false;
    function onScroll(){
      var y = window.scrollY || 0;
      if (top) top.classList.toggle("scrolled", y > 24);
      if (fab && first) fab.classList.toggle("hide", y < first.offsetHeight * 0.7 || contactInView);
    }
    if ("IntersectionObserver" in window){
      if (contact) new IntersectionObserver(function(en){ contactInView = en[0].isIntersecting; onScroll(); }, {rootMargin:"0px 0px -20% 0px"}).observe(contact);
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

    var menuBtn = document.querySelector(".menu-btn"), mobileNav = $("mobile-nav");
    if (!menuBtn || !mobileNav) return;
    function closeMenu(){ mobileNav.hidden = true; menuBtn.setAttribute("aria-expanded","false"); }
    menuBtn.addEventListener("click", function(){
      var open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    mobileNav.addEventListener("click", function(e){ if (e.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !mobileNav.hidden){ closeMenu(); menuBtn.focus(); } });
  }

  /* ---------- cotización de equipos importados ---------- */
  function initGear(){
    var send = $("gear-send"), summary = $("gear-summary");
    if (!send || !summary) return;
    var btns = Array.prototype.slice.call(document.querySelectorAll(".gear"));
    var summaryDefault = summary.innerHTML;
    function update(){
      var sel = btns.filter(function(b){ return b.getAttribute("aria-pressed") === "true"; })
                    .map(function(b){ return b.dataset[FN.lang === "en" ? "gearEn" : "gearEs"]; });
      var text;
      if (sel.length){
        summary.textContent = FN.t("Tu cotización: ", "Your quote: ") + sel.join(", ") + ".";
        text = FN.t("Hola Flyniton, quiero cotización y catálogo de equipos importados BGD: " + sel.join(", ") + ". Mi nivel de vuelo es: ",
                    "Hi Flyniton, I'd like a quote and catalogue for imported BGD gear: " + sel.join(", ") + ". My flying level is: ");
      } else {
        summary.innerHTML = summaryDefault;
        text = FN.t("Hola Flyniton, quiero el catálogo de equipos importados BGD.", "Hi Flyniton, I'd like the imported BGD gear catalogue.");
      }
      send.href = waUrl(text);
    }
    btns.forEach(function(b){ b.addEventListener("click", function(){ b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); update(); }); });
    hooks.push(update);
  }

  /* ---------- formulario a WhatsApp ---------- */
  function initForm(){
    var form = $("contact-form");
    if (!form) return;
    var f = { name:$("f-name"), service:$("f-service"), date:$("f-date"), people:$("f-people"), msg:$("f-msg"), send:$("f-send"), err:$("f-name-err") };
    try { var t0 = new Date(); t0.setMinutes(t0.getMinutes() - t0.getTimezoneOffset()); f.date.min = t0.toISOString().slice(0,10); } catch(e){}
    function fmtDate(v){ var p = (v || "").split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : v; }
    function build(){
      var svc = f.service.options[f.service.selectedIndex].dataset[FN.lang];
      var lines = [FN.t("¡Hola Flyniton! Me llamo ", "Hi Flyniton! My name is ") + (f.name.value.trim() || "…") + "."];
      lines.push(FN.t("Me interesa: ", "I'm interested in: ") + svc + ".");
      if (f.date.value) lines.push(FN.t("Fecha preferida: ", "Preferred date: ") + fmtDate(f.date.value) + ".");
      var n = parseInt(f.people.value, 10);
      if (n > 0) lines.push(FN.t("Personas: ", "People: ") + n + ".");
      if (f.msg.value.trim()) lines.push(f.msg.value.trim());
      return lines.join("\n");
    }
    function update(){ f.send.href = waUrl(build()); }
    ["input","change"].forEach(function(ev){ form.addEventListener(ev, function(){
      if (f.name.value.trim()){ f.err.hidden = true; f.name.removeAttribute("aria-invalid"); f.name.removeAttribute("aria-describedby"); }
      update();
    }); });
    f.send.addEventListener("click", function(e){
      if (!f.name.value.trim()){ e.preventDefault(); f.err.hidden = false; f.name.setAttribute("aria-invalid","true"); f.name.setAttribute("aria-describedby","f-name-err"); f.name.focus(); }
    });
    form.addEventListener("submit", function(e){ e.preventDefault(); f.send.click(); });
    form.addEventListener("keydown", function(e){ if (e.key === "Enter" && e.target.tagName === "INPUT"){ e.preventDefault(); f.send.click(); } });
    hooks.push(update);
  }

  /* ---------- copiar número ---------- */
  function initCopy(){
    document.querySelectorAll("[data-copy]").forEach(function(b){
      var label = b.innerHTML, timer = null;
      b.addEventListener("click", function(){
        function done(ok){
          b.textContent = ok ? FN.t("Copiado", "Copied") : FN.t("Selecciónalo", "Select it");
          if (!ok){ var r = document.createRange(); r.selectNodeContents($("wa-num")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
          clearTimeout(timer);
          timer = setTimeout(function(){ b.innerHTML = label; }, 1800);
        }
        try { navigator.clipboard.writeText(b.dataset.copy).then(function(){ done(true); }, function(){ done(false); }); }
        catch(e){ done(false); }
      });
    });
  }

  document.querySelectorAll("[data-set-lang]").forEach(function(b){ b.addEventListener("click", function(){ applyLang(b.dataset.setLang); }); });
  safe(initNav);
  safe(initGear);
  safe(initForm);
  safe(initCopy);
  safe(function(){ $("yr").textContent = new Date().getFullYear(); });
  var start = "es";
  try {
    var saved = localStorage.getItem("flyniton-lang");
    if (saved === "es" || saved === "en") start = saved;
    else if (navigator.language && !/^es\b/i.test(navigator.language)) start = "en";
  } catch(e){ if (navigator.language && !/^es\b/i.test(navigator.language)) start = "en"; }
  FN.lang = start;
  /* los demás scripts (defer, después de este) registran FN.onLang; se aplica el idioma al terminar de cargar */
  document.addEventListener("DOMContentLoaded", function(){ applyLang(FN.lang); });
})();
