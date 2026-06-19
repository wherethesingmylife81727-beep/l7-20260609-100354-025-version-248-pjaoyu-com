(function () {
  "use strict";

  var hlsLoaderPromise = null;
  var hlsCdnUrl = "https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function loadHlsLibrary() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsLoaderPromise) {
      return hlsLoaderPromise;
    }

    hlsLoaderPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = hlsCdnUrl;
      script.async = true;
      script.onload = function () {
        if (window.Hls) {
          resolve(window.Hls);
        } else {
          reject(new Error("hls.js 未成功加载"));
        }
      };
      script.onerror = function () {
        reject(new Error("无法加载 hls.js"));
      };
      document.head.appendChild(script);
    });

    return hlsLoaderPromise;
  }

  function initMobileMenu() {
    var button = $("[data-mobile-menu-button]");
    var panel = $("[data-mobile-panel]");

    if (!button || !panel) {
      return;
    }

    button.addEventListener("click", function () {
      panel.classList.toggle("open");
      button.classList.toggle("open");
    });
  }

  function initHeroCarousel() {
    var carousel = $("[data-hero-carousel]");

    if (!carousel) {
      return;
    }

    var slides = $all("[data-hero-slide]", carousel);
    var dots = $all("[data-hero-dot]", carousel);
    var previous = $("[data-hero-prev]", carousel);
    var next = $("[data-hero-next]", carousel);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (previous) {
      previous.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    $all("[data-filter-scope]").forEach(function (scope) {
      var searchInput = $("[data-search-input]", scope);
      var buttons = $all("[data-filter-button]", scope);
      var cards = $all(".movie-card", scope);
      var result = $("[data-filter-result]", scope);
      var state = {
        field: "all",
        value: "all",
        query: ""
      };

      if (scope.hasAttribute("data-search-page")) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        state.query = normalize(query);
        if (searchInput) {
          searchInput.value = query;
        }
      }

      function matchesFilter(card) {
        if (state.field === "all" || state.value === "all") {
          return true;
        }

        var value = normalize(card.getAttribute("data-" + state.field));
        return value.indexOf(normalize(state.value)) !== -1;
      }

      function matchesQuery(card) {
        if (!state.query) {
          return true;
        }

        var text = normalize(card.getAttribute("data-text"));
        return text.indexOf(state.query) !== -1;
      }

      function apply() {
        var visible = 0;
        cards.forEach(function (card) {
          var ok = matchesFilter(card) && matchesQuery(card);
          card.classList.toggle("is-hidden", !ok);
          if (ok) {
            visible += 1;
          }
        });

        if (result) {
          var suffix = state.query ? "，关键词：“" + state.query + "”" : "";
          result.textContent = "正在显示 " + visible + " / " + cards.length + " 部影片" + suffix;
        }
      }

      if (searchInput) {
        searchInput.addEventListener("input", function () {
          state.query = normalize(searchInput.value);
          apply();
        });
      }

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          buttons.forEach(function (item) {
            if (item.getAttribute("data-filter-field") === button.getAttribute("data-filter-field") || button.getAttribute("data-filter-field") === "all") {
              item.classList.remove("active");
            }
          });
          button.classList.add("active");
          state.field = button.getAttribute("data-filter-field") || "all";
          state.value = button.getAttribute("data-filter-value") || "all";
          apply();
        });
      });

      apply();
    });
  }

  function setMessage(shell, message) {
    var messageNode = $("[data-player-message]", shell);
    if (messageNode) {
      messageNode.textContent = message;
    }
  }

  function playShell(shell) {
    var video = $("video", shell);
    var url = shell.getAttribute("data-video-url");

    if (!video || !url) {
      setMessage(shell, "未找到播放源");
      return;
    }

    shell.classList.add("is-loading");
    setMessage(shell, "正在加载播放源...");

    function startVideo() {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          setMessage(shell, "播放源已载入，请再次点击视频播放");
        });
      }
      shell.classList.add("is-playing");
      shell.classList.remove("is-loading");
      setMessage(shell, "正在播放");
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      if (video.src !== url) {
        video.src = url;
      }
      startVideo();
      return;
    }

    loadHlsLibrary()
      .then(function (Hls) {
        if (!Hls.isSupported()) {
          video.src = url;
          startVideo();
          return;
        }

        if (shell._hlsInstance) {
          shell._hlsInstance.destroy();
        }

        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        shell._hlsInstance = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, startVideo);
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage(shell, "播放源加载失败，请刷新或更换浏览器重试");
          }
        });
      })
      .catch(function () {
        video.src = url;
        startVideo();
      });
  }

  function initPlayers() {
    $all("[data-player]").forEach(function (shell) {
      var button = $("[data-player-button]", shell);
      var video = $("video", shell);

      if (button) {
        button.addEventListener("click", function () {
          playShell(shell);
        });
      }

      if (video) {
        video.addEventListener("click", function () {
          if (!shell.classList.contains("is-playing")) {
            playShell(shell);
          }
        });
      }
    });

    $all("[data-play-target]").forEach(function (button) {
      button.addEventListener("click", function () {
        var targetId = button.getAttribute("data-play-target");
        var target = document.getElementById(targetId);
        var shell = target ? $("[data-player]", target) : null;
        if (shell) {
          window.setTimeout(function () {
            playShell(shell);
          }, 350);
        }
      });
    });
  }

  function initImageFallbacks() {
    $all("img").forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("is-missing");
      }, { once: true });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initHeroCarousel();
    initFilters();
    initPlayers();
    initImageFallbacks();
  });
})();
