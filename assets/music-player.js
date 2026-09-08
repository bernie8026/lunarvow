(() => {
    'use strict';

    if (document.querySelector('[data-bhr-music-player]')) return;

    const SCRIPT_URL = document.currentScript?.src || new URL('assets/music-player.js', document.baseURI).href;
    const SOURCE_FILE = 'Honkai Impact 7.0 PV BGM, Re_ Promise to Luna (1).mp3';
    const SOURCE_VERSION = '7';
    const DEFAULT_VOLUME = 0.65;
    const STORAGE = {
        volume: 'bhr-lunar-music-volume-v7',
        time: 'bhr-lunar-music-time-v7'
    };

    const COPY = {
        'zh-HK': {
            title: '月下主題曲',
            play: '播放背景音樂',
            pause: '暫停背景音樂',
            ready: '按此播放',
            loading: '正在載入音樂',
            playing: '播放中',
            blocked: '請按播放重試',
            error: '載入失敗 · 按此重試',
            volume: '背景音樂音量'
        },
        en: {
            title: 'LUNAR VOW THEME',
            play: 'Play background music',
            pause: 'Pause background music',
            ready: 'PRESS TO PLAY',
            loading: 'LOADING AUDIO',
            playing: 'PLAYING',
            blocked: 'PRESS PLAY TO RETRY',
            error: 'AUDIO ERROR · RETRY',
            volume: 'Background music volume'
        },
        'zh-CN': {
            title: '月下主题曲',
            play: '播放背景音乐',
            pause: '暂停背景音乐',
            ready: '按此播放',
            loading: '正在加载音乐',
            playing: '播放中',
            blocked: '请按播放重试',
            error: '加载失败 · 按此重试',
            volume: '背景音乐音量'
        }
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const readNumber = (key, fallback) => {
        try {
            const value = Number.parseFloat(localStorage.getItem(key));
            return Number.isFinite(value) ? value : fallback;
        } catch (_) {
            return fallback;
        }
    };
    const store = (key, value) => {
        try { localStorage.setItem(key, String(value)); } catch (_) { /* Playback also works without storage. */ }
    };
    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const whole = Math.floor(seconds);
        return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    };
    const language = () => {
        const value = window.BHR_I18N?.language
            || document.body.dataset.language
            || document.documentElement.lang
            || 'zh-HK';
        return COPY[value] ? value : 'zh-HK';
    };
    const sourceUrl = (retry = false) => {
        const url = new URL(`../${SOURCE_FILE}`, SCRIPT_URL);
        url.searchParams.set('v', SOURCE_VERSION);
        if (retry) url.searchParams.set('retry', String(Date.now()));
        return url.href;
    };

    const audio = new Audio();
    audio.autoplay = false;
    audio.loop = true;
    audio.preload = 'none';
    audio.playsInline = true;
    audio.volume = clamp(readNumber(STORAGE.volume, DEFAULT_VOLUME), 0, 1);
    audio.src = sourceUrl();

    const panel = document.createElement('div');
    panel.className = 'music-console';
    panel.dataset.bhrMusicPlayer = '';
    panel.dataset.i18nIgnore = '';
    panel.setAttribute('translate', 'no');
    panel.innerHTML = `
        <button class="music-console__toggle" type="button">
            <span class="music-console__icon" aria-hidden="true">▶</span>
            <span class="music-console__copy" aria-hidden="true">
                <b>LUNAR VOW THEME</b>
                <small>PRESS TO PLAY</small>
            </span>
        </button>
        <label class="music-console__volume">
            <span class="sr-only">Background music volume</span>
            <input type="range" min="0" max="1" step="0.05" value="${audio.volume}">
        </label>
        <span class="music-console__announcement sr-only" role="status" aria-live="polite" aria-atomic="true"></span>`;
    document.body.appendChild(panel);

    const toggle = panel.querySelector('.music-console__toggle');
    const icon = panel.querySelector('.music-console__icon');
    const title = panel.querySelector('.music-console__copy b');
    const status = panel.querySelector('.music-console__copy small');
    const volumeInput = panel.querySelector('.music-console__volume input');
    const volumeText = panel.querySelector('.music-console__volume .sr-only');
    const announcement = panel.querySelector('.music-console__announcement');

    let state = 'ready';
    let playbackRequested = false;
    let playRequest = 0;
    let lastStoredSecond = -1;
    let lastAnnouncement = '';

    const persistTime = () => {
        // Avoid overwriting the last position when leaving without playing.
        if (audio.readyState > 0 && Number.isFinite(audio.currentTime)) {
            store(STORAGE.time, audio.currentTime);
        }
    };

    const update = () => {
        const text = COPY[language()];
        const playing = playbackRequested && !audio.paused && state === 'playing';
        const volume = Math.round(audio.volume * 100);

        title.textContent = text.title;
        icon.textContent = playbackRequested ? 'Ⅱ' : '▶';
        panel.classList.toggle('is-playing', playing);
        panel.classList.toggle('is-unavailable', state === 'error');
        toggle.setAttribute('aria-label', playbackRequested ? text.pause : text.play);
        toggle.title = playbackRequested ? text.pause : text.play;
        volumeText.textContent = text.volume;
        volumeInput.setAttribute('aria-label', text.volume);
        volumeInput.setAttribute('aria-valuetext', `${volume}%`);
        volumeInput.value = String(audio.volume);

        status.textContent = playing
            ? `${text.playing} ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
            : text[state];

        // Announce state changes without reading the playback clock every second.
        const message = text[state];
        if (message !== lastAnnouncement) {
            lastAnnouncement = message;
            announcement.textContent = message;
        }
    };

    const restorePosition = () => {
        const savedTime = readNumber(STORAGE.time, 0);
        if (Number.isFinite(audio.duration) && savedTime > 0 && savedTime < audio.duration) {
            try { audio.currentTime = savedTime; } catch (_) { /* Seeking may be unavailable. */ }
        }
    };

    const start = async () => {
        if (playbackRequested) return;
        if (state === 'error') {
            audio.src = sourceUrl(true);
            audio.load();
        }

        const request = ++playRequest;
        playbackRequested = true;
        state = 'loading';
        update();

        try {
            // Keep play() in the button's gesture, including error retries.
            await audio.play();
            if (request !== playRequest || !playbackRequested) return;
            state = 'playing';
            update();
        } catch (error) {
            if (request !== playRequest) return;
            playbackRequested = false;
            state = error?.name === 'NotAllowedError' ? 'blocked' : 'error';
            update();
        }
    };

    const stop = () => {
        ++playRequest;
        playbackRequested = false;
        audio.pause();
        state = 'ready';
        persistTime();
        update();
    };

    toggle.addEventListener('click', () => {
        if (playbackRequested) stop();
        else start();
    });

    volumeInput.addEventListener('input', () => {
        audio.volume = clamp(Number.parseFloat(volumeInput.value), 0, 1);
        store(STORAGE.volume, audio.volume);
        update();
    });

    audio.addEventListener('loadedmetadata', restorePosition);
    audio.addEventListener('playing', () => {
        if (!playbackRequested) {
            audio.pause();
            return;
        }
        state = 'playing';
        update();
    });
    audio.addEventListener('waiting', () => {
        if (playbackRequested) state = 'loading';
        update();
    });
    audio.addEventListener('timeupdate', () => {
        const second = Math.floor(audio.currentTime);
        if (playbackRequested && second !== lastStoredSecond && second % 5 === 0) {
            lastStoredSecond = second;
            persistTime();
        }
        update();
    });
    audio.addEventListener('pause', () => {
        if (audio.paused && playbackRequested) {
            ++playRequest;
            playbackRequested = false;
            state = 'ready';
        }
        update();
    });
    audio.addEventListener('volumechange', update);
    audio.addEventListener('error', () => {
        ++playRequest;
        playbackRequested = false;
        state = 'error';
        update();
    });

    window.addEventListener('pagehide', () => {
        if (playbackRequested) stop();
        else persistTime();
    });
    window.addEventListener('bhr:languagechange', update);

    update();
})();
