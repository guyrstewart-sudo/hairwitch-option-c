/* THE HAIR WITCH — shared behavior for all design options
   Requires ../../site/js/config.js loaded first. */

(function () {
  "use strict";
  var cfg = window.HW_CONFIG || {};

  /* Square + Stripe buttons */
  document.querySelectorAll("[data-square]").forEach(function (a) {
    if (cfg.squareBookingUrl) a.href = cfg.squareBookingUrl;
  });
  document.querySelectorAll("[data-stripe]").forEach(function (a) {
    var url = cfg.stripeLinks && cfg.stripeLinks[a.getAttribute("data-stripe")];
    if (url) { a.href = url; } else { a.classList.add("not-configured"); }
  });
  /* Unconfigured purchase buttons: hide, unless marked data-keep —
     kept buttons fall back to an email order so no sale is ever lost */
  document.querySelectorAll("a.not-configured").forEach(function (a) {
    if (a.hasAttribute("data-keep")) {
      if (!a.getAttribute("href") || a.getAttribute("href") === "#") {
        a.href = "mailto:thehairwitch12@gmail.com?subject=" +
          encodeURIComponent("Order: " + (a.getAttribute("data-item") || a.textContent.trim()));
        a.removeAttribute("target");
      }
    } else {
      a.style.display = "none";
    }
  });

  /* Ebook copy from config */
  var eb = cfg.ebook || {};
  document.querySelectorAll("[data-ebook-title]").forEach(function (el) { if (eb.title) el.textContent = eb.title; });
  document.querySelectorAll("[data-ebook-price]").forEach(function (el) { if (eb.price) el.textContent = eb.price; });

  /* Contact + newsletter forms.
     If an endpoint is configured, POST there (Formspree/MailerLite style).
     Otherwise fall back to a prefilled email draft so no message is lost. */
  function wireForm(form, endpoint, subjectPrefix) {
    if (!form) return;
    if (endpoint) {
      form.action = endpoint;
      form.method = "POST";
      return;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var body = [];
      data.forEach(function (v, k) { if (k !== "_gotcha") body.push(k + ": " + v); });
      window.location.href = "mailto:thehairwitch12@gmail.com?subject=" +
        encodeURIComponent(subjectPrefix) + "&body=" + encodeURIComponent(body.join("\n"));
      var note = form.querySelector(".form-note");
      if (note) note.textContent = "Opening your email app — hit send and you're in.";
    });
  }
  wireForm(document.querySelector("form[data-contact]"), cfg.formEndpoint, "Message from the website");
  wireForm(document.querySelector("form[data-newsletter]"), cfg.newsletterEndpoint, "Join the Coven — newsletter signup");

  /* Reveal on scroll */
  var revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* Year */
  document.querySelectorAll("#year").forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* ==========================================================
     HER REAL ARCHIVE — components fed by shared-photos.js
     (extracted from her live site via the Option C mirror).
     Mount points: <div data-hw-portfolio></div>
                   <div data-hw-masonry></div>
     ========================================================== */
  (function () {
    var P = window.HW_PHOTOS;
    if (!P) return;
    var BASE = P.base;

    /* lightbox for images and videos (Esc / backdrop closes) */
    function openViewer(src, isVideo) {
      var ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.96);display:flex;align-items:center;justify-content:center;padding:2rem;";
      ov.innerHTML = (isVideo
        ? "<video src='" + src + "' controls autoplay playsinline style='max-width:92vw;max-height:84vh;outline:none;'></video>"
        : "<img src='" + src + "' alt='' style='max-width:92vw;max-height:84vh;display:block;'>") +
        "<button aria-label='Close' style='position:absolute;top:1rem;right:1.4rem;background:none;border:0;color:#fff;font-size:2.2rem;cursor:pointer;line-height:1;'>&times;</button>";
      function close() { var v = ov.querySelector("video"); if (v) v.pause(); ov.remove(); document.removeEventListener("keydown", onKey); }
      function onKey(e) { if (e.key === "Escape") close(); }
      ov.querySelector("button").addEventListener("click", close);
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(ov);
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-hw-view]");
      if (!t) return;
      e.preventDefault();
      var src = t.getAttribute("data-hw-view");
      openViewer(src, /\.(mp4|webm|mov)(\?|$)/i.test(src));
    });

    function cellNode(item, mode) {
      var d = document.createElement("div");
      d.style.cssText = mode === "carousel"
        ? "flex:0 0 auto;width:300px;height:400px;overflow:hidden;position:relative;cursor:zoom-in;"
        : "width:100%;height:300px;overflow:hidden;position:relative;cursor:zoom-in;";
      if (item.v) {
        d.setAttribute("data-hw-view", BASE + item.v);
        d.innerHTML = (item.t ? "<img src='" + BASE + item.t + "' alt='Video from The Hair Witch portfolio' loading='lazy' style='width:100%;height:100%;object-fit:cover;display:block;'>" : "") +
          "<span aria-hidden='true' style='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.6rem;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,0.7);'>&#9658;</span>";
      } else {
        d.setAttribute("data-hw-view", BASE + item.i);
        d.innerHTML = "<img src='" + BASE + item.i + "' alt='Hair transformation by The Hair Witch Asheville' loading='lazy' style='width:100%;height:100%;object-fit:cover;display:block;'>";
      }
      return d;
    }

    /* tabbed portfolio. Default mode: responsive GRID.
       Set data-hw-portfolio="carousel" to switch back to the
       arrow-paged, drag-scrollable band (kept for future use). */
    function mountPortfolio(host) {
      var mode = (host.getAttribute("data-hw-portfolio") || "grid").toLowerCase() || "grid";
      var cats = P.categories.filter(function (c) { return c.items.length; });
      var bar = document.createElement("div");
      bar.style.cssText = "display:flex;gap:1.6rem;flex-wrap:wrap;justify-content:center;margin-bottom:1.6rem;";
      var stage = document.createElement("div");
      stage.style.cssText = "position:relative;";
      var pane = document.createElement("div");
      pane.style.cssText = mode === "carousel"
        ? "display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;height:400px;scrollbar-width:thin;touch-action:pan-x;"
        : "display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;";
      stage.appendChild(pane);
      if (mode === "carousel") {
        var mkA = function (dir) {
          var b = document.createElement("button");
          b.innerHTML = dir < 0 ? "&#8249;" : "&#8250;";
          b.setAttribute("aria-label", dir < 0 ? "Previous photos" : "Next photos");
          b.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);" + (dir < 0 ? "left:8px;" : "right:8px;") +
            "z-index:5;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,0.92);color:#111;font-size:1.8rem;line-height:1;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.5);";
          b.addEventListener("click", function (ev) {
            ev.preventDefault();
            pane.scrollLeft += dir * Math.round(pane.clientWidth * 0.85);
          });
          return b;
        };
        stage.appendChild(mkA(-1));
        stage.appendChild(mkA(1));
        pane.addEventListener("pointerdown", function (e) {
          if (e.pointerType !== "mouse") return;
          var sx = e.clientX, ss = pane.scrollLeft, moved = false;
          function mv(ev) { var dx = ev.clientX - sx; if (Math.abs(dx) > 4) moved = true; pane.scrollLeft = ss - dx; }
          function up() {
            document.removeEventListener("pointermove", mv);
            document.removeEventListener("pointerup", up);
            if (moved) {
              var squelch = function (ce) { ce.stopPropagation(); ce.preventDefault(); document.removeEventListener("click", squelch, true); };
              document.addEventListener("click", squelch, true);
              setTimeout(function () { document.removeEventListener("click", squelch, true); }, 50);
            }
          }
          document.addEventListener("pointermove", mv);
          document.addEventListener("pointerup", up);
        });
      }
      var tabEls = [];
      function show(n) {
        while (pane.firstChild) pane.removeChild(pane.firstChild);
        cats[n].items.forEach(function (it) { pane.appendChild(cellNode(it, mode)); });
        if (mode === "carousel") pane.scrollLeft = 0;
        tabEls.forEach(function (t, i) {
          t.style.opacity = i === n ? "1" : "0.5";
          t.style.borderBottom = i === n ? "1px solid currentColor" : "1px solid transparent";
        });
      }
      cats.forEach(function (c, i) {
        var t = document.createElement("button");
        t.textContent = c.name;
        t.style.cssText = "background:none;border:0;border-bottom:1px solid transparent;color:inherit;font-family:inherit;font-size:0.78rem;letter-spacing:0.3em;text-transform:uppercase;cursor:pointer;padding:0.4rem 0.2rem;";
        t.addEventListener("click", function () { show(i); });
        bar.appendChild(t);
        tabEls.push(t);
      });
      host.appendChild(bar);
      host.appendChild(stage);
      show(0);
    }

    /* masonry for her 35 art pieces (titles as captions) */
    function mountMasonry(host) {
      var wrap = document.createElement("div");
      wrap.style.cssText = "column-count:3;column-gap:12px;";
      if (window.matchMedia("(max-width:900px)").matches) wrap.style.columnCount = "2";
      if (window.matchMedia("(max-width:560px)").matches) wrap.style.columnCount = "1";
      P.art.forEach(function (a) {
        var fig = document.createElement("figure");
        fig.style.cssText = "margin:0 0 12px;break-inside:avoid;cursor:zoom-in;";
        fig.setAttribute("data-hw-view", BASE + a.i);
        fig.innerHTML = "<img src='" + BASE + a.i + "' alt='" + (a.c || "Original artwork by Theresa Coggiola") + "' loading='lazy' style='width:100%;display:block;'>" +
          (a.c ? "<figcaption style='font-size:0.72rem;letter-spacing:0.22em;text-transform:uppercase;opacity:0.7;padding:0.5rem 0 0.2rem;'>" + a.c + "</figcaption>" : "");
        wrap.appendChild(fig);
      });
      host.appendChild(wrap);
    }

    document.querySelectorAll("[data-hw-portfolio]").forEach(mountPortfolio);
    document.querySelectorAll("[data-hw-masonry]").forEach(mountMasonry);
  })();

  /* Innerbloom — floating music invitation.
     Official YouTube embed (licensed; royalties reach the artist).
     Browsers block un-tapped audio, so it plays on first tap. */
  (function () {
    var YT_ID = "Tx9zMFodNtA"; // RUFUS DU SOL - Innerbloom (audio only, official embed)
    var wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;left:1.1rem;bottom:1.1rem;z-index:90;display:flex;gap:6px;align-items:center;";
    var frameHolder = document.createElement("div");
    frameHolder.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;opacity:0.01;pointer-events:none;";
    var iframe = null, playing = false, muted = false, volume = 60;
    function send(func, args) {
      if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args || [] }), "*");
    }
    function mkBtn(label, aria) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", aria);
      b.innerHTML = label;
      b.style.cssText = "background:#0d0d0d;color:#f5f5f3;border:1px solid #d4b077;letter-spacing:0.18em;font-size:0.6rem;text-transform:uppercase;padding:0.65rem 0.85rem;cursor:pointer;font-family:inherit;";
      return b;
    }
    var play = mkBtn("&#9835; PLAY INNERBLOOM", "Play Innerbloom by RUFUS DU SOL");
    var down = mkBtn("&#8722;", "Volume down");
    var up = mkBtn("+", "Volume up");
    var mute = mkBtn("MUTE", "Mute music");
    [down, up, mute].forEach(function (b) { b.style.display = "none"; });
    play.addEventListener("click", function () {
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube.com/embed/" + YT_ID + "?autoplay=1&enablejsapi=1&loop=1&playlist=" + YT_ID;
        iframe.title = "Innerbloom - RUFUS DU SOL (audio)";
        iframe.allow = "autoplay; encrypted-media";
        iframe.style.cssText = "width:200px;height:113px;border:0;";
        frameHolder.appendChild(iframe);
        playing = true;
        play.innerHTML = "&#10073;&#10073; PAUSE";
        [down, up, mute].forEach(function (b) { b.style.display = ""; });
        setTimeout(function () { send("setVolume", [volume]); }, 1200);
        return;
      }
      playing = !playing;
      send(playing ? "playVideo" : "pauseVideo");
      play.innerHTML = playing ? "&#10073;&#10073; PAUSE" : "&#9835; PLAY INNERBLOOM";
    });
    down.addEventListener("click", function () { volume = Math.max(0, volume - 10); send("setVolume", [volume]); });
    up.addEventListener("click", function () { volume = Math.min(100, volume + 10); if (muted) { muted = false; mute.innerHTML = "MUTE"; send("unMute"); } send("setVolume", [volume]); });
    mute.addEventListener("click", function () { muted = !muted; send(muted ? "mute" : "unMute"); mute.innerHTML = muted ? "UNMUTE" : "MUTE"; });
    wrap.appendChild(play); wrap.appendChild(down); wrap.appendChild(up); wrap.appendChild(mute);
    wrap.appendChild(frameHolder);
    document.body.appendChild(wrap);
  })();
})();
