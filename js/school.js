/* Flyniton: entrada del título de la escuela y línea de tiempo del instructor. */
(function(){
  var FN = window.FN, gsap = window.gsap;
  if (!FN || FN.reduce || !gsap) return;
  FN.safe(function(){
    gsap.from(".s-title .ln>span", {yPercent: 110, duration: 1.1, ease: "power4.out", stagger: .12, delay: .1});
    gsap.from(".s-logo, .s-hero .badge, .s-hero .hero-lead, .s-hero .actions", {y: 20, opacity: 0, duration: .8, ease: "power3.out", stagger: .08, delay: .35});
  });
  FN.safe(function(){
    var items = document.querySelectorAll("#cred-timeline li");
    FN.lazy(document.getElementById("cred-timeline"), function(){
      gsap.from(items, {x: -18, opacity: 0, duration: .6, ease: "power2.out", stagger: .15});
    }, "-15% 0px");
  });
})();
