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
  })();
})();

/* 8. Accolade band — Rated Nº 2 top-rated hair salon (Google Reviews, 2025).
   Inserted after MEET THERESA, styled to her Alegreya SC / black theme. */
(function () {
  var meet = document.getElementById("section-5bfeb3e13615b");
  if (!meet || document.getElementById("hw-accolade")) return;

  var css = document.createElement("style");
  css.textContent =
    "#hw-accolade{background:#000;color:#e9e1cf;text-align:center;padding:88px 20px;}" +
    "#hw-accolade,#hw-accolade *{font-family:'Alegreya SC',Georgia,serif;}" +
    "#hw-accolade .hw-medal{width:min(230px,62vw);margin:0 auto 34px;color:#e9e1cf;}" +
    "#hw-accolade .hw-medal svg{width:100%;height:auto;display:block;overflow:visible;animation:hwGlowC 7s ease-in-out infinite;}" +
    "#hw-accolade .hw-medal text{fill:currentColor;}" +
    "#hw-accolade .medal-dash{animation:hwDashC 60s linear infinite;}" +
    "@keyframes hwGlowC{0%,100%{filter:drop-shadow(0 0 8px rgba(233,225,207,.12));}50%{filter:drop-shadow(0 0 20px rgba(233,225,207,.32));}}" +
    "@keyframes hwDashC{to{stroke-dashoffset:-640;}}" +
    "#hw-accolade h2{font-size:34px;letter-spacing:.14em;margin:0 0 10px;color:#fff;font-weight:400;text-transform:uppercase;}" +
    "#hw-accolade .hw-acc-sub{font-size:15px;letter-spacing:.28em;text-transform:uppercase;color:#cfc6ae;margin:0 0 6px;}" +
    "#hw-accolade .hw-acc-src{font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:#8f887a;margin:0;}" +
    "#hw-accolade .hw-acc-div{width:72px;height:1px;background:#3a372f;margin:26px auto 0;}" +
    "@media (prefers-reduced-motion:reduce){#hw-accolade .hw-medal svg,#hw-accolade .medal-dash{animation:none;}}";
  document.head.appendChild(css);

  var svg = [
    '<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rated number 2 top-rated hair salon, Asheville, Google Reviews 2025">',
    '<defs>',
    '<path id="hwArcTopC" d="M 27 130 A 103 103 0 0 1 233 130" fill="none"/>',
    '<path id="hwArcBotC" d="M 32 130 A 98 98 0 0 0 228 130" fill="none"/>',
    '<g id="hwLaurelC" fill="none" stroke="currentColor" stroke-width="1.2">',
    '<path d="M 78 188 Q 46 164 40 120"/>',
    '<path fill="currentColor" stroke="none" d="M0 0 Q5 -7 0 -16 Q-5 -7 0 0" transform="translate(72,182) rotate(-128)"/>',
    '<path fill="currentColor" stroke="none" d="M0 0 Q5 -7 0 -16 Q-5 -7 0 0" transform="translate(60,172) rotate(-115)"/>',
    '<path fill="currentColor" stroke="none" d="M0 0 Q5 -7 0 -16 Q-5 -7 0 0" transform="translate(50,159) rotate(-100)"/>',
    '<path fill="currentColor" stroke="none" d="M0 0 Q5 -7 0 -16 Q-5 -7 0 0" transform="translate(44,145) rotate(-86)"/>',
    '<path fill="currentColor" stroke="none" d="M0 0 Q5 -7 0 -16 Q-5 -7 0 0" transform="translate(41,131) rotate(-72)"/>',
    '</g>',
    '</defs>',
    '<circle cx="130" cy="130" r="122" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/>',
    '<circle class="medal-dash" cx="130" cy="130" r="114" fill="none" stroke="currentColor" stroke-width=".75" stroke-dasharray="2 6" opacity=".5"/>',
    '<circle cx="130" cy="130" r="88" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    '<text font-size="11" letter-spacing="2.6"><textPath href="#hwArcTopC" startOffset="50%" text-anchor="middle">TOP-RATED HAIR SALON</textPath></text>',
    '<text font-size="9.5" letter-spacing="2.2"><textPath href="#hwArcBotC" startOffset="50%" text-anchor="middle">ASHEVILLE · NORTH CAROLINA</textPath></text>',
    '<text x="130" y="96" font-size="11" letter-spacing="4.5" text-anchor="middle">RATED</text>',
    '<text x="130" y="155" font-size="52" letter-spacing="2" text-anchor="middle">Nº 2</text>',
    '<text x="130" y="176" font-size="11" letter-spacing="3" text-anchor="middle">★ ★ ★ ★ ★</text>',
    '<text x="130" y="194" font-size="8.5" letter-spacing="1.8" text-anchor="middle">GOOGLE REVIEWS · 2025</text>',
    '<use href="#hwLaurelC"/>',
    '<use href="#hwLaurelC" transform="translate(260 0) scale(-1 1)"/>',
    '</svg>'
  ].join("");

  var band = document.createElement("section");
  band.id = "hw-accolade";
  band.innerHTML =
    '<div class="hw-medal" aria-hidden="true">' + svg + "</div>" +
    "<h2>Rated Nº 2</h2>" +
    '<p class="hw-acc-sub">Top-Rated Hair Salon — Asheville, North Carolina</p>' +
    '<p class="hw-acc-src">As ranked by Google Reviews · 2025</p>' +
    '<div class="hw-acc-div"></div>';
  meet.insertAdjacentElement("afterend", band);
})();
