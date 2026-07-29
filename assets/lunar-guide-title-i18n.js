(() => {
    'use strict';

    const TITLES = {
        'zh-HK': '月下誓約',
        en: 'Lunar Vow',
        'zh-CN': '月下誓约'
    };

    const applyTitle = () => {
        const title = document.querySelector('.lunar-guide .page-hero h1');
        if (!title) return;

        const language = window.BHR_I18N?.language
            || document.body.dataset.language
            || document.documentElement.lang
            || 'zh-HK';

        title.textContent = TITLES[language] || TITLES['zh-HK'];
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTitle, { once: true });
    } else {
        applyTitle();
    }

    window.addEventListener('bhr:languagechange', applyTitle);
})();
