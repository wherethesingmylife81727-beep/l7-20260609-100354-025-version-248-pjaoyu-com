(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      var parent = image.parentElement;
      if (parent) {
        parent.classList.add('image-empty');
      }
      image.style.display = 'none';
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    show(0);
    restart();
  });

  document.querySelectorAll('[data-tab-button]').forEach(function (button) {
    button.addEventListener('click', function () {
      var name = button.getAttribute('data-tab-button');
      var scope = button.closest('.content-section');
      if (!scope) {
        return;
      }
      scope.querySelectorAll('[data-tab-button]').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      scope.querySelectorAll('[data-tab-panel]').forEach(function (panel) {
        panel.classList.toggle('active', panel.getAttribute('data-tab-panel') === name);
      });
    });
  });

  document.querySelectorAll('[data-search-block]').forEach(function (block) {
    var input = block.querySelector('[data-search-input]');
    var year = block.querySelector('[data-year-filter]');
    var type = block.querySelector('[data-type-filter]');
    var categoryButtons = Array.prototype.slice.call(block.querySelectorAll('[data-category-filter]'));
    var activeCategory = 'all';
    var cards = Array.prototype.slice.call(block.querySelectorAll('.movie-card'));

    function apply() {
      var query = input ? input.value.trim().toLowerCase() : '';
      var yearValue = year ? year.value : 'all';
      var typeValue = type ? type.value : 'all';

      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-tags') || '',
          card.getAttribute('data-region') || '',
          card.getAttribute('data-type') || ''
        ].join(' ').toLowerCase();
        var matchQuery = !query || haystack.indexOf(query) !== -1;
        var matchYear = yearValue === 'all' || card.getAttribute('data-year') === yearValue;
        var matchType = typeValue === 'all' || (card.getAttribute('data-type') || '').indexOf(typeValue) !== -1;
        var matchCategory = activeCategory === 'all' || card.getAttribute('data-category') === activeCategory;
        card.classList.toggle('is-hidden-card', !(matchQuery && matchYear && matchType && matchCategory));
      });
    }

    if (input) {
      input.addEventListener('input', apply);
    }
    if (year) {
      year.addEventListener('change', apply);
    }
    if (type) {
      type.addEventListener('change', apply);
    }
    categoryButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeCategory = button.getAttribute('data-category-filter') || 'all';
        categoryButtons.forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
        apply();
      });
    });
    apply();
  });
}());

function initPlayer(url) {
  var video = document.querySelector('[data-player-video]');
  var overlay = document.querySelector('[data-player-overlay]');
  var hlsInstance = null;
  var hasStarted = false;

  if (!video || !overlay || !url) {
    return;
  }

  function attach() {
    if (hasStarted) {
      return;
    }
    hasStarted = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(video);
    } else {
      video.src = url;
    }

    video.controls = true;
    overlay.classList.add('is-hidden');
    var playTask = video.play();
    if (playTask && typeof playTask.catch === 'function') {
      playTask.catch(function () {
        overlay.classList.remove('is-hidden');
      });
    }
  }

  overlay.addEventListener('click', attach);
  video.addEventListener('click', function () {
    if (!hasStarted) {
      attach();
    }
  });
  window.addEventListener('pagehide', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
