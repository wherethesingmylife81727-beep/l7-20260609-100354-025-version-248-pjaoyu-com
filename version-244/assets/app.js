(function () {
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
  const prev = document.querySelector('[data-hero-prev]');
  const next = document.querySelector('[data-hero-next]');
  let heroIndex = 0;
  let heroTimer = null;

  function showHero(index) {
    if (!slides.length) {
      return;
    }

    heroIndex = (index + slides.length) % slides.length;

    slides.forEach(function (slide, current) {
      slide.classList.toggle('active', current === heroIndex);
    });

    dots.forEach(function (dot, current) {
      dot.classList.toggle('active', current === heroIndex);
    });
  }

  function moveHero(step) {
    showHero(heroIndex + step);
  }

  function resetHeroTimer() {
    if (!slides.length) {
      return;
    }

    if (heroTimer) {
      window.clearInterval(heroTimer);
    }

    heroTimer = window.setInterval(function () {
      moveHero(1);
    }, 6400);
  }

  if (slides.length) {
    showHero(0);
    resetHeroTimer();
  }

  if (prev) {
    prev.addEventListener('click', function () {
      moveHero(-1);
      resetHeroTimer();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      moveHero(1);
      resetHeroTimer();
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showHero(index);
      resetHeroTimer();
    });
  });

  const searchInput = document.querySelector('[data-search-input]');
  const yearFilter = document.querySelector('[data-year-filter]');
  const filterButtons = Array.from(document.querySelectorAll('[data-kind-filter]'));
  const cards = Array.from(document.querySelectorAll('[data-movie-card]'));
  const emptyState = document.querySelector('[data-empty-state]');
  let activeKind = 'all';

  function yearMatches(cardYear, filterValue) {
    if (!filterValue || filterValue === 'all') {
      return true;
    }

    const year = Number(cardYear || 0);

    if (filterValue === 'old') {
      return year > 0 && year <= 2019;
    }

    return String(cardYear) === filterValue;
  }

  function applyFilters() {
    if (!cards.length) {
      return;
    }

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedYear = yearFilter ? yearFilter.value : 'all';
    let visibleCount = 0;

    cards.forEach(function (card) {
      const text = (card.getAttribute('data-text') || '').toLowerCase();
      const kind = card.getAttribute('data-kind') || '';
      const year = card.getAttribute('data-year') || '';
      const matchQuery = !query || text.indexOf(query) !== -1;
      const matchKind = activeKind === 'all' || kind === activeKind;
      const matchYear = yearMatches(year, selectedYear);
      const show = matchQuery && matchKind && matchYear;

      card.style.display = show ? '' : 'none';

      if (show) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('show', visibleCount === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (yearFilter) {
    yearFilter.addEventListener('change', applyFilters);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeKind = button.getAttribute('data-kind-filter') || 'all';
      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      applyFilters();
    });
  });
})();
