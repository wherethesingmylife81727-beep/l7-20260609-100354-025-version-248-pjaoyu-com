function ready(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

function setSearchForms() {
  document.querySelectorAll('[data-search-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var value = input ? input.value.trim() : '';
      if (value) {
        window.location.href = './search.html?q=' + encodeURIComponent(value);
      }
    });
  });
}

function setMobileMenu() {
  var toggle = document.querySelector('[data-mobile-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) {
    return;
  }
  toggle.addEventListener('click', function () {
    menu.classList.toggle('is-open');
  });
}

function setHero() {
  var hero = document.querySelector('[data-hero]');
  if (!hero) {
    return;
  }
  var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
  var prev = hero.querySelector('[data-hero-prev]');
  var next = hero.querySelector('[data-hero-next]');
  var current = 0;
  var timer = null;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  if (prev) {
    prev.addEventListener('click', function () {
      show(current - 1);
      start();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      show(current + 1);
      start();
    });
  }

  dots.forEach(function (dot, dotIndex) {
    dot.addEventListener('click', function () {
      show(dotIndex);
      start();
    });
  });

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);
  show(0);
  start();
}

function setCardFilter() {
  var input = document.querySelector('[data-card-filter]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card-item]'));
  if (!input || cards.length === 0) {
    return;
  }
  input.addEventListener('input', function () {
    var value = input.value.trim().toLowerCase();
    cards.forEach(function (card) {
      var text = card.getAttribute('data-card-item').toLowerCase();
      card.style.display = text.indexOf(value) >= 0 ? '' : 'none';
    });
  });
}

function setupMoviePlayer(url) {
  ready(function () {
    var video = document.querySelector('[data-role="movie-player"]');
    var starter = document.querySelector('[data-role="play-start"]');
    if (!video || !url) {
      return;
    }
    var hlsPlayer = null;

    function bind() {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsPlayer = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsPlayer.loadSource(url);
        hlsPlayer.attachMedia(video);
        return;
      }
      video.src = url;
    }

    function start() {
      if (starter) {
        starter.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          video.controls = true;
        });
      }
    }

    bind();

    if (starter) {
      starter.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hlsPlayer) {
        hlsPlayer.destroy();
      }
    });
  });
}

function renderSearchPage() {
  var container = document.querySelector('[data-search-results]');
  if (!container || !window.__MOVIES__) {
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var queryInput = document.querySelector('[data-search-query]');
  var typeSelect = document.querySelector('[data-search-type]');
  var yearSelect = document.querySelector('[data-search-year]');
  var empty = document.querySelector('[data-search-empty]');
  var initialQuery = params.get('q') || '';
  if (queryInput) {
    queryInput.value = initialQuery;
  }

  function match(movie, query, type, year) {
    var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine].join(' ').toLowerCase();
    var okQuery = !query || text.indexOf(query.toLowerCase()) >= 0;
    var okType = !type || movie.type.indexOf(type) >= 0;
    var okYear = !year || movie.year === year;
    return okQuery && okType && okYear;
  }

  function card(movie) {
    return '' +
      '<article class="movie-card">' +
        '<a class="poster-link" href="' + movie.url + '">' +
          '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
          '<span class="poster-overlay">▶</span>' +
        '</a>' +
        '<div class="card-body">' +
          '<a class="card-title line-clamp-1" href="' + movie.url + '">' + escapeHtml(movie.title) + '</a>' +
          '<p class="card-desc line-clamp-2">' + escapeHtml(movie.oneLine) + '</p>' +
          '<div class="card-meta">' +
            '<span class="cyan">' + escapeHtml(movie.year) + '</span>' +
            '<span class="pink">' + escapeHtml(movie.type) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render() {
    var query = queryInput ? queryInput.value.trim() : '';
    var type = typeSelect ? typeSelect.value : '';
    var year = yearSelect ? yearSelect.value : '';
    var results = window.__MOVIES__.filter(function (movie) {
      return match(movie, query, type, year);
    }).slice(0, 240);
    container.innerHTML = results.map(card).join('');
    if (empty) {
      empty.style.display = results.length ? 'none' : 'block';
    }
  }

  [queryInput, typeSelect, yearSelect].forEach(function (control) {
    if (control) {
      control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', render);
    }
  });
  render();
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function (char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });
}

ready(function () {
  setSearchForms();
  setMobileMenu();
  setHero();
  setCardFilter();
  renderSearchPage();
});
