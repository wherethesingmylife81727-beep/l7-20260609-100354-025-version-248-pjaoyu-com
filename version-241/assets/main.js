(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMenu() {
        var toggle = qs('[data-menu-toggle]');
        var panel = qs('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('open');
        });
    }

    function setupSearchForms() {
        qsa('[data-search-form]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = qs('input[name="q"]', form);
                var value = input ? input.value.trim() : '';
                if (!value) {
                    return;
                }
                var action = form.getAttribute('action') || 'search.html';
                window.location.href = action + '?q=' + encodeURIComponent(value);
            });
        });
    }

    function setupHero() {
        var slides = qsa('[data-hero-slide]');
        if (!slides.length) {
            return;
        }
        var dots = qsa('[data-hero-dot]');
        var prev = qs('[data-hero-prev]');
        var next = qs('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                start();
            });
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                start();
            });
        });

        show(0);
        start();
    }

    function setupFilters() {
        var panels = qsa('[data-filter-panel]');
        panels.forEach(function (panel) {
            var grid = qs('[data-grid]') || panel.parentElement.querySelector('[data-grid]');
            if (!grid) {
                return;
            }
            var cards = qsa('[data-card]', grid);
            var filterButtons = qsa('[data-filter]', panel);
            var sortButtons = qsa('[data-sort]', panel);
            var currentFilter = '全部';

            function applyFilter() {
                cards.forEach(function (card) {
                    var type = card.getAttribute('data-type') || '';
                    var region = card.getAttribute('data-region') || '';
                    var visible = currentFilter === '全部' || type.indexOf(currentFilter) !== -1 || region.indexOf(currentFilter) !== -1;
                    card.classList.toggle('hidden-by-filter', !visible);
                });
            }

            filterButtons.forEach(function (button, buttonIndex) {
                if (buttonIndex === 0) {
                    button.classList.add('active');
                }
                button.addEventListener('click', function () {
                    filterButtons.forEach(function (item) {
                        item.classList.remove('active');
                    });
                    button.classList.add('active');
                    currentFilter = button.getAttribute('data-filter') || '全部';
                    applyFilter();
                });
            });

            sortButtons.forEach(function (button, buttonIndex) {
                if (buttonIndex === 0) {
                    button.classList.add('active');
                }
                button.addEventListener('click', function () {
                    sortButtons.forEach(function (item) {
                        item.classList.remove('active');
                    });
                    button.classList.add('active');
                    var mode = button.getAttribute('data-sort');
                    var sorted = cards.slice().sort(function (a, b) {
                        if (mode === 'title') {
                            return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '', 'zh-CN');
                        }
                        return Number(b.getAttribute('data-year') || 0) - Number(a.getAttribute('data-year') || 0);
                    });
                    sorted.forEach(function (card) {
                        grid.appendChild(card);
                    });
                    applyFilter();
                });
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMenu();
        setupSearchForms();
        setupHero();
        setupFilters();
    });
}());
