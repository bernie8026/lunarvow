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
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* Every inner page uses exactly the same global header as the homepage. */
    const normalizeGlobalHeader = () => {
        if (!body.classList.contains('inner-page')) return;

        const currentHeader = document.querySelector('[data-header]');
        if (!currentHeader) return;

        currentHeader.classList.add('site-header--global');
        currentHeader.innerHTML = `
            <a class="site-brand" href="index.html#home" aria-label="返回首頁">
                <span class="site-brand__mark">BR</span>
                <span class="site-brand__copy">
                    <strong>HONKAI REALM</strong>
                    <small>PERSONAL ARCHIVE / 2026</small>
                </span>
            </a>

            <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" data-menu-toggle>
                <span></span><span></span>
                <span class="sr-only">開啟導覽選單</span>
            </button>

            <nav class="site-nav" id="primary-navigation" aria-label="主要導覽" data-menu>
                <a href="index.html#home" data-nav-link><span>01</span>HOME</a>
                <a href="index.html#latest" data-nav-link><span>02</span>LATEST</a>
                <a href="index.html#archive" data-nav-link><span>03</span>ARCHIVE</a>
                <a href="index.html#profile" data-nav-link><span>04</span>PROFILE</a>
                <a class="site-nav__database" href="hi3.html">DATABASE ↗</a>
            </nav>

            <div class="site-header__status" aria-hidden="true">
                <span class="status-light"></span>
                SYSTEM ONLINE
            </div>`;
    };

    normalizeGlobalHeader();

    const bootScreen = document.querySelector('.boot-screen');
    const header = document.querySelector('[data-header]');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-menu]');
    const navLinks = document.querySelectorAll('[data-nav-link]');
    const trackedSections = document.querySelectorAll('[data-section]');
    const railLinks = document.querySelectorAll('[data-rail-link]');
    const parallaxItems = document.querySelectorAll('[data-parallax]');
    const yearNodes = document.querySelectorAll('[data-current-year]');

    function closeMenu() {
        if (!menuToggle || !menu) return;
        menuToggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        body.classList.remove('menu-open');
    }

    /* Keep the header visible while a one-second scan transition covers the page content. */
    const transitionLayer = document.createElement('div');
    transitionLayer.className = 'page-transition';
    transitionLayer.setAttribute('aria-hidden', 'true');
    transitionLayer.innerHTML = `
        <div class="page-transition__grid"></div>
        <div class="page-transition__content">
            <span class="page-transition__code">BHR // SECURE LINK</span>
            <strong>ACCESSING FILE</strong>
            <div class="page-transition__bar"><i></i></div>
        </div>`;
    body.appendChild(transitionLayer);

    const transitionTitle = transitionLayer.querySelector('strong');
    let navigationLocked = false;

    const shouldTransition = (link, event) => {
        if (!(link instanceof HTMLAnchorElement)) return false;
        if (event.defaultPrevented || event.button !== 0) return false;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
        if (link.target && link.target !== '_self') return false;
        if (link.hasAttribute('download')) return false;

        const rawHref = link.getAttribute('href') || '';
        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return false;

        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return false;

        const sameDocument = url.pathname === window.location.pathname && url.search === window.location.search;
        if (sameDocument) return false;

        return true;
    };

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!shouldTransition(link, event) || navigationLocked) return;

        event.preventDefault();
        navigationLocked = true;

        const destination = new URL(link.href, window.location.href);
        const isDatabase = destination.pathname.endsWith('/hi3.html');
        transitionTitle.textContent = isDatabase ? 'ACCESSING DATABASE' : 'ACCESSING FILE';
        body.classList.add('is-page-leaving');
        closeMenu();

        window.setTimeout(() => {
            window.location.assign(destination.href);
        }, reduceMotionQuery.matches ? 180 : 960);
    });

    window.addEventListener('pageshow', () => {
        navigationLocked = false;
        body.classList.remove('is-page-leaving');
    });

    /* Prefetch the database document so its navigation feels continuous. */
    if (!window.location.pathname.endsWith('/hi3.html')) {
        const databasePrefetch = document.createElement('link');
        databasePrefetch.rel = 'prefetch';
        databasePrefetch.href = 'hi3.html';
        databasePrefetch.as = 'document';
        document.head.appendChild(databasePrefetch);
    }

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

        const isLargeVisual = image.matches('.hero-figure img, .feature-transmission__visual img, .guide-hero img, .lb-img');
        const distance = isLargeVisual ? 88 : 38;
        const duration = reduceMotionQuery.matches ? 180 : (isLargeVisual ? 920 : 680);
        const delay = reduceMotionQuery.matches ? 0 : Math.min(state.sequence % 8, 7) * 42;

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
                image.style.willChange = '';
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

    /* Site-wide motion system: headings, copy, controls, cards, timelines and footer. */
    const motionSelector = [
        '.site-header .site-brand',
        '.site-header .site-nav > a',
        '.site-header .site-header__status',
        '.home-hero .hero-copy > *',
        '.home-hero .hero-panel',
        '.home-hero .hero-footer > *',
        '.page-hero__copy > *',
        '.page-hero__code',
        '.section-heading > *',
        '.feature-transmission__visual',
        '.feature-transmission__body > *',
        '.archive-card',
        '.profile-statement',
        '.profile-copy > *',
        '.guide-hero > div > *',
        '.guide-grid > *',
        '.story-warning > *',
        '.story-index > *',
        '.story-theme-grid > *',
        '.story-arc__head > *',
        '.story-timeline > *',
        '.story-quote',
        '.photo-grid > *',
        '.gallery-heading > *',
        '.controls',
        '.grid > .card',
        'main > section:not(.home-hero) > h2',
        'main > section:not(.home-hero) > h3',
        'main > section:not(.home-hero) > p',
        'main > section:not(.home-hero) > ul',
        'main > section:not(.home-hero) > ol',
        'main > section:not(.home-hero) > blockquote',
        'main > section:not(.home-hero) > .featured-guide',
        '.site-footer > *',
        'dialog .lb-panel > *'
    ].join(',');

    const motionStates = new WeakMap();
    const pendingMotionElements = new Set();
    let motionSequence = 0;
    let motionCanPlay = !bootScreen;

    const shouldAnimateElement = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element.matches('img, script, style, link, meta, .sr-only, .boot-screen, .page-transition, .page-transition *')) return false;
        if (element.closest('.boot-screen, .page-transition')) return false;
        if (motionStates.has(element)) return false;
        return true;
    };

    const getLocalDelay = (element, sequence) => {
        if (reduceMotionQuery.matches) return 0;

        const parent = element.parentElement;
        if (!parent) return Math.min(sequence % 6, 5) * 48;

        const siblings = Array.from(parent.children).filter((child) => child.matches?.(motionSelector));
        const localIndex = Math.max(0, siblings.indexOf(element));
        return Math.min(localIndex, 7) * 58;
    };

    const getMotionFrame = (element, sequence) => {
        if (reduceMotionQuery.matches) {
            return { x: 0, y: 8, scale: 1, clipPath: 'inset(0 0 0 0)' };
        }

        if (element.closest('.site-header')) {
            return { x: 0, y: -26, scale: 0.99, clipPath: 'inset(0 0 35% 0)' };
        }

        if (element.matches('.archive-card, .guide-card, .story-step, .story-theme-card, .story-index > *, .photo-entry, .grid > .card')) {
            const direction = sequence % 2 === 0 ? -1 : 1;
            return { x: 54 * direction, y: 20, scale: 0.985, clipPath: direction > 0 ? 'inset(0 0 0 16%)' : 'inset(0 16% 0 0)' };
        }

        if (element.matches('a, button, .controls, .hero-panel, .profile-statement')) {
            return { x: 0, y: 30, scale: 0.98, clipPath: 'inset(12% 0 0 0)' };
        }

        if (element.matches('h1, h2, h3, .eyebrow, .update-tag, .page-hero__code')) {
            return { x: -46, y: 0, scale: 0.99, clipPath: 'inset(0 12% 0 0)' };
        }

        return { x: -30, y: 22, scale: 0.995, clipPath: 'inset(0 8% 0 0)' };
    };

    const revealMotionElement = (element) => {
        const state = motionStates.get(element);
        if (!state || state.revealed) return;

        if (!motionCanPlay) {
            pendingMotionElements.add(element);
            return;
        }

        state.revealed = true;
        pendingMotionElements.delete(element);
        element.classList.add('is-visible');
        element.dataset.motionState = 'revealing';
        element.style.visibility = 'visible';

        const frame = getMotionFrame(element, state.sequence);
        const duration = reduceMotionQuery.matches ? 180 : 720;
        const delay = getLocalDelay(element, state.sequence);

        if (typeof element.animate !== 'function') {
            element.style.opacity = '1';
            element.style.visibility = 'visible';
            element.dataset.motionState = 'ready';
            return;
        }

        state.animation = element.animate([
            {
                opacity: 0,
                transform: `translate3d(${frame.x}px, ${frame.y}px, 0) scale(${frame.scale})`,
                clipPath: frame.clipPath,
                filter: reduceMotionQuery.matches ? 'none' : 'blur(3px)'
            },
            {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                clipPath: 'inset(0 0 0 0)',
                filter: 'blur(0)'
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
                if (motionStates.get(element) !== state) return;
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                element.style.transform = '';
                element.style.clipPath = '';
                element.style.filter = '';
                element.style.willChange = '';
                element.dataset.motionState = 'ready';
                state.animation?.cancel();
                state.animation = null;
            });
    };

    const motionObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                revealMotionElement(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -7% 0px',
            threshold: 0.06
        })
        : null;

    const prepareMotionElement = (element) => {
        if (!shouldAnimateElement(element)) return;

        const state = {
            sequence: motionSequence++,
            revealed: false,
            animation: null
        };
        motionStates.set(element, state);
        element.dataset.motionState = 'waiting';
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
        element.style.willChange = 'opacity, transform, clip-path, filter';

        if (motionObserver) {
            motionObserver.observe(element);
        } else {
            revealMotionElement(element);
        }
    };

    const scanMotionElements = (root = document) => {
        if (root instanceof HTMLElement && root.matches(motionSelector)) prepareMotionElement(root);
        root.querySelectorAll?.(motionSelector).forEach(prepareMotionElement);
    };

    const startQueuedMotion = () => {
        motionCanPlay = true;
        const queued = Array.from(pendingMotionElements);
        queued.forEach((element, index) => {
            window.setTimeout(() => revealMotionElement(element), reduceMotionQuery.matches ? 0 : index * 22);
        });
    };

    scanCharacterImages();
    scanMotionElements();

    /* Dynamic cards, search results and lightboxes receive the same animation automatically. */
    const dynamicContentObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
                prepareCharacterImage(mutation.target);
                return;
            }

            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                scanCharacterImages(node);
                scanMotionElements(node);
            });
        });
    });

    dynamicContentObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset']
    });

    const hideBootScreen = () => {
        if (!bootScreen) {
            startQueuedMotion();
            return;
        }

        window.setTimeout(() => {
            bootScreen.classList.add('is-hidden');
            startQueuedMotion();
        }, 500);
        window.setTimeout(() => bootScreen.remove(), 1150);
    };

    if (document.readyState === 'complete') {
        hideBootScreen();
    } else {
        window.addEventListener('load', hideBootScreen, { once: true });
        window.setTimeout(hideBootScreen, 2200);
    }

    if (!bootScreen) {
        window.requestAnimationFrame(() => window.requestAnimationFrame(startQueuedMotion));
    }

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
    }

    const canUseParallax = window.matchMedia('(pointer: fine)').matches && !reduceMotionQuery.matches;

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
