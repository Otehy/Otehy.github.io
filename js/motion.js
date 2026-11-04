/* Flyniton: video de portada, entrada del título, contadores y la secuencia de despegue.
   Con movimiento reducido o sin GSAP todo queda quieto y legible. */
(function(){
  var FN = window.FN;
  if (!FN) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var animate = !FN.reduce && !!gsap;
  if (animate && ST) gsap.registerPlugin(ST);

  /* ---------- video de portada ---------- */
  FN.safe(function(){
    var v = document.getElementById("hero-video"), btn = document.getElementById("hero-play");
    if (!v || FN.reduce) return;
    var saveData = navigator.connection && navigator.connection.saveData;
    if (saveData) return;
    /* preload="none" no carga nada por sí solo: hay que pedir la carga y la reproducción */
    v.preload = "auto";
    v.src = v.dataset.src;
    v.addEventListener("playing", function(){ btn.hidden = false; });
    var p = v.play();
    if (p && p.catch) p.catch(function(){});
    function label(){
      var playing = !v.paused;
      btn.setAttribute("aria-pressed", String(playing));
      btn.innerHTML = playing
        ? '<span data-l="es">Pausar video</span><span data-l="en">Pause video</span>'
        : '<span data-l="es">Reproducir video</span><span data-l="en">Play video</span>';
    }
    btn.addEventListener("click", function(){ if (v.paused) v.play(); else v.pause(); });
    v.addEventListener("play", label);
    v.addEventListener("pause", label);
  });

  /* ---------- entrada del título ---------- */
  FN.safe(function(){
    if (!animate) return;
    gsap.from(".hero-title .ln>span", {yPercent: 110, duration: 1.1, ease: "power4.out", stagger: .12, delay: .15});
    gsap.from(".hero-lead, .hero .actions", {y: 24, opacity: 0, duration: .9, ease: "power3.out", stagger: .1, delay: .55});
  });

  /* ---------- contadores ---------- */
  FN.safe(function(){
    var nums = document.querySelectorAll("[data-count]");
    if (!animate || !nums.length) return;
    function fmt(n, sep){ return sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n); }
    FN.lazy(document.querySelector(".facts-band"), function(){
      nums.forEach(function(el){
        var end = +el.dataset.count, o = {v: 0};
        gsap.to(o, {v: end, duration: 1.6, ease: "power2.out", onUpdate: function(){ el.textContent = fmt(Math.round(o.v), el.dataset.sep); }});
      });
    }, "-10% 0px");
  });

  /* ---------- despegue cuadro a cuadro ---------- */
  FN.safe(function(){
    var sec = document.getElementById("despegue"), img = document.getElementById("seq-img");
    /* es el único movimiento grande guiado por el scroll: se respeta "reducir movimiento" */
    if (!sec || !img || !animate || !ST || FN.prefersReduce) return;
    var frames = [], i;
    for (i = 1; i <= 9; i++){ frames.push("img/seq/0" + i + ".webp"); new Image().src = frames[i - 1]; }
    var steps = document.querySelectorAll("#seq-steps li"), bar = document.getElementById("seq-bar");
    var current = -1, fab = document.querySelector(".fab");
    function barH(){ var t = document.getElementById("top"); return t ? t.offsetHeight : 0; }
    sec.classList.add("js-seq");
    function show(p){
      var f = Math.min(8, Math.round(p * 8));
      if (f !== current){ current = f; img.src = frames[f]; }
      bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      var s = p < .34 ? 0 : p < .67 ? 1 : 2;
      steps.forEach(function(li, k){ li.classList.toggle("on", k === s); });
    }
    show(0);
    ST.create({
      trigger: sec, start: function(){ return "top " + barH() + "px"; }, end: "+=160%", pin: true, scrub: true,
      onUpdate: function(self){ show(self.progress); },
      onToggle: function(self){ if (fab) fab.classList.toggle("away", self.isActive); }
    });
  });
})();
