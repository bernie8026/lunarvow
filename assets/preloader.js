(() => {
    'use strict';
    const root = new URL('../', document.currentScript.src);
    const timeoutMs = 60000;
    const failure = (code, status) => Object.assign(new Error(code), { code, status });
    const details = error => ({ code: error.code || 'network', ...(error.status ? { status: error.status } : {}) });
    let styleRetry = 0;

    // A successful fetch does not prove that the browser applied its stylesheet.
    const stylesApplied = link => {
        try { return !!link.sheet?.cssRules.length; } catch { return false; }
    };
    const waitForDocument = signal => new Promise((resolve, reject) => {
        if (document.readyState === 'complete') { resolve(); return; }
        const cleanup = () => {
            clearTimeout(timer);
            window.removeEventListener('load', loaded);
            signal.removeEventListener('abort', cancel);
        };
        const loaded = () => { cleanup(); resolve(); };
        const cancel = () => { cleanup(); reject(failure('stylesheet')); };
        const timer = setTimeout(cancel, timeoutMs);
        window.addEventListener('load', loaded, { once: true });
        signal.addEventListener('abort', cancel, { once: true });
        if (signal.aborted) cancel();
    });
    const reloadStylesheet = (link, source, signal) => new Promise((resolve, reject) => {
        const cleanup = () => {
            clearTimeout(timer);
            link.removeEventListener('load', loaded);
            link.removeEventListener('error', failed);
            signal.removeEventListener('abort', failed);
        };
        const failed = () => { cleanup(); reject(failure('stylesheet')); };
        const loaded = () => { if (!stylesApplied(link)) { failed(); return; } cleanup(); resolve(); };
        const timer = setTimeout(failed, timeoutMs);
        link.addEventListener('load', loaded, { once: true });
        link.addEventListener('error', failed, { once: true });
        signal.addEventListener('abort', failed, { once: true });
        if (signal.aborted) { failed(); return; }
        const retryURL = new URL(source);
        retryURL.searchParams.set('_bhr_style_retry', `${Date.now()}-${++styleRetry}`);
        // Keep the same element and cascade position; bypass only its stale URL.
        link.href = retryURL.href;
    });

    // Read the entire response, not just its headers. Images must also decode.
    async function loadResource(resource, signal) {
        const controller = new AbortController();
        const abort = () => controller.abort();
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; abort(); }, timeoutMs);
        try {
            if (resource.type === 'image') {
                await new Promise((resolve, reject) => {
                    const image = new Image();
                    const cleanup = () => {
                        image.onload = image.onerror = null;
                        controller.signal.removeEventListener('abort', cancel);
                    };
                    const fail = () => { cleanup(); reject(failure('image')); };
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
                if (!response.ok) throw failure('http', response.status);
                await response.arrayBuffer();
            }
        } catch (error) {
            if (timedOut) throw failure('timeout');
            throw error;
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
            failed: [...failures.keys()], errors: [...failures].map(([url, error]) => ({ url, ...error })), running
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
                    let timedOut = false;
                    const timer = setTimeout(() => { timedOut = true; abort(); }, timeoutMs);
                    try {
                        const response = await fetch(new URL('assets/preload-manifest.json', root), {
                            signal: manifestController.signal, cache: 'no-cache'
                        });
                        if (!response.ok) throw failure('http', response.status);
                        const manifest = await response.json();
                        if (!Array.isArray(manifest.resources) || !manifest.resources.length ||
                            manifest.resources.some(r => typeof r.url !== 'string' || !r.url)) {
                            throw failure('manifest');
                        }
                        resources = [...new Map(manifest.resources.map(r => [r.url, r])).values()];
                    } catch (error) {
                        if (timedOut) throw failure('timeout');
                        if (error instanceof SyntaxError) throw failure('manifest');
                        throw error;
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
                        } catch (error) {
                            if (!controller.signal.aborted) failures.set(resource.url, details(error));
                        }
                        if (!controller.signal.aborted) report();
                    }
                }));
                // Include styles injected by the language system before the load event.
                try {
                    await waitForDocument(controller.signal);
                    const links = [...document.querySelectorAll('link[rel~="stylesheet"][href]')];
                    await Promise.all(links.map(async link => {
                        const source = new URL(link.href);
                        source.searchParams.delete('_bhr_style_retry');
                        if (!source.href.startsWith(root.href) || link.disabled || stylesApplied(link)) return;
                        const url = source.href.slice(root.href.length);
                        try {
                            await reloadStylesheet(link, source, controller.signal);
                        } catch (error) {
                            if (!controller.signal.aborted) {
                                complete.delete(url);
                                failures.set(url, details(error));
                            }
                        }
                    }));
                } catch (error) {
                    if (!controller.signal.aborted) failures.set('Current page / stylesheets', details(error));
                }
            } catch (error) {
                if (!controller.signal.aborted) failures.set('assets/preload-manifest.json', details(error));
            } finally {
                running = false;
                if (!controller.signal.aborted) report();
            }
            return !controller.signal.aborted && resources !== null && complete.size === resources.length && !failures.size;
        }
        return { run, cancel: () => controller.abort() };
    }
    window.BHR_PRELOADER = { create };
})();
