(() => {
  'use strict';

  const replacements = [
    ['泰蕾瑪·納特里斯庫', '瑟莉姆·納特里斯庫'],
    ['泰蕾玛·纳特里斯库', '瑟莉姆·纳特里斯库'],
    ['泰蕾瑪', '瑟莉姆'],
    ['泰蕾玛', '瑟莉姆']
  ];

  const attributes = ['aria-label', 'alt', 'title', 'placeholder'];
  let mutationLock = false;

  const correctName = (value) => {
    let output = value || '';
    replacements.forEach(([incorrect, correct]) => {
      if (output.includes(incorrect)) output = output.split(incorrect).join(correct);
    });
    return output;
  };

  const applyTextNode = (node) => {
    if (!(node instanceof Text)) return;
    if (node.parentElement?.closest('script, style, noscript, code, pre')) return;
    const corrected = correctName(node.nodeValue);
    if (corrected !== node.nodeValue) node.nodeValue = corrected;
  };

  const applyAttributes = (element) => {
    if (!(element instanceof Element)) return;
    attributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute) || '';
      const corrected = correctName(current);
      if (corrected !== current) element.setAttribute(attribute, corrected);
    });
  };

  const scan = (root = document) => {
    mutationLock = true;
    try {
      if (root instanceof Text) applyTextNode(root);
      if (root instanceof Element) applyAttributes(root);

      const scope = root instanceof Document ? root.documentElement : root;
      if (!scope) return;

      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) applyTextNode(node);

      scope.querySelectorAll?.(attributes.map((attribute) => `[${attribute}]`).join(','))
        .forEach(applyAttributes);
    } finally {
      mutationLock = false;
    }
  };

  const patchPublicTranslator = () => {
    const translator = window.BHR_I18N;
    if (!translator || translator.__thelemaNamePatched) return false;

    const originalTranslate = translator.translate.bind(translator);
    translator.translate = (value, language) => correctName(originalTranslate(value, language));
    Object.defineProperty(translator, '__thelemaNamePatched', {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false
    });
    return true;
  };

  const observer = new MutationObserver((mutations) => {
    if (mutationLock) return;
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        applyTextNode(mutation.target);
        return;
      }

      if (mutation.type === 'attributes') {
        applyAttributes(mutation.target);
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (node instanceof Text || node instanceof Element) scan(node);
      });
    });
  });

  const start = () => {
    scan(document);
    patchPublicTranslator();

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attributes
    });

    window.addEventListener('bhr:languagechange', () => {
      window.requestAnimationFrame(() => scan(document));
    });

    let attempts = 0;
    const translatorTimer = window.setInterval(() => {
      attempts += 1;
      if (patchPublicTranslator() || attempts >= 40) window.clearInterval(translatorTimer);
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
