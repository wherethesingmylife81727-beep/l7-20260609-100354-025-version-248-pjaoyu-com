(function () {
  function bySelector(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenus() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function setupSearchForms() {
    bySelector('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="q"]');
        if (!input || !input.value.trim()) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        window.location.href = './search.html?q=' + encodeURIComponent(input.value.trim());
      });
    });
  }

  function setupHero() {
    var slides = bySelector('[data-hero-slide]');
    var dots = bySelector('[data-hero-dot]');
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        window.clearInterval(timer);
        show(i);
        start();
      });
    });

    show(0);
    start();
  }

  function setupLocalFilters() {
    bySelector('[data-filter-block]').forEach(function (block) {
      var input = block.querySelector('[data-local-search]');
      var year = block.querySelector('[data-filter-year]');
      var region = block.querySelector('[data-filter-region]');
      var type = block.querySelector('[data-filter-type]');
      var cards = bySelector('[data-card]', block);

      function apply() {
        var text = input ? input.value.trim().toLowerCase() : '';
        var yearValue = year ? year.value : '';
        var regionValue = region ? region.value : '';
        var typeValue = type ? type.value : '';
        cards.forEach(function (card) {
          var title = (card.getAttribute('data-title') || '').toLowerCase();
          var cardYear = card.getAttribute('data-year') || '';
          var cardRegion = card.getAttribute('data-region') || '';
          var cardType = card.getAttribute('data-type') || '';
          var matched = true;
          if (text && title.indexOf(text) === -1) {
            matched = false;
          }
          if (yearValue && cardYear !== yearValue) {
            matched = false;
          }
          if (regionValue && cardRegion !== regionValue) {
            matched = false;
          }
          if (typeValue && cardType !== typeValue) {
            matched = false;
          }
          card.classList.toggle('hidden-card', !matched);
        });
      }

      [input, year, region, type].forEach(function (element) {
        if (element) {
          element.addEventListener('input', apply);
          element.addEventListener('change', apply);
        }
      });
    });
  }

  function setupSearchPage() {
    var root = document.querySelector('[data-search-page]');
    if (!root || !window.SEARCH_INDEX) {
      return;
    }
    var input = root.querySelector('input[name="q"]');
    var results = root.querySelector('[data-search-results]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    if (input) {
      input.value = query;
    }

    function render(value) {
      var q = value.trim().toLowerCase();
      results.innerHTML = '';
      if (!q) {
        window.SEARCH_INDEX.slice(0, 24).forEach(addItem);
        return;
      }
      var found = window.SEARCH_INDEX.filter(function (movie) {
        var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine].join(' ').toLowerCase();
        return haystack.indexOf(q) !== -1;
      }).slice(0, 80);
      found.forEach(addItem);
    }

    function addItem(movie) {
      var link = document.createElement('a');
      link.className = 'search-result';
      link.href = './' + movie.file;
      link.innerHTML = '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '">' +
        '<span><strong>' + escapeHtml(movie.title) + '</strong><p>' + escapeHtml(movie.oneLine) + '</p>' +
        '<em class="filter-pill">' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + '</em></span>';
      results.appendChild(link);
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;'
        }[char];
      });
    }

    render(query);
    if (input) {
      input.addEventListener('input', function () {
        render(input.value);
      });
    }
  }

  function setupPlayers() {
    bySelector('[data-player]').forEach(function (box) {
      var video = box.querySelector('video');
      var cover = box.querySelector('[data-player-cover]');
      var button = box.querySelector('[data-play-button]');
      var streamUrl = box.getAttribute('data-stream-url');
      var attached = false;
      var hlsInstance = null;

      if (!video || !streamUrl) {
        return;
      }

      function attachStream() {
        if (attached) {
          return;
        }
        attached = true;
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        } else {
          video.src = streamUrl;
        }
      }

      function playVideo() {
        attachStream();
        if (cover) {
          cover.hidden = true;
        }
        video.controls = true;
        var playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(function () {
            if (cover) {
              cover.hidden = false;
            }
          });
        }
      }

      if (cover) {
        cover.addEventListener('click', playVideo);
      }
      if (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          playVideo();
        });
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenus();
    setupSearchForms();
    setupHero();
    setupLocalFilters();
    setupSearchPage();
    setupPlayers();
  });
})();
