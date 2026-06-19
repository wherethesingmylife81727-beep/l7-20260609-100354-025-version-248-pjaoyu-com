(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      document.body.classList.toggle("menu-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (slides.length === 0) {
      return;
    }
    var active = 0;
    var timer = null;
    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === active);
      });
    }
    function start() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5600);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initLocalFilter() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-local-filter]"));
    if (inputs.length === 0) {
      return;
    }
    inputs.forEach(function (input) {
      var targetSelector = input.getAttribute("data-local-filter");
      var target = document.querySelector(targetSelector);
      var empty = document.querySelector(input.getAttribute("data-empty-target") || "");
      if (!target) {
        return;
      }
      var cards = Array.prototype.slice.call(target.querySelectorAll("[data-search-text]"));
      function apply() {
        var keyword = normalize(input.value);
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute("data-search-text"));
          var match = keyword === "" || haystack.indexOf(keyword) !== -1;
          card.style.display = match ? "" : "none";
          if (match) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }
      input.addEventListener("input", apply);
      apply();
    });
  }

  function initSearchPage() {
    var input = document.querySelector("[data-search-page-input]");
    if (!input) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    input.value = query;
    input.dispatchEvent(new Event("input"));
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector(".play-overlay");
      var source = player.getAttribute("data-src");
      var hlsInstance = null;
      if (!video || !button || !source) {
        return;
      }
      function attachSource() {
        if (video.getAttribute("data-ready") === "true") {
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }
        video.setAttribute("data-ready", "true");
      }
      function play() {
        attachSource();
        video.controls = true;
        button.classList.add("is-hidden");
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            button.classList.remove("is-hidden");
          });
        }
      }
      button.addEventListener("click", play);
      video.addEventListener("click", function () {
        if (video.getAttribute("data-ready") !== "true") {
          play();
        }
      });
      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initLocalFilter();
    initSearchPage();
    initPlayers();
  });
})();
