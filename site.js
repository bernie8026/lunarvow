(() => {
    'use strict';

    const themeId = 'crimson-rose-theme';
    if (!document.getElementById(themeId)) {
        const themeLink = document.createElement('link');
        themeLink.id = themeId;
        themeLink.rel = 'stylesheet';
        themeLink.href = 'assets/red-pink-theme.css';
        document.head.appendChild(themeLink);
    }

    const body = document.body;
    const bootScreen = document.querySelector('.boot-screen');
    const header = document.querySelector('[data-header]');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-menu]');
    const navLinks = document.querySelectorAll('[data-nav-link]');
    const revealItems = document.querySelectorAll('[data-reveal]');
    const trackedSections = document.querySelectorAll('[data-section]');
    const railLinks = document.querySelectorAll('[data-rail-link]');
    const parallaxItems = document.querySelectorAll('[data-parallax]');
    const yearNodes = document.querySelectorAll('[data-current-year]');

    /* Character images stay hidden until their actual file has loaded, then slide in. */
    const imageMotionStates = new WeakMap();
    let imageSequence = 0;

    const isCharacterVisual = (image) => {
        if (!(image instanceof HTMLImageElement)) return false;
        const source = image.currentSrc || image.src || image.getAttribute('src') || '';
        return image.matches('.character-visual, .thumb, .hero-figure img, .feature-transmission__visual img, .guide-hero img, .lb-img') ||
            source.includes('assets/hi3/characters/') ||
            source.includes('honkaiimpact3.fandom.com') ||
            source.includes('static.wikia.nocookie.net');
    };

    const finishCharacterReveal = (image, state) => {
        if (imageMotionStates.get(image) !== state) return;

        image.style.visibility = 'visible';
        image.dataset.imageState = 'revealing';

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isLargeVisual = image.matches('.hero-figure img, .feature-transmission__visual img, .guide-hero img, .lb-img');
        const distance = isLargeVisual ? 88 : 38;
        const duration = reduceMotion ? 180 : (isLargeVisual ? 920 : 680);
        const delay = reduceMotion ? 0 : Math.min(state.sequence % 8, 7) * 42;

        if (typeof image.animate !== 'function') {
            image.style.opacity = '1';
            image.style.transform = '';
            image.dataset.imageState = 'ready';
            return;
        }

        state.animation?.cancel();
        state.animation = image.animate([
            {
                opacity: 0,
                transform: `translate3d(${distance}px, 0, 0) scale(0.985)`,
                clipPath: 'inset(0 0 0 18%)'
            },
            {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                clipPath: 'inset(0 0 0 0)'
            }
        ], {
            duration,
            delay,
            easing: 'cubic-bezier(.18, .82, .24, 1)',
            fill: 'both'
        });

        state.animation.finished
            .catch(() => undefined)
            .then(() => {
                if (imageMotionStates.get(image) !== state) return;
                image.style.opacity = '1';
                image.style.visibility = 'visible';
                image.style.transform = '';
                image.style.clipPath = '';
                image.dataset.imageState = 'ready';
                state.animation?.cancel();
                state.animation = null;
            });
    };

    const prepareCharacterImage = (image) => {
        if (!isCharacterVisual(image)) return;

        const previous = imageMotionStates.get(image);
        previous?.animation?.cancel();
        if (previous?.loadHandler) image.removeEventListener('load', previous.loadHandler);

        const state = {
            sequence: imageSequence++,
            animation: null,
            loadHandler: null
        };
        imageMotionStates.set(image, state);

        image.dataset.imageState = 'loading';
        image.style.opacity = '0';
        image.style.visibility = 'hidden';
        image.style.willChange = 'opacity, transform, clip-path';

        state.loadHandler = () => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => finishCharacterReveal(image, state));
            });
        };

        image.addEventListener('load', state.loadHandler, { once: true });

        if (image.complete && image.naturalWidth > 0) {
            state.loadHandler();
        }
    };

    const scanCharacterImages = (root = document) => {
        if (root instanceof HTMLImageElement) prepareCharacterImage(root);
        root.querySelectorAll?.('img').forEach(prepareCharacterImage);
    };

    scanCharacterImages();

    const characterImageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
                prepareCharacterImage(mutation.target);
                return;
            }

            mutation.addedNodes.forEach((node) => {
                if (node instanceof Element) scanCharacterImages(node);
            });
        });
    });

    characterImageObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset']
    });

    const hideBootScreen = () => {
        if (!bootScreen) return;
        window.setTimeout(() => bootScreen.classList.add('is-hidden'), 500);
        window.setTimeout(() => bootScreen.remove(), 1150);
    };

    if (document.readyState === 'complete') {
        hideBootScreen();
    } else {
        window.addEventListener('load', hideBootScreen, { once: true });
        window.setTimeout(hideBootScreen, 2200);
    }

    const closeMenu = () => {
        if (!menuToggle || !menu) return;
        menuToggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        body.classList.remove('menu-open');
    };

    if (menuToggle && menu) {
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!expanded));
            menu.classList.toggle('is-open', !expanded);
            body.classList.toggle('menu-open', !expanded);
        });

        navLinks.forEach((link) => link.addEventListener('click', closeMenu));

        window.addEventListener('resize', () => {
            if (window.innerWidth > 820) closeMenu();
        });
    }

    const updateHeader = () => {
        if (!header) return;
        header.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -12% 0px',
            threshold: 0.12
        });

        revealItems.forEach((item) => revealObserver.observe(item));

        const sectionObserver = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visible) return;
            const sectionName = visible.target.dataset.section;
            railLinks.forEach((link) => {
                link.classList.toggle('is-active', link.dataset.railLink === sectionName);
            });
        }, {
            rootMargin: '-28% 0px -55% 0px',
            threshold: [0.05, 0.2, 0.5]
        });

        trackedSections.forEach((section) => sectionObserver.observe(section));
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    }

    const canUseParallax = window.matchMedia('(pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canUseParallax && parallaxItems.length) {
        let frameId = null;
        let pointerX = 0;
        let pointerY = 0;

        const renderParallax = () => {
            const normalizedX = (pointerX / window.innerWidth) - 0.5;
            const normalizedY = (pointerY / window.innerHeight) - 0.5;

            parallaxItems.forEach((item) => {
                const depth = Number.parseFloat(item.dataset.parallax || '0');
                const moveX = normalizedX * depth * 36;
                const moveY = normalizedY * depth * 24;
                item.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
            });

            frameId = null;
        };

        window.addEventListener('pointermove', (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (frameId === null) frameId = window.requestAnimationFrame(renderParallax);
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            parallaxItems.forEach((item) => {
                item.style.transform = 'translate3d(0, 0, 0)';
            });
        });
    }

    const currentYear = String(new Date().getFullYear());
    yearNodes.forEach((node) => {
        node.textContent = currentYear;
    });
})();
