/* eslint-disable */
(function () {
  'use strict';

  if (typeof window.Pjax === 'undefined') return;
  if (typeof window.Pjax.isSupported === 'function' && !window.Pjax.isSupported()) return;

  var CONTAINER = '#pjax-container';
  // `head > title` avoids matching SVG <title> elements inside articles.
  var SELECTORS = ['head > title', CONTAINER];

  // These are the head tags that depend on the current page. Replacing them
  // avoids using a `head` selector (which would re-run every script in <head>).
  var META_SELECTORS = [
    'meta[name="description"]',
    'meta[name="keywords"]',
    'meta[name^="twitter:"]',
    'meta[property^="og:"]',
    'meta[property^="article:"]',
    'link[rel="canonical"]'
  ];

  var loadingTimer = null;
  var finishTimer = null;

  function showLoadingBar() {
    var wrapper = document.getElementById('loading-bar-wrapper');
    if (!wrapper) return;

    clearTimeout(finishTimer);

    var bar = document.getElementById('loading-bar');
    if (bar) {
      // Reset without animating backwards from 100% to 0%.
      bar.style.transition = 'none';
      bar.style.width = '0%';
    }

    // jQuery.fadeOut() leaves both display:none and opacity:0 behind.
    wrapper.style.display = '';
    wrapper.style.opacity = '1';

    if (bar) {
      // Force the reset to be applied before the transition is restored.
      void bar.offsetWidth;
      bar.style.transition = '';
    }

    clearTimeout(loadingTimer);
    if (typeof window.setLoadingBarProgress === 'function') {
      loadingTimer = setTimeout(function () {
        window.setLoadingBarProgress(40);
      }, 30);
    }
  }

  function finishLoadingBar() {
    clearTimeout(loadingTimer);
    if (typeof window.setLoadingBarProgress === 'function') {
      window.setLoadingBarProgress(100);
    }
    clearTimeout(finishTimer);
    finishTimer = setTimeout(function () {
      var wrapper = document.getElementById('loading-bar-wrapper');
      if (!wrapper) return;
      if (window.jQuery) {
        window.jQuery(wrapper).fadeOut(500);
      } else {
        wrapper.style.display = 'none';
      }
    }, 300);
  }

  function syncDocument(doc) {
    if (!doc) return;

    if (doc.body && typeof doc.body.className === 'string') {
      document.body.className = doc.body.className;
    }

    if (!doc.head || !document.head) return;

    META_SELECTORS.forEach(function (selector) {
      var oldNodes = document.head.querySelectorAll(selector);
      var i;
      for (i = 0; i < oldNodes.length; i++) {
        oldNodes[i].parentNode.removeChild(oldNodes[i]);
      }

      var newNodes = doc.head.querySelectorAll(selector);
      for (i = 0; i < newNodes.length; i++) {
        document.head.appendChild(newNodes[i].cloneNode(true));
      }
    });
  }

  // Pjax only executes classic scripts. ES module scripts (used by Waline)
  // must be re-created so the browser evaluates them again.
  function activateModuleScripts(root) {
    if (!root) return;

    var scripts = root.querySelectorAll('script[type="module"]');
    Array.prototype.forEach.call(scripts, function (oldScript) {
      var script = document.createElement('script');
      Array.prototype.forEach.call(oldScript.attributes, function (attr) {
        script.setAttribute(attr.name, attr.value);
      });
      script.text = oldScript.text || oldScript.textContent || '';
      oldScript.parentNode.replaceChild(script, oldScript);
    });
  }

  // Busuanzi only counts the initial page view by itself. Re-running its
  // script updates the per-post counter after a PJAX navigation.
  function refreshBusuanzi() {
    var oldScript = document.querySelector('script[data-busuanzi]');
    if (!oldScript) return;

    var script = document.createElement('script');
    script.src = oldScript.src;
    script.async = true;
    script.setAttribute('data-busuanzi', '');
    oldScript.parentNode.replaceChild(script, oldScript);
  }

  var pjax;
  try {
    pjax = new window.Pjax({
      // Do not hijack new-tab links, downloads, opt-out links or external links.
      // In-page anchors (including the TOC) are left to the theme/browser.
      elements:
        'a[href]:not([href^="#"]):not([target="_blank"]):not([download]):not([data-no-pjax]):not([data-pjax="false"]):not([rel~="external"]), form[action]',
      selectors: SELECTORS,
      cacheBust: false,
      analytics: false,
      scrollTo: 0,
      scrollRestoration: true,
      timeout: 10000
    });
  } catch (e) {
    // Never break normal navigation just because PJAX failed to start.
    return;
  }

  if (!pjax || typeof pjax.refresh !== 'function') return;

  window.materialFlowPjax = pjax;

  document.addEventListener('pjax:send', function () {
    if (window.MaterialFlow && typeof window.MaterialFlow.beforePjax === 'function') {
      window.MaterialFlow.beforePjax();
    }
    showLoadingBar();
  });

  document.addEventListener('pjax:success', function (event) {
    var doc = null;
    var request = event.request;

    if (request && request.responseText) {
      try {
        doc = new DOMParser().parseFromString(request.responseText, 'text/html');
      } catch (e) {
        doc = null;
      }
    }

    syncDocument(doc);

    if (window.MaterialFlow && typeof window.MaterialFlow.refresh === 'function') {
      window.MaterialFlow.refresh();
    }

    activateModuleScripts(document.querySelector(CONTAINER));
    refreshBusuanzi();
  });

  document.addEventListener('pjax:complete', function () {
    finishLoadingBar();
  });

  document.addEventListener('pjax:error', function () {
    // Keep the old page usable when a request fails.
    if (window.MaterialFlow && typeof window.MaterialFlow.restoreAfterPjaxError === 'function') {
      window.MaterialFlow.restoreAfterPjaxError();
    }
  });

  document.addEventListener('material-flow:search-results', function () {
    var search = document.getElementById('u-search');
    if (search) pjax.refresh(search);
  });
})();
