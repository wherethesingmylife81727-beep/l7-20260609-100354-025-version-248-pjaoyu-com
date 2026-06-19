(function () {
    function escapeHtml(value) {
        return String(value).replace(/[&<>"]/g, function (item) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            }[item];
        });
    }

    function normalize(value) {
        return String(value || '').toLowerCase();
    }

    function card(movie) {
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');
        return [
            '<article class="movie-card">',
            '<a class="poster" href="' + escapeHtml(movie.href) + '">',
            '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '<span class="poster-year">' + escapeHtml(movie.year) + '</span>',
            '<span class="poster-play">▶</span>',
            '</a>',
            '<div class="movie-card-body">',
            '<h3><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>',
            '<div class="meta-line"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.category) + '</span></div>',
            '<p>' + escapeHtml(movie.oneLine) + '</p>',
            '<div class="tag-row">' + tags + '</div>',
            '</div>',
            '</article>'
        ].join('');
    }

    document.addEventListener('DOMContentLoaded', function () {
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        var title = document.getElementById('search-title');
        var desc = document.getElementById('search-desc');
        var grid = document.getElementById('search-results');
        var input = document.querySelector('.page-search input[name="q"]');
        var movies = window.SEARCH_MOVIES || [];

        if (input) {
            input.value = query;
        }

        var list = movies.slice(0, 24);
        if (query) {
            var words = normalize(query).split(/\s+/).filter(Boolean);
            list = movies.filter(function (movie) {
                var haystack = normalize([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    movie.category,
                    movie.oneLine,
                    (movie.tags || []).join(' ')
                ].join(' '));
                return words.every(function (word) {
                    return haystack.indexOf(word) !== -1;
                });
            });
            if (title) {
                title.textContent = '搜索结果：' + query;
            }
            if (desc) {
                desc.textContent = list.length ? '已匹配到相关影片，点击卡片进入详情页。' : '暂未匹配到相关影片，可以更换关键词继续搜索。';
            }
        }

        if (grid) {
            grid.innerHTML = list.slice(0, 120).map(card).join('');
        }
    });
}());
