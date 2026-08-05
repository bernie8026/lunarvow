(() => {
    'use strict';

    if (document.querySelector('[data-bhr-music-player]')) return;

    const AUDIO_SOURCE = 'assets/audio/lunar-vow-theme.mp3';
    const STORAGE = {
        enabled: 'bhr-lunar-music-enabled',
        volume: 'bhr-lunar-music-volume',
        time: 'bhr-lunar-music-time'
    };

    const COPY = {
        'zh-HK': {
            title: '月下主題曲',
            play: '播放背景音樂',
            pause: '暫停背景音樂',
            ready: 'CLICK TO PLAY',
            playing: 'PLAYING / LOOP',
            blocked: 'CLICK TO RESUME',
            missing: 'AUDIO FILE MISSING',
            volume: '背景音樂音量'
        },
        en: {
            title: 'LUNAR VOW THEME',
            play: 'Play background music',
            pause: 'Pause background music',
            ready: 'CLICK TO PLAY',
            playing: 'PLAYING / LOOP',
            blocked: 'CLICK TO RESUME',
            missing: 'AUDIO FILE MISSING',
            volume: 'Background music volume'
        },
        'zh-CN': {
            title: '月下主题曲',
            play: '播放背景音乐',
            pause: '暂停背景音乐',
            ready: 'CLICK TO PLAY',
            playing: 'PLAYING / LOOP',
            blocked: 'CLICK TO RESUME',
            missing: 'AUDIO FILE MISSING',
            volume: '背景音乐音量'
        }
    };

    const readNumber = (key, fallback) => {
        const value = Number.parseFloat(localStorage.getItem(key));
        return Number.isFinite(value) ? value : fallback;
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const audio = new Audio(AUDIO_SOURCE);
    audio.loop = true;
    audio.preload = 'metadata';
    audio.playsInline = true;
    audio.volume = clamp(readNumber(STORAGE.volume, 0.28), 0, 1);

    const consolePanel = document.createElement('div');
    consolePanel.className = 'music-console';
    consolePanel.dataset.bhrMusicPlayer = '';
    consolePanel.innerHTML = `
        <button class="music-console__toggle" type="button">
            <span class="music-console__icon" aria-hidden="true">▶</span>
            <span class="music-console__copy">
                <b>LUNAR VOW THEME</b>
                <small>CLICK TO PLAY</small>
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

    let unavailable = false;
    let autoplayBlocked = false;
    let lastStoredSecond = -1;

    const getLanguage = () => {
        const candidate = window.BHR_I18N?.language
            || document.body.dataset.language
            || document.documentElement.lang
            || 'zh-HK';
        return COPY[candidate] ? candidate : 'zh-HK';
    };

    const persistTime = () => {
        if (!Number.isFinite(audio.currentTime)) return;
        localStorage.setItem(STORAGE.time, String(audio.currentTime));
    };

    const updateInterface = () => {
        const text = COPY[getLanguage()];
        const playing = !audio.paused && !audio.ended && !unavailable;

        title.textContent = text.title;
        consolePanel.classList.toggle('is-playing', playing);
        consolePanel.classList.toggle('is-unavailable', unavailable);
        icon.textContent = playing ? 'Ⅱ' : '▶';

        if (unavailable) {
            status.textContent = text.missing;
            toggle.disabled = true;
            volumeInput.disabled = true;
            toggle.setAttribute('aria-label', text.play);
        } else {
            status.textContent = playing ? text.playing : (autoplayBlocked ? text.blocked : text.ready);
            toggle.disabled = false;
            volumeInput.disabled = false;
            toggle.setAttribute('aria-label', playing ? text.pause : text.play);
        }

        volumeLabel.setAttribute('aria-label', text.volume);
        volumeText.textContent = text.volume;
    };

    const startPlayback = async () => {
        if (unavailable) return;
        autoplayBlocked = false;
        try {
            await audio.play();
            localStorage.setItem(STORAGE.enabled, 'true');
        } catch (error) {
            autoplayBlocked = true;
            updateInterface();
        }
    };

    const stopPlayback = () => {
        audio.pause();
        localStorage.setItem(STORAGE.enabled, 'false');
        persistTime();
    };

    toggle.addEventListener('click', () => {
        if (audio.paused) {
            startPlayback();
        } else {
            stopPlayback();
        }
    });

    volumeInput.addEventListener('input', () => {
        const volume = clamp(Number.parseFloat(volumeInput.value), 0, 1);
        audio.volume = volume;
        localStorage.setItem(STORAGE.volume, String(volume));
    });

    audio.addEventListener('loadedmetadata', () => {
        const savedTime = readNumber(STORAGE.time, 0);
        if (Number.isFinite(audio.duration) && savedTime > 0 && savedTime < audio.duration) {
            audio.currentTime = savedTime;
        }

        if (localStorage.getItem(STORAGE.enabled) === 'true') {
            startPlayback();
        }
    }, { once: true });

    audio.addEventListener('timeupdate', () => {
        const second = Math.floor(audio.currentTime);
        if (second !== lastStoredSecond && second % 5 === 0) {
            lastStoredSecond = second;
            persistTime();
        }
    });

    audio.addEventListener('play', updateInterface);
    audio.addEventListener('pause', updateInterface);
    audio.addEventListener('error', () => {
        unavailable = true;
        localStorage.setItem(STORAGE.enabled, 'false');
        updateInterface();
    });

    window.addEventListener('pagehide', persistTime);
    window.addEventListener('beforeunload', persistTime);
    window.addEventListener('bhr:languagechange', updateInterface);

    updateInterface();
})();
