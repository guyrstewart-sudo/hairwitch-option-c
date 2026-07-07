/* Replica shim — restores the behaviors site123's JS provided,
   with zero external dependencies. */
(function () {
  "use strict";

  /* 1. Hero / any parallax background (jarallax stand-in) */
  document.querySelectorAll(".parallax-window[data-image-src]").forEach(function (el) {
    var src = el.getAttribute("data-image-src");
    var op = parseFloat(el.getAttribute("data-opacity") || "1");
    var bgc = el.getAttribute("data-backgroundcolor") || "#000000";
    var pos = el.getAttribute("data-background-position") || el.getAttribute("data-position") || "center center";
    var shade = 1 - op;
    el.style.backgroundImage = "linear-gradient(rgba(0,0,0," + shade + "), rgba(0,0,0," + shade + ")), url('" + src + "')";
    el.style.backgroundColor = bgc;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = pos;
    el.style.backgroundRepeat = "no-repeat";
    if (window.matchMedia("(min-width: 800px)").matches) {
      el.style.backgroundAttachment = "fixed"; /* the parallax feel */
    }
  });

  /* 2. Galleries: their Flickity/Isotope JS is gone, and its frozen inline
        geometry (absolute cells, transforms, fixed viewport heights) cannot
        be trusted. Normalize EVERY gallery into a clean uniform grid:
        display:contents collapses the flickity wrapper boxes so the cells
        become direct grid items — all images visible, zero overlap. */
  var style = document.createElement("style");
  style.textContent =
    /* Album carousels stay hidden by default (matching the live site's
       inline display:none) and open inside the .hw-album overlay as a
       native horizontal snap-scroll band. */
    ".hw-album{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.96);display:flex;flex-direction:column;justify-content:center;padding:2rem 1rem;}" +
    ".hw-album h4{color:#fff;font-family:'Alegreya SC',serif;text-align:center;letter-spacing:0.14em;text-transform:uppercase;font-weight:400;margin:0 0 1.2rem;font-size:1.15rem;}" +
    ".hw-album .hw-close{position:absolute;top:1rem;right:1.4rem;background:none;border:0;color:#fff;font-size:2rem;cursor:pointer;line-height:1;font-family:serif;}" +
    ".hw-album .hw-band{display:flex;overflow-x:auto;overflow-y:hidden;gap:10px;height:min(70vh,560px);scroll-snap-type:x proximity;scroll-behavior:smooth;scrollbar-width:thin;}" +
    ".hw-album .gallery-images-container{display:contents!important;}" +
    ".hw-album .flickity-viewport,.hw-album .flickity-slider{display:contents!important;}" +
    ".hw-album .gallery-image-container{position:static!important;left:auto!important;top:auto!important;flex:0 0 auto;width:auto!important;height:100%!important;margin:0!important;overflow:hidden;display:block!important;scroll-snap-align:start;}" +
    ".hw-album .gallery-image-container img{width:auto!important;height:100%!important;object-fit:contain;display:block;position:static!important;}" +
    ".hw-album .hw-nav{display:flex;justify-content:center;gap:1rem;margin-top:1.2rem;}" +
    ".hw-album .hw-nav button{background:none;border:1px solid #777;color:#fff;font-size:1.2rem;padding:0.4rem 1.4rem;cursor:pointer;}" +
    ".flickity-page-dots,.flickity-prev-next-button{display:none!important;}" +
    /* the active category's cells are MOVED into a freshly built scroller —
       the frozen flickity DOM cannot be made scrollable */
    ".hw-stage-band{position:relative;width:100%;margin:10px 0 0;}" +
    ".hw-scroller{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;height:400px;width:100%;scrollbar-width:thin;touch-action:pan-x;}" +
    ".hw-scroller .gallery-image-container{position:static!important;left:auto!important;top:auto!important;flex:0 0 auto;width:300px!important;height:400px!important;margin:0!important;overflow:hidden;display:block!important;}" +
    ".hw-scroller .gallery-image-container img{width:100%!important;height:100%!important;object-fit:cover;display:block;position:static!important;}" +
    ".hw-scroller .gallery-video-container{position:relative;}" +
    /* masonry galleries (VISUAL ART): frozen isotope coordinates -> CSS columns */
    ".shim-masonry{position:static!important;height:auto!important;column-count:3;column-gap:12px;display:block!important;}" +
    "@media (max-width:900px){.shim-masonry{column-count:2;}}" +
    "@media (max-width:560px){.shim-masonry{column-count:1;}}" +
    ".shim-masonry .gallery-item-wrapper{position:static!important;left:auto!important;top:auto!important;width:100%!important;height:auto!important;margin:0 0 12px!important;display:inline-block;break-inside:avoid;}" +
    ".shim-masonry .gallery-item-wrapper img{width:100%!important;height:auto!important;display:block;position:static!important;}" +
    /* site123's auto-generated overflow menu item (JS-managed on live) */
    ".extra-nav-more,[class*='extra-nav-more']{display:none!important;}" +
    /* scroll-reveal wrappers frozen at opacity:0 in the DOM snapshot */
    ".container-content,[class*='container-content']{opacity:1!important;transform:none!important;}" +
    ".animated,[data-animation]{opacity:1!important;transform:none!important;}" +
    ".page_header_style{opacity:1!important;transform:none!important;}";
  document.head.appendChild(style);
  /* tag masonry-style isotope galleries (no flickity carousel inside) */
  document.querySelectorAll(".isotope-gallery-container").forEach(function (el) {
    if (el.querySelector(".gallery-item-wrapper") && !el.querySelector(".gallery-images-container")) {
      el.classList.add("shim-masonry");
    }
  });

  /* 2b. Lightbox viewer — images AND videos (the live site's magnific
         popup equivalent). Click any gallery cell to open. */
  function openViewer(src, isVideo) {
    var overlay = document.createElement("div");
    overlay.className = "hw-album";
    overlay.innerHTML = "<button class='hw-close' aria-label='Close'>&times;</button>" +
      "<div class='hw-stage'>" +
      (isVideo
        ? "<video src='" + src + "' controls autoplay playsinline style='max-width:92vw;max-height:82vh;outline:none;'></video>"
        : "<img src='" + src + "' alt='' style='max-width:92vw;max-height:82vh;display:block;'>") +
      "</div>";
    overlay.querySelector(".hw-stage").style.cssText = "display:flex;align-items:center;justify-content:center;";
    function close() {
      var v = overlay.querySelector("video"); if (v) v.pause();
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    overlay.querySelector(".hw-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay || e.target.classList.contains("hw-stage")) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
  }
  document.addEventListener("click", function (e) {
    var cell = e.target.closest("[data-mfp-src]");
    if (!cell) return;
    var src = cell.getAttribute("data-mfp-src");
    if (!src) return;
    e.preventDefault();
    var isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src) || cell.getAttribute("data-type") === "video" || cell.classList.contains("gallery-video-container");
    openViewer(src, isVideo);
  });

  /* 2b-ii. Visible prev/next arrows + mouse drag for the carousel band */
  var arrowsWrap = null;
  function activeBand() { return document.querySelector(".hw-stage-band .hw-scroller"); }
  function mkArrow(dir) {
    var b = document.createElement("button");
    b.innerHTML = dir < 0 ? "&#8249;" : "&#8250;";
    b.setAttribute("aria-label", dir < 0 ? "Previous photos" : "Next photos");
    b.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);" + (dir < 0 ? "left:10px;" : "right:10px;") +
      "z-index:20;width:46px;height:46px;border-radius:50%;border:0;background:rgba(255,255,255,0.92);color:#111;font-size:1.9rem;line-height:1;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.5);";
    b.addEventListener("click", function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var band = activeBand();
      if (!band) return;
      /* instant, deterministic paging — smooth/rAF animations are
         unreliable in some embedded browsers */
      band.scrollLeft += dir * Math.round(band.clientWidth * 0.85);
    });
    return b;
  }
  function mountArrows() {
    var band = activeBand();
    if (!band) return;
    var host = band.closest(".hw-stage-band") || band.parentElement;
    if (!arrowsWrap) {
      arrowsWrap = document.createElement("div");
      arrowsWrap.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:15;";
      var prev = mkArrow(-1), next = mkArrow(1);
      prev.style.pointerEvents = "auto";
      next.style.pointerEvents = "auto";
      arrowsWrap.appendChild(prev);
      arrowsWrap.appendChild(next);
    }
    host.appendChild(arrowsWrap); /* follows the active band's wrapper */
  }
  /* drag-to-scroll with the mouse */
  document.addEventListener("pointerdown", function (e) {
    var band = e.target.closest(".hw-scroller");
    if (!band || e.pointerType !== "mouse") return;
    var startX = e.clientX, startScroll = band.scrollLeft, moved = false;
    function mv(ev) {
      var dx = ev.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      band.scrollLeft = startScroll - dx;
    }
    function up(ev) {
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
  /* Category filter tabs (COLOR & CUT / LIVE EVENTS / PHOTOSHOOTS) swap
     which cell-set fills the clean scroller — mirroring the live site. */
  var tabs = [].slice.call(document.querySelectorAll("ul.items-categories-container a"));
  var bands = [].slice.call(document.querySelectorAll(".isotope-gallery-container:not(.shim-masonry) .gallery-images-container"));
  var stage = null;
  function ensureStage() {
    if (stage) return stage;
    var catBar = document.querySelector(".s123-categories") ||
                 (tabs[0] && tabs[0].closest(".items-categories-container-wrapper"));
    if (!catBar) return null;
    stage = document.createElement("div");
    stage.className = "hw-stage-band";
    catBar.parentElement.insertBefore(stage, catBar.nextSibling);
    /* the frozen carousel wrappers are display-only ghosts now */
    document.querySelectorAll(".isotope-gallery-container:not(.shim-masonry)").forEach(function (w) {
      w.style.display = "none";
    });
    return stage;
  }
  function scrollerFor(band) {
    if (!band._hwScroller) {
      var sc = document.createElement("div");
      sc.className = "hw-scroller";
      [].slice.call(band.querySelectorAll(".gallery-image-container")).forEach(function (cell) {
        sc.appendChild(cell);
      });
      band._hwScroller = sc;
    }
    return band._hwScroller;
  }
  function showBand(n) {
    var st = ensureStage();
    if (!st || !bands[n]) return;
    while (st.firstChild) st.removeChild(st.firstChild);
    st.appendChild(scrollerFor(bands[n]));
    tabs.forEach(function (t, i) {
      if (t.parentElement) t.parentElement.classList.toggle("active", i === n);
    });
    mountArrows();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function (e) { e.preventDefault(); showBand(i); });
  });
  if (bands.length) showBand(0);

  /* 2c. Flickity lazy cells never got their src on the live capture —
         all files are local, so load them all now. */
  document.querySelectorAll("img[data-flickity-lazyload]").forEach(function (i) {
    if (!i.getAttribute("src")) i.src = i.getAttribute("data-flickity-lazyload");
  });
  /* lazysizes-pattern images (class="lazyload" data-src=...) */
  document.querySelectorAll("img[data-src]").forEach(function (i) {
    if (!i.getAttribute("src")) i.src = i.getAttribute("data-src");
  });

  /* 3. Lightbox-less image links: keep them from navigating to raw files */
  document.querySelectorAll('a[href$=".jpg"], a[href$=".png"], a[href$=".jpeg"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var w = window.open(a.getAttribute("href"), "_blank", "noopener");
      if (w) w.opener = null;
    });
  });

  /* 4. Mobile menu toggle */
  var mob = document.getElementById("top-menu-mobile");
  var btn = document.querySelector('[class*="menuMobile"], [id*="mobileMenuBtn"], .navbar-toggle, [class*="hamburger"], [id*="menuBtn"]');
  function ensureBtn() {
    if (btn || !mob) return;
    var header = document.querySelector("#stickyMenu, header, #top-menu");
    if (!header) return;
    btn = document.createElement("button");
    btn.textContent = "MENU";
    btn.setAttribute("aria-label", "Toggle menu");
    btn.style.cssText = "position:absolute;top:12px;right:14px;z-index:999;background:none;border:1px solid #555;color:#fff;font-family:'Alegreya SC',serif;letter-spacing:0.1em;padding:6px 12px;display:none;cursor:pointer;";
    document.body.appendChild(btn);
    var mq = window.matchMedia("(max-width: 900px)");
    var sync = function () { btn.style.display = mq.matches ? "block" : "none"; };
    mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync);
    sync();
  }
  ensureBtn();
  if (btn && mob) {
    btn.addEventListener("click", function () {
      mob.style.display = (mob.style.display === "none" || !mob.style.display) ? "block" : "none";
    });
  }

  /* 5. Contact form -> configured endpoint or email fallback */
  var cfg = window.HW_CONFIG || {};
  document.querySelectorAll("form").forEach(function (form) {
    if (form.querySelector('input[type="email"], input[name*="mail" i]') || form.querySelector("textarea")) {
      if (cfg.formEndpoint) { form.action = cfg.formEndpoint; form.method = "POST"; return; }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = new FormData(form), body = [];
        data.forEach(function (v, k) { body.push(k + ": " + v); });
        window.location.href = "mailto:thehairwitch12@gmail.com?subject=" +
          encodeURIComponent("Message from the website") + "&body=" + encodeURIComponent(body.join("\n"));
      });
    }
  });

  /* 6. Innerbloom — floating audio player (official embed, tap to play) */
  (function () {
    var YT_ID = "Tx9zMFodNtA";
    var wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;left:1.1rem;bottom:1.1rem;z-index:9999;display:flex;gap:6px;align-items:center;";
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
      b.style.cssText = "background:#0d0d0d;color:#fff;border:1px solid #c8a55e;letter-spacing:0.12em;font-size:0.62rem;text-transform:uppercase;padding:0.6rem 0.8rem;cursor:pointer;font-family:'Alegreya SC',serif;";
      return b;
    }
    var play = mkBtn("&#9835; Play Innerbloom", "Play Innerbloom by RUFUS DU SOL");
    var down = mkBtn("&#8722;", "Volume down");
    var up = mkBtn("+", "Volume up");
    var mute = mkBtn("Mute", "Mute music");
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
        play.innerHTML = "&#10073;&#10073; Pause";
        [down, up, mute].forEach(function (b) { b.style.display = ""; });
        setTimeout(function () { send("setVolume", [volume]); }, 1200);
        return;
      }
      playing = !playing;
      send(playing ? "playVideo" : "pauseVideo");
      play.innerHTML = playing ? "&#10073;&#10073; Pause" : "&#9835; Play Innerbloom";
    });
    down.addEventListener("click", function () { volume = Math.max(0, volume - 10); send("setVolume", [volume]); });
    up.addEventListener("click", function () { volume = Math.min(100, volume + 10); if (muted) { muted = false; mute.innerHTML = "Mute"; send("unMute"); } send("setVolume", [volume]); });
    mute.addEventListener("click", function () { muted = !muted; send(muted ? "mute" : "unMute"); mute.innerHTML = muted ? "Unmute" : "Mute"; });
    wrap.appendChild(play); wrap.appendChild(down); wrap.appendChild(up); wrap.appendChild(mute);
    wrap.appendChild(frameHolder);
    document.body.appendChild(wrap);

    /* Auto-start on the first tap/click/keypress anywhere — real autoplay
       with sound is blocked by Chrome/Safari until a user gesture. */
    function hwAutoPlay() {
      ["pointerdown", "keydown", "touchend"].forEach(function (ev) {
        document.removeEventListener(ev, hwAutoPlay, true);
      });
      if (!playing) play.click();
    }
    ["pointerdown", "keydown", "touchend"].forEach(function (ev) {
      document.addEventListener(ev, hwAutoPlay, true);
    });
  })();
})();

