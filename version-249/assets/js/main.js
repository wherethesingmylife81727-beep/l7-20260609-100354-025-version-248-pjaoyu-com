(function () {
  var body = document.body;
  var toggle = document.querySelector('.mobile-toggle');

  if (toggle) {
    toggle.addEventListener('click', function () {
      body.classList.toggle('nav-open');
    });
  }

  var hero = document.querySelector('[data-hero-carousel]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(next) {
      if (!slides.length) {
        return;
      }
      current = (next + slides.length) % slides.length;
      slides.forEach(function (slide, index) {
        slide.classList.toggle('active', index === current);
      });
      dots.forEach(function (dot, index) {
        dot.classList.toggle('active', index === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
      });
    });

    setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  var queryParams = new URLSearchParams(window.location.search);
  var initialQuery = queryParams.get('q') || '';
  var searchInput = document.querySelector('.js-search-input');
  var pageFilter = document.querySelector('.js-page-filter');
  var typeFilter = document.querySelector('.js-type-filter');
  var yearFilter = document.querySelector('.js-year-filter');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));

  if (searchInput && initialQuery) {
    searchInput.value = initialQuery;
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applyFilters() {
    var query = normalize(searchInput ? searchInput.value : pageFilter ? pageFilter.value : initialQuery);
    var type = normalize(typeFilter ? typeFilter.value : '');
    var year = normalize(yearFilter ? yearFilter.value : '');

    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search'));
      var cardType = normalize(card.getAttribute('data-type'));
      var cardYear = normalize(card.getAttribute('data-year'));
      var matchQuery = !query || text.indexOf(query) !== -1;
      var matchType = !type || cardType === type;
      var matchYear = !year || cardYear === year;
      card.classList.toggle('is-hidden', !(matchQuery && matchType && matchYear));
    });
  }

  [searchInput, pageFilter, typeFilter, yearFilter].forEach(function (control) {
    if (control) {
      control.addEventListener('input', applyFilters);
      control.addEventListener('change', applyFilters);
    }
  });

  if (cards.length) {
    applyFilters();
  }

  function initPlayer(box) {
    var video = box.querySelector('video');
    var trigger = box.querySelector('.player-poster');
    var stream = box.getAttribute('data-stream');
    var loaded = false;
    var hlsInstance = null;

    function loadStream() {
      if (!video || !stream || loaded) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        video.src = stream;
      }
      loaded = true;
    }

    function startPlayback() {
      loadStream();
      if (!video) {
        return;
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }

    if (trigger) {
      trigger.addEventListener('click', startPlayback);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          startPlayback();
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', function () {
        box.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (video.currentTime === 0) {
          box.classList.remove('is-playing');
        }
      });
      video.addEventListener('ended', function () {
        box.classList.remove('is-playing');
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('.movie-player[data-stream]')).forEach(initPlayer);
})();
