(() => {
    'use strict';
    const root = new URL('../', document.currentScript.src);
    const timeoutMs = 60000;

    // Read the entire response, not just its headers. Images must also decode.
    async function loadResource(resource, signal) {
        const controller = new AbortController();
        const abort = () => controller.abort();
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
        const timer = setTimeout(abort, timeoutMs);
        try {
            if (resource.type === 'image') {
                await new Promise((resolve, reject) => {
                    const image = new Image();
                    const cleanup = () => {
                        image.onload = image.onerror = null;
                        controller.signal.removeEventListener('abort', cancel);
                    };
                    const fail = () => { cleanup(); reject(new Error('Image unavailable')); };
                    const cancel = () => { fail(); image.src = ''; };
                    controller.signal.addEventListener('abort', cancel, { once: true });
                    image.referrerPolicy = 'no-referrer';
                    image.onload = async () => {
                        try {
                            await image.decode();
                            if (controller.signal.aborted) return;
                            cleanup(); resolve();
                        } catch { fail(); }
                    };
                    image.onerror = fail;
                    if (controller.signal.aborted) cancel();
                    else image.src = new URL(resource.url, root).href;
                });
            } else {
                const response = await fetch(new URL(resource.url, root), {
                    signal: controller.signal, cache: 'default'
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                await response.arrayBuffer();
            }
        } finally {
            clearTimeout(timer);
            signal.removeEventListener('abort', abort);
        }
    }

    function create(onProgress) {
        const controller = new AbortController();
        let resources = null;
        let running = false;
        const complete = new Set();
        const failures = new Map();
        const report = () => onProgress({
            total: resources?.length || 0, loaded: complete.size,
            failed: [...failures.keys()], running
        });
        async function run() {
            if (running || controller.signal.aborted) return false;
            running = true;
            failures.clear();
            report();
            try {
                if (!resources) {
                    const manifestController = new AbortController();
                    const abort = () => manifestController.abort();
                    controller.signal.addEventListener('abort', abort, { once: true });
                    const timer = setTimeout(abort, timeoutMs);
                    try {
                        const response = await fetch(new URL('assets/preload-manifest.json', root), {
                            signal: manifestController.signal, cache: 'no-cache'
                        });
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const manifest = await response.json();
                        if (!Array.isArray(manifest.resources) || !manifest.resources.length ||
                            manifest.resources.some(r => typeof r.url !== 'string' || !r.url)) {
                            throw new Error('Invalid resource manifest');
                        }
                        resources = [...new Map(manifest.resources.map(r => [r.url, r])).values()];
                    } finally {
                        clearTimeout(timer);
                        controller.signal.removeEventListener('abort', abort);
                    }
                }
                report();
                const pending = resources.filter(r => !complete.has(r.url));
                let next = 0;
                await Promise.all(Array.from({ length: Math.min(6, pending.length) }, async () => {
                    while (next < pending.length && !controller.signal.aborted) {
                        const resource = pending[next++];
                        try {
                            await loadResource(resource, controller.signal);
                            if (!controller.signal.aborted) complete.add(resource.url);
                        } catch {
                            if (!controller.signal.aborted) failures.set(resource.url, true);
                        }
                        if (!controller.signal.aborted) report();
                    }
                }));
            } catch {
                if (!controller.signal.aborted) failures.set('assets/preload-manifest.json', true);
            } finally {
                running = false;
                if (!controller.signal.aborted) report();
            }
            return !controller.signal.aborted && resources !== null && complete.size === resources.length;
        }
        return { run, cancel: () => controller.abort() };
    }
    window.BHR_PRELOADER = { create };
})();
