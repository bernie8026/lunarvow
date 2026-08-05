(() => {
    'use strict';

    if (document.querySelector('[data-bhr-music-player]')) return;

    const AUDIO_PATH = 'assets/audio/lunar-vow-theme.webm';
    const PLAYER_VERSION = '4';
    const DEFAULT_VOLUME = 0.65;
    const STORAGE = {
        enabled: 'bhr-lunar-music-enabled-v4',
        volume: 'bhr-lunar-music-volume-v4',
        time: 'bhr-lunar-music-time-v4'
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
            stalled: 'SOURCE STALLED / RETRY',
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
            stalled: 'SOURCE STALLED / RETRY',
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
            stalled: 'SOURCE STALLED / RETRY',
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

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.muted = false;

    const savedVolume = readNumber(STORAGE.volume, DEFAULT_VOLUME);
    audio.volume = savedVolume < 0.08 ? DEFAULT_VOLUME : clamp(savedVolume, 0, 1);

    const buildSource = (attempt = 0) => {
        const url = new URL(AUDIO_PATH, document.baseURI);
        url.searchParams.set('player', PLAYER_VERSION);
        url.searchParams.set('attempt', String(attempt));
        if (attempt > 0) url.searchParams.set('cache', String(Date.now()));
        return url.href;
    };

    let sourceAttempt = 0;
    let state = 'loading';
    let lastStoredSecond = -1;
    let progressTimer = 0;
    let playRequest = 0;

    const consolePanel = document.createElement('div');
    consolePanel.className = 'music-console';
    consolePanel.dataset.bhrMusicPlayer = '';
    consolePanel.hidden = false;
    consolePanel.innerHTML = `
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
    document.body.appendChild(consolePanel);

    const toggle = consolePanel.querySelector('.music-console__toggle');
    const icon = consolePanel.querySelector('.music-console__icon');
    const title = consolePanel.querySelector('.music-console__copy b');
    const status = consolePanel.querySelector('.music-console__copy small');
    const volumeLabel = consolePanel.querySelector('.music-console__volume');
    const volumeInput = consolePanel.querySelector('.music-console__volume input');
    const volumeText = consolePanel.querySelector('.music-console__volume .sr-only');

    const getLanguage = () => {
        const candidate = window.BHR_I18N?.language
            || document.body.dataset.language
            || document.documentElement.lang
            || 'zh-HK';
        return COPY[candidate] ? candidate : 'zh-HK';
    };

    const persistTime = () => {
        if (Number.isFinite(audio.currentTime)) {
            localStorage.setItem(STORAGE.time, String(audio.currentTime));
        }
    };

    const statusText = (text) => {
        const volumePercent = Math.round(audio.volume * 100);
        if (!audio.paused && state === 'playing') {
            return `${text.playing} ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)} · VOL ${volumePercent}%`;
        }
        if (state === 'loading') return text.loading;
        if (state === 'blocked') return text.blocked;
        if (state === 'stalled') return text.stalled;
        if (state === 'error') return text.error;
        return `${text.ready} · VOL ${volumePercent}%`;
    };

    const updateInterface = () => {
        const text = COPY[getLanguage()];
        const playing = !audio.paused && state === 'playing';
        title.textContent = text.title;
        icon.textContent = playing ? 'Ⅱ' : '▶';
        status.textContent = statusText(text);
        consolePanel.classList.toggle('is-playing', playing);
        consolePanel.classList.toggle('is-unavailable', state === 'error');
        toggle.disabled = state === 'loading';
        toggle.setAttribute('aria-label', playing ? text.pause : text.play);
        volumeLabel.setAttribute('aria-label', text.volume);
        volumeText.textContent = text.volume;
        volumeInput.value = String(audio.volume);
    };

    const ensureAudibleVolume = () => {
        audio.muted = false;
        if (audio.volume < 0.08) {
            audio.volume = DEFAULT_VOLUME;
            volumeInput.value = String(DEFAULT_VOLUME);
            localStorage.setItem(STORAGE.volume, String(DEFAULT_VOLUME));
        }
    };

    const monitorProgress = (requestId) => {
        window.clearTimeout(progressTimer);
        const startTime = audio.currentTime;
        progressTimer = window.setTimeout(() => {
            if (requestId !== playRequest || audio.paused) return;
            if (!Number.isFinite(audio.currentTime) || audio.currentTime <= startTime + 0.05) {
                state = 'stalled';
                audio.pause();
                updateInterface();
            }
        }, 1800);
    };

    const loadSource = (resumeAfterLoad = false) => {
        state = 'loading';
        updateInterface();
        audio.pause();
        audio.src = buildSource(sourceAttempt);
        audio.load();

        const onReady = async () => {
            audio.removeEventListener('canplay', onReady);
            state = 'ready';
            const savedTime = readNumber(STORAGE.time, 0);
            if (Number.isFinite(audio.duration) && savedTime > 0 && savedTime < audio.duration) {
                try { audio.currentTime = savedTime; } catch (_) { /* ignored */ }
            }
            updateInterface();
            if (resumeAfterLoad || localStorage.getItem(STORAGE.enabled) === 'true') {
                await startPlayback();
            }
        };

        audio.addEventListener('canplay', onReady, { once: true });
    };

    const retrySource = async () => {
        sourceAttempt += 1;
        loadSource(true);
    };

    const startPlayback = async () => {
        ensureAudibleVolume();
        const requestId = ++playRequest;
        state = 'ready';
        updateInterface();
        try {
            await audio.play();
            if (requestId !== playRequest) return;
            state = 'playing';
            localStorage.setItem(STORAGE.enabled, 'true');
            updateInterface();
            monitorProgress(requestId);
        } catch (_) {
            if (requestId !== playRequest) return;
            state = 'blocked';
            localStorage.setItem(STORAGE.enabled, 'false');
            updateInterface();
        }
    };

    const stopPlayback = () => {
        ++playRequest;
        window.clearTimeout(progressTimer);
        audio.pause();
        state = 'ready';
        localStorage.setItem(STORAGE.enabled, 'false');
        persistTime();
        updateInterface();
    };

    toggle.addEventListener('click', async () => {
        if (state === 'error' || state === 'stalled') {
            await retrySource();
            return;
        }
        if (audio.paused) {
            await startPlayback();
        } else {
            stopPlayback();
        }
    });

    volumeInput.addEventListener('input', () => {
        audio.muted = false;
        audio.volume = clamp(Number.parseFloat(volumeInput.value), 0, 1);
        localStorage.setItem(STORAGE.volume, String(audio.volume));
        updateInterface();
    });

    audio.addEventListener('timeupdate', () => {
        if (!audio.paused && state !== 'playing') state = 'playing';
        const second = Math.floor(audio.currentTime);
        if (second !== lastStoredSecond && second % 5 === 0) {
            lastStoredSecond = second;
            persistTime();
        }
        updateInterface();
    });

    audio.addEventListener('play', () => {
        state = 'playing';
        updateInterface();
    });
    audio.addEventListener('pause', updateInterface);
    audio.addEventListener('volumechange', updateInterface);
    audio.addEventListener('error', () => {
        state = 'error';
        localStorage.setItem(STORAGE.enabled, 'false');
        updateInterface();
    });

    window.addEventListener('pagehide', persistTime);
    window.addEventListener('beforeunload', persistTime);
    window.addEventListener('bhr:languagechange', updateInterface);

    updateInterface();
    loadSource(false);
})();
