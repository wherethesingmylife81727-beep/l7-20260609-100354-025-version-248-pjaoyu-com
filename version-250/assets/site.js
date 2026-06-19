(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    ready(function () {
        setupMobileMenu();
        setupHero();
        setupFilters();
        setupSearchPage();
        setupPlayer();
    });

    function setupMobileMenu() {
        var button = document.querySelector("[data-mobile-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                show(dotIndex);
                play();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                play();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                play();
            });
        }

        show(0);
        play();
    }

    function setupFilters() {
        var panel = document.querySelector("[data-filter-panel]");
        if (!panel) {
            return;
        }
        var input = panel.querySelector("[data-filter-keyword]");
        var type = panel.querySelector("[data-filter-type]");
        var year = panel.querySelector("[data-filter-year]");
        var reset = panel.querySelector("[data-filter-reset]");
        var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card, .rank-card"));

        function normalize(value) {
            return (value || "").toString().toLowerCase().trim();
        }

        function apply() {
            var keyword = normalize(input && input.value);
            var typeValue = normalize(type && type.value);
            var yearValue = normalize(year && year.value);

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-type"),
                    card.getAttribute("data-genre")
                ].join(" ").toLowerCase();
                var matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var matchedType = !typeValue || normalize(card.getAttribute("data-type")).indexOf(typeValue) !== -1;
                var matchedYear = !yearValue || normalize(card.getAttribute("data-year")) === yearValue;
                card.classList.toggle("is-hidden", !(matchedKeyword && matchedType && matchedYear));
            });
        }

        [input, type, year].forEach(function (control) {
            if (control) {
                control.addEventListener("input", apply);
                control.addEventListener("change", apply);
            }
        });

        if (reset) {
            reset.addEventListener("click", function () {
                if (input) {
                    input.value = "";
                }
                if (type) {
                    type.value = "";
                }
                if (year) {
                    year.value = "";
                }
                apply();
            });
        }
    }

    function setupSearchPage() {
        var results = document.querySelector("[data-search-results]");
        var input = document.querySelector("[data-search-input]");
        if (!results || !input || !window.SEARCH_MOVIES) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        input.value = query;

        function normalize(value) {
            return (value || "").toString().toLowerCase().trim();
        }

        function render(list) {
            if (!list.length) {
                results.innerHTML = '<div class="empty-state"><h2>没有找到匹配影片</h2><p>可以更换关键词、年份、地区或类型再次搜索。</p><a class="empty-link" href="./categories.html">浏览分类</a></div>';
                return;
            }
            results.innerHTML = list.slice(0, 80).map(function (movie) {
                return '<article class="movie-card">' +
                    '<a class="poster-link" href="./' + movie.slug + '">' +
                    '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
                    '<span class="play-hover">▶</span>' +
                    '<span class="card-badge">' + escapeHtml(movie.year) + '</span>' +
                    '</a>' +
                    '<div class="card-body">' +
                    '<div class="card-tags"><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.region) + '</span></div>' +
                    '<h3><a href="./' + movie.slug + '">' + escapeHtml(movie.title) + '</a></h3>' +
                    '<div class="card-meta"><span>' + escapeHtml(movie.genre) + '</span><span>' + escapeHtml(movie.year) + '</span></div>' +
                    '<p>' + escapeHtml(movie.one_line) + '</p>' +
                    '</div>' +
                    '</article>';
            }).join("");
        }

        function search() {
            var keyword = normalize(input.value);
            if (!keyword) {
                results.innerHTML = '<div class="empty-state"><h2>搜索影片</h2><p>输入影片名称、类型、地区、年份或关键词，快速进入对应详情页。</p></div>';
                return;
            }
            var matched = window.SEARCH_MOVIES.filter(function (movie) {
                var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.one_line, movie.tags].join(" ").toLowerCase();
                return haystack.indexOf(keyword) !== -1;
            });
            render(matched);
        }

        input.addEventListener("input", search);
        search();
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"]/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;"
            }[char];
        });
    }

    function setupPlayer() {
        var shell = document.querySelector("[data-player-box]");
        var video = document.querySelector("[data-video-player]");
        var trigger = document.querySelector("[data-player-trigger]");
        if (!shell || !video || !trigger) {
            return;
        }
        var stream = video.getAttribute("data-stream");
        var hlsInstance = null;
        var loaded = false;

        function attach() {
            if (loaded || !stream) {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
                loaded = true;
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    maxBufferLength: 30,
                    enableWorker: true
                });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
                loaded = true;
            }
        }

        function start() {
            attach();
            shell.classList.add("is-playing");
            video.controls = true;
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        trigger.addEventListener("click", start);
        video.addEventListener("click", function () {
            if (video.paused) {
                start();
            } else {
                video.pause();
            }
        });
        window.addEventListener("pagehide", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }
})();
