// Keep unrelated UI tests deterministic and avoid duplicate gallery data requests.
// tests/preloader.cjs exercises the real complete-site manifest and network failures.
exports.configure = target => target.route('**/assets/preload-manifest.json', route =>
  route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    resources: [{ url: 'style.css', type: 'fetch' }]
  }) }));
