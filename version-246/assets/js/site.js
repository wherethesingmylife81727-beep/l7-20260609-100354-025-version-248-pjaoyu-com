(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initMenu() {
        var button = document.querySelector("[data-menu-button]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var active = 0;
        var timer = null;

        function show(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === active);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === active);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(active + 1);
            }, 5000);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(active - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(active + 1);
                restart();
            });
        }

        restart();
    }

    function initFilters() {
        var search = document.getElementById("movieSearch");
        var region = document.getElementById("filterRegion");
        var year = document.getElementById("filterYear");
        var genre = document.getElementById("filterGenre");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var empty = document.querySelector("[data-no-results]");

        if (!cards.length || (!search && !region && !year && !genre)) {
            return;
        }

        function valueOf(element) {
            return element ? element.value.trim().toLowerCase() : "";
        }

        function apply() {
            var query = valueOf(search);
            var regionValue = valueOf(region);
            var yearValue = valueOf(year);
            var genreValue = valueOf(genre);
            var visible = 0;

            cards.forEach(function (card) {
                var text = (card.getAttribute("data-search") || "").toLowerCase();
                var cardRegion = (card.getAttribute("data-region") || "").toLowerCase();
                var cardYear = (card.getAttribute("data-year") || "").toLowerCase();
                var cardGenre = (card.getAttribute("data-genre") || "").toLowerCase();
                var matched = true;

                if (query && text.indexOf(query) === -1) {
                    matched = false;
                }
                if (regionValue && cardRegion !== regionValue) {
                    matched = false;
                }
                if (yearValue && cardYear !== yearValue) {
                    matched = false;
                }
                if (genreValue && cardGenre.indexOf(genreValue) === -1) {
                    matched = false;
                }

                card.classList.toggle("is-hidden", !matched);
                if (matched) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.hidden = visible !== 0;
            }
        }

        [search, region, year, genre].forEach(function (element) {
            if (element) {
                element.addEventListener("input", apply);
                element.addEventListener("change", apply);
            }
        });
    }

    function initPlayer() {
        var configElement = document.getElementById("movie-player-config");
        var video = document.querySelector("[data-player-video]");
        var overlay = document.querySelector("[data-play-overlay]");
        var message = document.querySelector("[data-player-message]");
        if (!configElement || !video || !overlay) {
            return;
        }

        var config = {};
        try {
            config = JSON.parse(configElement.textContent || "{}");
        } catch (error) {
            config = {};
        }

        var hls = null;
        var started = false;

        function showMessage(text) {
            if (message) {
                message.textContent = text;
                message.hidden = false;
            }
        }

        function playWhenReady() {
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    overlay.classList.remove("is-hidden");
                });
            }
        }

        function start() {
            if (!config.source) {
                showMessage("视频暂时无法播放，请稍后重试");
                return;
            }

            overlay.classList.add("is-hidden");

            if (started) {
                playWhenReady();
                return;
            }

            started = true;

            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(config.source);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    playWhenReady();
                });
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                        return;
                    }
                    showMessage("视频加载失败，请稍后重试");
                });
                return;
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = config.source;
                video.addEventListener("loadedmetadata", playWhenReady, { once: true });
                video.load();
                return;
            }

            showMessage("视频暂时无法播放，请稍后重试");
        }

        overlay.addEventListener("click", start);
        video.addEventListener("click", function () {
            if (!started) {
                start();
            }
        });

        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initFilters();
        initPlayer();
    });
})();