/* 8. Award hero — the "№ 2" gold medallion hero, replacing the original
   slideshow hero. Approved by Guy & Theresa 2026-07-07. The standalone
   concept is preserved at /award-concept.html */
(function () {
  var top = document.getElementById("top-section");
  if (!top || document.getElementById("hw-award-hero")) return;

  var fonts = document.createElement("link");
  fonts.rel = "stylesheet";
  fonts.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,600&family=Jost:wght@300;400;500&display=swap";
  document.head.appendChild(fonts);

  var css = document.createElement("style");
  css.textContent =
    "body{background:#000!important;}" +
    ".all-magic-buttons{display:none!important;}" +
    "#jarallax-container-0,.jarallax-container{display:none!important;}" +
    "#s123ModulesContainer, #s123ModulesContainer :is(p,li,span,em,strong,td,label,blockquote){color:#e7d9b8!important;}" +
    "#s123ModulesContainer :is(h1,h2,h3,h4,h5,.page_header_style){color:#cfa85e!important;}" +
    "#s123ModulesContainer a{color:#e9cf9a!important;}" +
    "#mainNav a,#mainNav li,#mainNavMobile a,#mainNavMobile button,#mainNavMobile span{color:#cfa85e!important;}" +
    "#hw-award-hero{background:#000;padding:0 0 6px;}" +
    "#hw-award-hero .hw-ah-canvas{position:relative;overflow:hidden;max-width:780px;margin:0 auto;}" +
    "#hw-award-hero .hw-ah-photo{display:block;width:100%;height:auto;}" +
    "#hw-award-hero .hw-ah-bg{display:none;}" +
    "#hw-award-hero .hw-ah-frame{position:absolute;inset:14px;border:1px solid rgba(207,168,94,.5);pointer-events:none;}" +
    "#hw-award-hero .hw-ah-frame:before,#hw-award-hero .hw-ah-frame:after{content:'';position:absolute;width:26px;height:26px;border:1px solid rgba(207,168,94,.85);}" +
    "#hw-award-hero .hw-ah-frame:before{top:-1px;left:-1px;border-right:0;border-bottom:0;}" +
    "#hw-award-hero .hw-ah-frame:after{bottom:-1px;right:-1px;border-left:0;border-top:0;}" +
    "#hw-award-hero .hw-ah-scrimtr{position:absolute;top:0;right:0;width:68%;height:64%;background:radial-gradient(120% 100% at 88% 0%,rgba(0,0,0,.85) 0%,rgba(0,0,0,.45) 48%,transparent 74%);pointer-events:none;}" +
    "#hw-award-hero .hw-ah-scrimb{position:absolute;left:0;right:0;bottom:0;height:26%;background:linear-gradient(to top,rgba(0,0,0,.72),transparent);pointer-events:none;}" +
    "#hw-award-hero .hw-ah-hang{position:absolute;top:0;right:8.5%;width:clamp(132px,30%,196px);transform-origin:50% 0;animation:hwAhSway 7s ease-in-out infinite alternate;z-index:4;}" +
    "@keyframes hwAhSway{from{transform:rotate(1.5deg);}to{transform:rotate(-1.5deg);}}" +
    "#hw-award-hero .hw-ah-thread{position:relative;height:clamp(70px,15vw,120px);}" +
    "#hw-award-hero .hw-ah-thread:before,#hw-award-hero .hw-ah-thread:after{content:'';position:absolute;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,rgba(246,231,184,.15),#cfa85e);}" +
    "#hw-award-hero .hw-ah-thread:before{left:calc(50% - 5px);transform:skewX(2.4deg);}" +
    "#hw-award-hero .hw-ah-thread:after{left:calc(50% + 5px);transform:skewX(-2.4deg);}" +
    "#hw-award-hero .hw-ah-knot{position:relative;height:12px;}" +
    "#hw-award-hero .hw-ah-knot:before{content:'';position:absolute;left:50%;top:0;transform:translateX(-50%);width:11px;height:11px;border:1px solid #cfa85e;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f6e7b8,#8a6a33);}" +
    "#hw-award-hero .hw-ah-seal{position:relative;width:100%;aspect-ratio:1;perspective:900px;cursor:pointer;}" +
    "#hw-award-hero .hw-ah-inner{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .9s cubic-bezier(.2,.7,.2,1);}" +
    "#hw-award-hero .hw-ah-seal:hover .hw-ah-inner,#hw-award-hero .hw-ah-seal.flipped .hw-ah-inner{transform:rotateY(180deg);}" +
    "#hw-award-hero .hw-ah-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;}" +
    "#hw-award-hero .hw-ah-face.back{transform:rotateY(180deg);}" +
    "#hw-award-hero .hw-ah-face svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 10px 22px rgba(0,0,0,.65)) drop-shadow(0 0 14px rgba(207,168,94,.22));}" +
    "#hw-award-hero .hw-ah-plate{text-align:center;margin-top:12px;text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 2px 6px rgba(0,0,0,.95),0 0 18px rgba(0,0,0,.9);font-family:Jost,sans-serif;}" +
    "#hw-award-hero .hw-ah-plate .l1{font-size:10px;letter-spacing:.42em;color:#e7cf9a;}" +
    "#hw-award-hero .hw-ah-plate .l2{font-size:8.5px;letter-spacing:.34em;color:#e7cf9a;margin-top:4px;}" +
    "#hw-award-hero .hw-ah-cta{position:absolute;left:50%;bottom:7.5%;transform:translateX(-50%);z-index:3;background:#fff;color:#000;padding:16px 44px;font-size:13px;letter-spacing:.32em;text-decoration:none;text-transform:uppercase;font-weight:500;font-family:Jost,sans-serif;}" +
    "#hw-award-hero .hw-ah-cta:hover{background:#f6e7b8;}" +
    "@media (min-width:900px){" +
      "html,body{overflow-x:hidden;}" +
      "#hw-award-hero{padding:0;width:100vw;margin-left:calc(50% - 50vw);}" +
      "#hw-award-hero .hw-ah-canvas{max-width:none;height:100vh;background:#000;}" +
      "#hw-award-hero .hw-ah-bg{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(18px) brightness(.38);transform:scale(1.1);}" +
      "#hw-award-hero .hw-ah-photo{position:absolute;left:7vw;top:50%;transform:translateY(-50%);height:92vh;width:auto;border:1px solid rgba(207,168,94,.6);box-shadow:0 30px 90px rgba(0,0,0,.85);}" +
      "#hw-award-hero .hw-ah-scrimtr,#hw-award-hero .hw-ah-scrimb{display:none;}" +
      "#hw-award-hero .hw-ah-hang{right:auto;left:calc(53.5vw + 30.7vh - min(13vw,190px));width:min(26vw,380px);}" +
      "#hw-award-hero .hw-ah-thread{height:20vh;}" +
      "#hw-award-hero .hw-ah-plate .l1{font-size:13px;}" +
      "#hw-award-hero .hw-ah-plate .l2{font-size:11px;}" +
      "#hw-award-hero .hw-ah-cta{left:calc(53.5vw + 30.7vh);transform:translateX(-50%);bottom:10%;}" +
    "}" +
    "@media (prefers-reduced-motion:reduce){#hw-award-hero .hw-ah-hang{animation:none;}#hw-award-hero .hw-ah-inner{transition:none;}}";
  document.head.appendChild(css);

  var svgFront = [
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
    '<defs>',
    '<linearGradient id="hwAhFoil" x1="0" y1="0" x2="1" y2="0">',
    '<stop offset="0" stop-color="#8a6a33"/><stop offset=".25" stop-color="#cfa85e"/>',
    '<stop offset=".5" stop-color="#f6e7b8"/><stop offset=".75" stop-color="#cfa85e"/>',
    '<stop offset="1" stop-color="#8a6a33"/>',
    '<animateTransform attributeName="gradientTransform" type="translate" values="-1 0; 1 0; -1 0" dur="8s" repeatCount="indefinite"/>',
    '</linearGradient>',
    '<radialGradient id="hwAhSheen" cx=".5" cy=".38" r=".75">',
    '<stop offset="0" stop-color="#141414"/><stop offset=".8" stop-color="#050505"/><stop offset="1" stop-color="#000"/>',
    '</radialGradient>',
    '<path id="hwAhArcT" d="M 22 100 A 78 78 0 0 1 178 100" fill="none"/>',
    '<path id="hwAhArcB" d="M 27 100 A 73 73 0 0 0 173 100" fill="none"/>',
    '</defs>',
    '<circle cx="100" cy="100" r="97" fill="url(#hwAhSheen)"/>',
    '<circle cx="100" cy="100" r="96" fill="none" stroke="url(#hwAhFoil)" stroke-width="1.6"/>',
    '<circle cx="100" cy="100" r="90" fill="none" stroke="#cfa85e" stroke-width=".5" opacity=".55" stroke-dasharray="1.5 4"/>',
    '<circle cx="100" cy="100" r="64" fill="none" stroke="#cfa85e" stroke-width=".8" opacity=".8"/>',
    '<text fill="#e7cf9a" font-family="Jost, sans-serif" font-size="9" letter-spacing="2.6"><textPath href="#hwAhArcT" startOffset="50%" text-anchor="middle">TOP-RATED HAIR SALON</textPath></text>',
    '<text fill="#e7cf9a" font-family="Jost, sans-serif" font-size="8" letter-spacing="2.4"><textPath href="#hwAhArcB" startOffset="50%" text-anchor="middle">ASHEVILLE · NORTH CAROLINA</textPath></text>',
    '<g fill="none" stroke-linecap="round" opacity=".85">',
    '<path d="M 48 128 C 66 140, 88 146, 116 138 C 142 130, 152 112, 148 96" stroke="url(#hwAhFoil)" stroke-width="1.6"/>',
    '<path d="M 52 134 C 72 146, 96 150, 122 141 C 144 133, 154 118, 151 104" stroke="#cfa85e" stroke-width="1" opacity=".6"/>',
    '<path d="M 46 122 C 62 133, 84 140, 110 134 C 134 128, 146 112, 144 98" stroke="#f6e7b8" stroke-width=".6" opacity=".5"/>',
    '</g>',
    '<text x="100" y="76" fill="#e7cf9a" font-family="Jost, sans-serif" font-size="9" letter-spacing="4.6" text-anchor="middle">RATED</text>',
    "<text x='100' y='118' fill='url(#hwAhFoil)' font-family=\"'Bodoni Moda', serif\" font-style='italic' font-weight='600' font-size='34' letter-spacing='2' text-anchor='middle'>TOP 2</text>",
    '<g stroke="#f6e7b8" stroke-width="1.1" fill="none" transform="translate(52,120) rotate(24)">',
    '<circle cx="-5.5" cy="9" r="3"/><circle cx="5.5" cy="9" r="3"/>',
    '<path d="M -3.8 6.4 L 4.6 -11"/><path d="M 3.8 6.4 L -4.6 -11"/>',
    '<circle cx="0" cy="0" r="1" fill="#f6e7b8" stroke="none"/>',
    '</g>',
    '<g fill="#f6e7b8">',
    '<path d="M0 -3.2 L.9 -.9 L3.2 0 L.9 .9 L0 3.2 L-.9 .9 L-3.2 0 L-.9 -.9 Z" transform="translate(56,131)"/>',
    '<path d="M0 -3.6 L1 -1 L3.6 0 L1 1 L0 3.6 L-1 1 L-3.6 0 L-1 -1 Z" transform="translate(79,141)"/>',
    '<path d="M0 -4 L1.1 -1.1 L4 0 L1.1 1.1 L0 4 L-1.1 1.1 L-4 0 L-1.1 -1.1 Z" transform="translate(103,142)"/>',
    '<path d="M0 -3.6 L1 -1 L3.6 0 L1 1 L0 3.6 L-1 1 L-3.6 0 L-1 -1 Z" transform="translate(128,133)"/>',
    '<path d="M0 -3.2 L.9 -.9 L3.2 0 L.9 .9 L0 3.2 L-.9 .9 L-3.2 0 L-.9 -.9 Z" transform="translate(146,110)"/>',
    '</g>',
    '</svg>'
  ].join("");

  var svgBack = [
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
    '<circle cx="100" cy="100" r="97" fill="#0a0a0a"/>',
    '<circle cx="100" cy="100" r="96" fill="none" stroke="#cfa85e" stroke-width="1.4"/>',
    '<circle cx="100" cy="100" r="88" fill="none" stroke="#cfa85e" stroke-width=".5" opacity=".5"/>',
    "<text x='100' y='84' fill='url(#hwAhFoil)' font-family=\"'Bodoni Moda', serif\" font-weight='700' font-size='38' letter-spacing='1' text-anchor='middle'>4.9</text>",
    '<text x="100" y="104" fill="#cfa85e" font-family="Jost, sans-serif" font-size="9" letter-spacing="3.2" text-anchor="middle">★ ★ ★ ★ ★</text>',
    '<text x="100" y="126" fill="#e7cf9a" font-family="Jost, sans-serif" font-size="8.5" letter-spacing="2.8" text-anchor="middle">GOOGLE REVIEWS</text>',
    '<text x="100" y="142" fill="#cfa85e" font-family="Jost, sans-serif" font-size="8" letter-spacing="3.4" text-anchor="middle">MMXXV</text>',
    '</svg>'
  ].join("");

  var bookUrl = (window.HW_CONFIG && window.HW_CONFIG.squareBookingUrl) ||
    "https://book.squareup.com/appointments/wnldzv2a05sx0o/location/LCA4TGQ6Z7CYZ";

  var hero = document.createElement("section");
  hero.id = "hw-award-hero";
  hero.innerHTML =
    '<div class="hw-ah-canvas">' +
      '<img class="hw-ah-bg" src="images/site123/s123-hero-main.png" alt="" aria-hidden="true">' +
      '<img class="hw-ah-photo" src="images/site123/s123-hero-main.png" alt="The Hair Witch — Asheville. Luxury color, hair extensions and high-end hair artistry.">' +
      '<div class="hw-ah-scrimtr"></div><div class="hw-ah-scrimb"></div><div class="hw-ah-frame"></div>' +
      '<div class="hw-ah-hang">' +
        '<div class="hw-ah-thread"></div><div class="hw-ah-knot"></div>' +
        '<div class="hw-ah-seal" role="button" tabindex="0" aria-label="Rated Top 2 hair salon, Asheville — Google Reviews 2025. Activate to see rating details.">' +
          '<div class="hw-ah-inner">' +
            '<div class="hw-ah-face front">' + svgFront + '</div>' +
            '<div class="hw-ah-face back">' + svgBack + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="hw-ah-plate"><div class="l1">GOOGLE REVIEWS</div><div class="l2">2025 · ASHEVILLE</div></div>' +
      '</div>' +
      '<a class="hw-ah-cta" href="' + bookUrl + '" target="_blank" rel="noopener">Book Now</a>' +
    '</div>';

  top.parentElement.insertBefore(hero, top);
  top.style.display = "none";

  var seal = hero.querySelector(".hw-ah-seal");
  function flip() { seal.classList.toggle("flipped"); }
  seal.addEventListener("click", flip);
  seal.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
  });
})();
