(() => {
    'use strict';

    if (document.querySelector('[data-bhr-music-player]')) return;

    const SOURCE_PATH = 'Honkai Impact 7.0 PV BGM, Re_ Promise to Luna (1).mp3';
    const SOURCE_VERSION = '6';
    const DEFAULT_VOLUME = 0.65;
    const STORAGE = {
        enabled: 'bhr-lunar-music-enabled-v6',
        volume: 'bhr-lunar-music-volume-v6',
        time: 'bhr-lunar-music-time-v6'
    };

    const COPY = {
        'zh-HK': {
            title: '月下主題曲',
            play: '播放背景音樂',
            pause: '暫停背景音樂',
            ready: 'CLICK TO PLAY',
            loading: 'LOADING AUDIO',
            playing: 'PLAYING',
            blocked: 'CLICK TO RESUME',
            error: 'AUDIO ERROR / RETRY',
            volume: '背景音樂音量'
        },
        en: {
            title: 'LUNAR VOW THEME',
            play: 'Play background music',
            pause: 'Pause background music',
            ready: 'CLICK TO PLAY',
            loading: 'LOADING AUDIO',
            playing: 'PLAYING',
            blocked: 'CLICK TO RESUME',
            error: 'AUDIO ERROR / RETRY',
            volume: 'Background music volume'
        },
        'zh-CN': {
            title: '月下主题曲',
            play: '播放背景音乐',
            pause: '暂停背景音乐',
            ready: 'CLICK TO PLAY',
            loading: 'LOADING AUDIO',
            playing: 'PLAYING',
            blocked: 'CLICK TO RESUME',
            error: 'AUDIO ERROR / RETRY',
            volume: '背景音乐音量'
        }
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const readNumber = (key, fallback) => {
        const value = Number.parseFloat(localStorage.getItem(key));
        return Number.isFinite(value) ? value : fallback;
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
        const url = new URL(SOURCE_PATH, document.baseURI);
        url.searchParams.set('v', SOURCE_VERSION);
        if (retry) url.searchParams.set('retry', String(Date.now()));
        return url.href;
    };

    const savedVolume = readNumber(STORAGE.volume, DEFAULT_VOLUME);
    const audio = new Audio(sourceUrl());
    audio.loop = true;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.muted = false;
    audio.volume = savedVolume < 0.08 ? DEFAULT_VOLUME : clamp(savedVolume, 0, 1);

    const panel = document.createElement('div');
    panel.className = 'music-console';
    panel.dataset.bhrMusicPlayer = '';
    panel.innerHTML = `
        <button class="music-console__toggle" type="button">
            <span class="music-console__icon" aria-hidden="true">▶</span>
            <span class="music-console__copy">
                <b>LUNAR VOW THEME</b>
                <small>LOADING AUDIO</small>
            </span>
        </button>
        <label class="music-console__volume">
            <span class="sr-only">Background music volume</span>
            <input type="range" min="0" max="1" step="0.05" value="${audio.volume}">
        </label>`;
    document.body.appendChild(panel);

    const toggle = panel.querySelector('.music-console__toggle');
    const icon = panel.querySelector('.music-console__icon');
    const title = panel.querySelector('.music-console__copy b');
    const status = panel.querySelector('.music-console__copy small');
    const volumeLabel = panel.querySelector('.music-console__volume');
    const volumeInput = panel.querySelector('.music-console__volume input');
    const volumeText = panel.querySelector('.music-console__volume .sr-only');

    let state = 'loading';
    let progressCheck = 0;
    let lastStoredSecond = -1;

    const persistTime = () => {
        if (Number.isFinite(audio.currentTime)) {
            localStorage.setItem(STORAGE.time, String(audio.currentTime));
        }
    };

    const update = () => {
        const text = COPY[language()];
        const playing = !audio.paused && !audio.ended && state === 'playing';
        const volume = Math.round(audio.volume * 100);

        title.textContent = text.title;
        icon.textContent = playing ? 'Ⅱ' : '▶';
        panel.classList.toggle('is-playing', playing);
        panel.classList.toggle('is-unavailable', state === 'error');
        toggle.disabled = state === 'loading';
        toggle.setAttribute('aria-label', playing ? text.pause : text.play);
        volumeLabel.setAttribute('aria-label', text.volume);
        volumeText.textContent = text.volume;
        volumeInput.value = String(audio.volume);

        if (playing) {
            status.textContent = `${text.playing} ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)} · VOL ${volume}%`;
        } else if (state === 'loading') {
            status.textContent = text.loading;
        } else if (state === 'blocked') {
            status.textContent = text.blocked;
        } else if (state === 'error') {
            status.textContent = text.error;
        } else {
            status.textContent = `${text.ready} · VOL ${volume}%`;
        }
    };

    const restorePosition = () => {
        const savedTime = readNumber(STORAGE.time, 0);
        if (Number.isFinite(audio.duration) && savedTime > 0 && savedTime < audio.duration) {
            try { audio.currentTime = savedTime; } catch (_) { /* ignored */ }
        }
    };

    const verifyProgress = (startTime) => {
        window.clearTimeout(progressCheck);
        progressCheck = window.setTimeout(() => {
            if (audio.paused) return;
            if (!Number.isFinite(audio.currentTime) || audio.currentTime <= startTime + 0.1) {
                audio.pause();
                state = 'error';
                localStorage.setItem(STORAGE.enabled, 'false');
                update();
            }
        }, 2500);
    };

    const start = async () => {
        audio.muted = false;
        if (audio.volume < 0.08) {
            audio.volume = DEFAULT_VOLUME;
            localStorage.setItem(STORAGE.volume, String(DEFAULT_VOLUME));
        }

        try {
            const startTime = audio.currentTime;
            await audio.play();
            state = 'playing';
            localStorage.setItem(STORAGE.enabled, 'true');
            update();
            verifyProgress(startTime);
        } catch (_) {
            state = 'blocked';
            localStorage.setItem(STORAGE.enabled, 'false');
            update();
        }
    };

    const stop = () => {
        window.clearTimeout(progressCheck);
        audio.pause();
        state = 'ready';
        localStorage.setItem(STORAGE.enabled, 'false');
        persistTime();
        update();
    };

    const retry = () => {
        window.clearTimeout(progressCheck);
        state = 'loading';
        update();
        audio.pause();
        audio.src = sourceUrl(true);
        audio.load();
    };

    toggle.addEventListener('click', async () => {
        if (state === 'error') {
            retry();
            return;
        }
        if (audio.paused) await start();
        else stop();
    });

    volumeInput.addEventListener('input', () => {
        audio.muted = false;
        audio.volume = clamp(Number.parseFloat(volumeInput.value), 0, 1);
        localStorage.setItem(STORAGE.volume, String(audio.volume));
        update();
    });

    audio.addEventListener('loadedmetadata', restorePosition);
    audio.addEventListener('canplay', async () => {
        state = 'ready';
        update();
        if (localStorage.getItem(STORAGE.enabled) === 'true') await start();
    });
    audio.addEventListener('timeupdate', () => {
        if (!audio.paused) state = 'playing';
        const second = Math.floor(audio.currentTime);
        if (second !== lastStoredSecond && second % 5 === 0) {
            lastStoredSecond = second;
            persistTime();
        }
        update();
    });
    audio.addEventListener('pause', update);
    audio.addEventListener('volumechange', update);
    audio.addEventListener('error', () => {
        state = 'error';
        localStorage.setItem(STORAGE.enabled, 'false');
        update();
    });

    window.addEventListener('pagehide', persistTime);
    window.addEventListener('beforeunload', persistTime);
    window.addEventListener('bhr:languagechange', update);

    update();
    audio.load();
})();
