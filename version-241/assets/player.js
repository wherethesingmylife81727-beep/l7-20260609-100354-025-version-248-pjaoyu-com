(function () {
    function initMoviePlayer(streamUrl, posterUrl) {
        var video = document.getElementById('movieVideo');
        var button = document.getElementById('playOverlay');
        if (!video) {
            return;
        }
        if (posterUrl) {
            video.setAttribute('poster', posterUrl);
        }
        var shell = video.closest('.player-shell');
        var hlsInstance = null;

        function attachStream() {
            if (video.getAttribute('data-ready') === '1') {
                return;
            }
            video.setAttribute('data-ready', '1');
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = streamUrl;
            }
        }

        function startPlayback() {
            attachStream();
            if (shell) {
                shell.classList.add('has-played');
            }
            var playTask = video.play();
            if (playTask && playTask.catch) {
                playTask.catch(function () {
                    if (shell) {
                        shell.classList.remove('has-played');
                    }
                });
            }
        }

        if (button) {
            button.addEventListener('click', startPlayback);
        }

        video.addEventListener('play', function () {
            if (shell) {
                shell.classList.add('has-played');
            }
        });

        video.addEventListener('emptied', function () {
            if (hlsInstance && hlsInstance.destroy) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
            video.removeAttribute('data-ready');
        });

        attachStream();
    }

    window.initMoviePlayer = initMoviePlayer;
}());
