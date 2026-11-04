/* Flyniton: galería con filtros y visor (flechas, teclado, deslizar en el celular, videos). */
(function(){
  var FN = window.FN;
  var grid = document.getElementById("gallery"), lb = document.getElementById("lightbox");
  if (!FN || !grid || !lb) return;
  var media = document.getElementById("lb-media"), cap = document.getElementById("lb-cap");
  var closeBtn = document.getElementById("lb-close"), prev = document.getElementById("lb-prev"), next = document.getElementById("lb-next");
  var items = [], idx = 0, lastFocus = null;

  /* filtros */
  var filters = document.querySelectorAll("#gal-filters button");
  filters.forEach(function(b){
    b.addEventListener("click", function(){
      var f = b.dataset.filter;
      filters.forEach(function(o){ o.setAttribute("aria-pressed", String(o === b)); });
      grid.querySelectorAll(".g-item").forEach(function(it){ it.classList.toggle("out", f !== "all" && it.dataset.cat !== f); });
      if (!FN.prefersReduce && window.gsap){
        window.gsap.fromTo(grid.querySelectorAll(".g-item:not(.out)"), {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: .45, stagger: .03, ease: "power2.out"});
      }
    });
  });

  function large(img){
    var set = img.getAttribute("srcset");
    if (!set) return img.getAttribute("src");
    return set.split(",").pop().trim().split(" ")[0];
  }
  function caption(it){ return it.dataset[FN.lang === "en" ? "capEn" : "capEs"] || ""; }
  function show(i){
    idx = (i + items.length) % items.length;
    var it = items[idx], img = it.querySelector("img");
    media.innerHTML = "";
    if (it.dataset.video){
      var v = document.createElement("video");
      v.src = it.dataset.video; v.controls = true; v.playsInline = true; v.preload = "auto"; v.poster = img.getAttribute("src");
      if (!FN.reduce) v.autoplay = true;
      media.appendChild(v);
    } else {
      var im = document.createElement("img");
      im.src = large(img); im.alt = img.alt;
      media.appendChild(im);
    }
    cap.textContent = caption(it);
  }
  function open(it){
    items = Array.prototype.slice.call(grid.querySelectorAll(".g-item:not(.out)"));
    lastFocus = document.activeElement;
    show(items.indexOf(it));
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function close(){
    lb.hidden = true; media.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  grid.querySelectorAll(".g-item").forEach(function(it){ it.addEventListener("click", function(){ open(it); }); });
  closeBtn.addEventListener("click", close);
  prev.addEventListener("click", function(){ show(idx - 1); });
  next.addEventListener("click", function(){ show(idx + 1); });
  lb.addEventListener("click", function(e){ if (e.target === lb || e.target.id === "lb-stage") close(); });
  document.addEventListener("keydown", function(e){
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
    else if (e.key === "Tab"){
      var f = [closeBtn, prev, next], v = media.querySelector("video");
      if (v) f.push(v);
      var at = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(at + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
  });
  /* deslizar con el dedo */
  var x0 = null;
  lb.addEventListener("pointerdown", function(e){ if (e.pointerType !== "mouse") x0 = e.clientX; });
  lb.addEventListener("pointercancel", function(){ x0 = null; });
  lb.addEventListener("pointerup", function(e){
    if (x0 === null) return;
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
  FN.onLang(function(){ if (!lb.hidden) cap.textContent = caption(items[idx]); });
})();
